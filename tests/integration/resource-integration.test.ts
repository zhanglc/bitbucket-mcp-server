import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BitbucketMCPServer } from '../../src/index';

// Mock environment variables for testing
const mockEnv = {
  BITBUCKET_USERNAME: 'test.user@company.com',
  BITBUCKET_TOKEN: 'test-token',
  BITBUCKET_BASE_URL: 'https://bitbucket.company.com'
};

// Mock process.env
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, ...mockEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Resource Integration Tests', () => {
  let server: BitbucketMCPServer;

  beforeEach(() => {
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    server = new BitbucketMCPServer();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Resource Discovery', () => {
    it('should expose resources capability', () => {
      const capabilities = server.getCapabilities();
      
      expect(capabilities).toHaveProperty('resources');
      expect(capabilities.resources).toBeDefined();
    });

    it('should list all available resources', async () => {
      const resources = await server.listResources();
      
      expect(resources).toHaveProperty('resources');
      expect(Array.isArray(resources.resources)).toBe(true);
      expect(resources.resources.length).toBeGreaterThan(5);
      
      // Verify key resources are present
      const uris = resources.resources.map(r => r.uri);
      expect(uris).toContain('bitbucket://pull-requests/fields/schema');
      expect(uris).toContain('bitbucket://pull-requests/fields/list');
      expect(uris).toContain('bitbucket://server/info');
    });

    it('should list resource templates in main resources response', async () => {
      const resources = await server.listResources();
      
      expect(resources).toHaveProperty('resourceTemplates');
      expect(Array.isArray(resources.resourceTemplates)).toBe(true);
      
      const uriTemplates = resources.resourceTemplates.map(t => t.uriTemplate);
      expect(uriTemplates).toContain('bitbucket://pull-requests/fields/{field_name}');
    });
  });

  describe('Resource Content', () => {
    it('should read pull request field schema', async () => {
      const resource = await server.readResource('bitbucket://pull-requests/fields/schema');
      
      expect(resource).toHaveProperty('contents');
      expect(resource.contents).toHaveLength(1);
      expect(resource.contents[0].type).toBe('text');
      
      const schema = JSON.parse(resource.contents[0].text);
      expect(schema).toHaveProperty('id');
      expect(schema).toHaveProperty('title');
      expect(schema.id).toHaveProperty('type', 'number');
    });

    it('should read field list in correct format', async () => {
      const resource = await server.readResource('bitbucket://pull-requests/fields/list');
      
      const fieldsList = resource.contents[0].text;
      const fields = fieldsList.trim().split('\n');
      
      expect(fields).toContain('id');
      expect(fields).toContain('title');
      expect(fields).toContain('reviewers');
      
      // Should be sorted alphabetically
      const sortedFields = [...fields].sort();
      expect(fields).toEqual(sortedFields);
    });

    it('should read specific field definition', async () => {
      const resource = await server.readResource('bitbucket://pull-requests/fields/reviewers');
      
      const fieldDef = JSON.parse(resource.contents[0].text);
      expect(fieldDef).toHaveProperty('name', 'reviewers');
      expect(fieldDef).toHaveProperty('type', 'array');
      expect(fieldDef).toHaveProperty('examples');
      expect(fieldDef.examples).toContain('reviewers.name');
    });

    it('should read examples content', async () => {
      const resource = await server.readResource('bitbucket://pull-requests/examples/basic');
      
      const content = resource.contents[0].text;
      expect(content).toContain('# Basic Pull Request Queries');
      expect(content).toContain('list_pull_requests');
      expect(content).toContain('```');
    });

    it('should read server information', async () => {
      const resource = await server.readResource('bitbucket://server/info');
      
      const content = resource.contents[0].text;
      expect(content).toContain('Server Type:');
      expect(content).toContain('Base URL: https://bitbucket.company.com');
    });
  });

  describe('Resource Error Handling', () => {
    it('should handle invalid URI scheme', async () => {
      await expect(
        server.readResource('invalid://scheme')
      ).rejects.toThrow('Invalid resource URI');
    });

    it('should handle unknown resource', async () => {
      await expect(
        server.readResource('bitbucket://unknown/resource')
      ).rejects.toThrow('Resource not found');
    });

    it('should handle invalid field name', async () => {
      await expect(
        server.readResource('bitbucket://pull-requests/fields/nonexistent')
      ).rejects.toThrow('Unknown field');
    });
  });

  describe('Resource-Tool Integration', () => {
    it('should provide resources that complement list_pull_requests tool', async () => {
      // Get tool definition
      const tools = await server.listTools();
      const listPRTool = tools.tools.find(t => t.name === 'list_pull_requests');
      
      expect(listPRTool).toBeDefined();
      expect(listPRTool?.inputSchema.properties).toHaveProperty('fields');
      
      // Get corresponding resource
      const resource = await server.readResource('bitbucket://pull-requests/fields/schema');
      const schema = JSON.parse(resource.contents[0].text);
      
      // Verify resource provides useful information for the tool
      expect(schema).toHaveProperty('id');
      expect(schema).toHaveProperty('title');
      expect(schema).toHaveProperty('reviewers');
    });

    it('should provide practical examples for tool usage', async () => {
      const basicExamples = await server.readResource('bitbucket://pull-requests/examples/basic');
      const fieldsExamples = await server.readResource('bitbucket://pull-requests/examples/fields-filtering');
      
      const basicContent = basicExamples.contents[0].text;
      const fieldsContent = fieldsExamples.contents[0].text;
      
      // Should contain actual tool invocations
      expect(basicContent).toContain('list_pull_requests');
      expect(fieldsContent).toContain('fields=');
      
      // Should show parameter usage
      expect(basicContent).toContain('workspace=');
      expect(basicContent).toContain('repository=');
      expect(fieldsContent).toContain('reviewers.name');
    });
  });

  describe('Content Quality', () => {
    it('should provide well-formatted markdown examples', async () => {
      const examples = [
        'bitbucket://pull-requests/examples/basic',
        'bitbucket://pull-requests/examples/fields-filtering',
        'bitbucket://pull-requests/docs/api-reference'
      ];
      
      for (const uri of examples) {
        const resource = await server.readResource(uri);
        const content = resource.contents[0].text;
        
        // Should have proper markdown structure
        expect(content).toMatch(/^# /m); // Has main heading
        expect(content).toContain('```'); // Has code blocks
        expect(content).toMatch(/^## /m); // Has subheadings
      }
    });

    it('should provide accurate field information', async () => {
      const fieldList = await server.readResource('bitbucket://pull-requests/fields/list');
      const fieldSchema = await server.readResource('bitbucket://pull-requests/fields/schema');
      
      const listFields = fieldList.contents[0].text.trim().split('\n');
      const schemaFields = Object.keys(JSON.parse(fieldSchema.contents[0].text));
      
      // List and schema should have same fields
      expect(listFields.sort()).toEqual(schemaFields.sort());
    });

    it('should provide consistent field definitions', async () => {
      // Test a few key fields
      const testFields = ['id', 'title', 'reviewers', 'state'];
      
      for (const field of testFields) {
        const resource = await server.readResource(`bitbucket://pull-requests/fields/${field}`);
        const fieldDef = JSON.parse(resource.contents[0].text);
        
        expect(fieldDef).toHaveProperty('name', field);
        expect(fieldDef).toHaveProperty('type');
        expect(fieldDef).toHaveProperty('description');
        expect(typeof fieldDef.description).toBe('string');
        expect(fieldDef.description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('Performance', () => {
    it('should respond to resource requests quickly', async () => {
      const start = Date.now();
      
      await server.readResource('bitbucket://pull-requests/fields/schema');
      await server.readResource('bitbucket://pull-requests/fields/list');
      await server.readResource('bitbucket://server/info');
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should be very fast for static content
    });

    it('should cache static content efficiently', async () => {
      // Read same resource multiple times
      const uri = 'bitbucket://pull-requests/fields/schema';
      
      const start = Date.now();
      for (let i = 0; i < 5; i++) {
        await server.readResource(uri);
      }
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(50); // Should be cached
    });
  });
});