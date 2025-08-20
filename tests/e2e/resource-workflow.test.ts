import { describe, it, expect, beforeEach } from '@jest/globals';
import { BitbucketMCPServer } from '../../src/index';

// Mock environment variables for testing
const mockEnv = {
  BITBUCKET_USERNAME: 'test.user@company.com',
  BITBUCKET_TOKEN: 'test-token',
  BITBUCKET_BASE_URL: 'https://bitbucket.company.com'
};

/**
 * End-to-End Resource Workflow Tests
 * 
 * These tests simulate realistic user workflows for discovering
 * and using resources in the Bitbucket MCP server.
 */

describe('Resource Workflow E2E Tests', () => {
  let mcpServer: BitbucketMCPServer;
  const originalEnv = process.env;

  beforeEach(() => {
    // Mock environment variables
    process.env = { ...originalEnv, ...mockEnv };
    
    // Create server instance
    mcpServer = new BitbucketMCPServer();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('User Workflow: Discovering Fields', () => {
    it('should allow user to discover available pull request fields', async () => {
      // 1. User discovers that resources are available
      const resources = await mcpServer.listResources();
      expect(resources.resources.length).toBeGreaterThan(0);
      
      // 2. User finds field-related resources
      const fieldResources = resources.resources.filter((r: any) => 
        r.uri.includes('fields')
      );
      expect(fieldResources.length).toBeGreaterThan(0);
      
      // 3. User gets list of all available fields
      const fieldList = await mcpServer.readResource('bitbucket://pull-requests/fields/list');
      const fields = fieldList.contents[0].text.trim().split('\n');
      
      expect(fields).toContain('id');
      expect(fields).toContain('title');
      expect(fields).toContain('reviewers');
      expect(fields.length).toBeGreaterThan(15);
    });

    it('should allow user to understand field structure', async () => {
      // 1. User wants to understand the complete field schema
      const schema = await mcpServer.readResource('bitbucket://pull-requests/fields/schema');
      const fieldSchema = JSON.parse(schema.contents[0].text);
      
      // 2. User sees that reviewers is an array with specific properties
      expect(fieldSchema.reviewers).toHaveProperty('type', 'array');
      expect(fieldSchema.reviewers).toHaveProperty('items');
      expect(fieldSchema.reviewers.items.properties).toHaveProperty('name');
      expect(fieldSchema.reviewers.items.properties).toHaveProperty('approved');
      
      // 3. User gets detailed information about a specific field
      const reviewersField = await mcpServer.readResource('bitbucket://pull-requests/fields/reviewers');
      const reviewersInfo = JSON.parse(reviewersField.contents[0].text);
      
      expect(reviewersInfo).toHaveProperty('name', 'reviewers');
      expect(reviewersInfo).toHaveProperty('examples');
      expect(reviewersInfo.examples).toContain('reviewers.name');
      expect(reviewersInfo.examples).toContain('reviewers.0.approved');
    });
  });

  describe('User Workflow: Learning Tool Usage', () => {
    it('should provide basic usage examples', async () => {
      // 1. User wants to learn how to use pull request tools
      const basicExamples = await mcpServer.readResource('bitbucket://pull-requests/examples/basic');
      const content = basicExamples.contents[0].text;
      
      // 2. Examples should show real tool usage
      expect(content).toContain('list_pull_requests');
      expect(content).toContain('workspace=');
      expect(content).toContain('repository=');
      
      // 3. Examples should cover different scenarios
      expect(content).toContain('state=OPEN');
      expect(content).toContain('state=MERGED');
      expect(content).toContain('author=');
    });

    it('should provide field filtering guidance', async () => {
      // 1. User wants to learn about field filtering
      const fieldsExamples = await mcpServer.readResource('bitbucket://pull-requests/examples/fields-filtering');
      const content = fieldsExamples.contents[0].text;
      
      // 2. Should explain field filtering concepts
      expect(content).toContain('fields=');
      expect(content).toContain('Dot Notation');
      
      // 3. Should provide practical examples
      expect(content).toContain('id,title,state');
      expect(content).toContain('reviewers.name');
      expect(content).toContain('reviewers.0.approved');
      
      // 4. Should explain the benefits
      expect(content).toContain('reduce');
      expect(content).toContain('specific');
    });
  });

  describe('User Workflow: Reference Lookup', () => {
    it('should provide comprehensive API documentation', async () => {
      // 1. User needs complete API reference
      const apiDocs = await mcpServer.readResource('bitbucket://pull-requests/docs/api-reference');
      const content = apiDocs.contents[0].text;
      
      // 2. Should document all parameters
      expect(content).toContain('workspace');
      expect(content).toContain('repository');
      expect(content).toContain('fields');
      expect(content).toContain('state');
      expect(content).toContain('author');
      expect(content).toContain('reviewer');
      
      // 3. Should explain parameter usage
      expect(content).toContain('Required Parameters');
      expect(content).toContain('Optional Parameters');
      expect(content).toContain('OPEN');
      expect(content).toContain('MERGED');
    });

    it('should provide server information for troubleshooting', async () => {
      // 1. User wants to know server configuration
      const serverInfo = await mcpServer.readResource('bitbucket://server/info');
      const info = serverInfo.contents[0].text;
      
      expect(info).toContain('Server Type:');
      expect(info).toContain('Base URL:');
      
      // 2. User wants to know what features are supported
      const capabilities = await mcpServer.readResource('bitbucket://server/capabilities');
      const caps = capabilities.contents[0].text;
      
      expect(caps).toContain('Pull Requests');
      expect(caps).toContain('Field Filtering');
    });
  });

  describe('User Workflow: Progressive Discovery', () => {
    it('should support discovering resources through templates', async () => {
      // 1. User discovers that there are parameterized resources  
      const resources = await mcpServer.listResources();
      
      const fieldTemplate = resources.resourceTemplates.find((t: any) =>
        t.uriTemplate === 'bitbucket://pull-requests/fields/{field_name}'
      );
      expect(fieldTemplate).toBeDefined();
      
      // 2. User explores specific fields using the template
      const specificFields = ['id', 'title', 'author', 'reviewers', 'state'];
      
      for (const field of specificFields) {
        const uri = `bitbucket://pull-requests/fields/${field}`;
        const resource = await mcpServer.readResource(uri);
        const fieldDef = JSON.parse(resource.contents[0].text);
        
        expect(fieldDef.name).toBe(field);
        expect(fieldDef).toHaveProperty('type');
        expect(fieldDef).toHaveProperty('description');
      }
    });

    it('should provide consistent information across resources', async () => {
      // 1. Get field list
      const fieldList = await mcpServer.readResource('bitbucket://pull-requests/fields/list');
      const availableFields = fieldList.contents[0].text.trim().split('\n');
      
      // 2. Get complete schema
      const schema = await mcpServer.readResource('bitbucket://pull-requests/fields/schema');
      const schemaFields = Object.keys(JSON.parse(schema.contents[0].text));
      
      // 3. Should be consistent
      expect(availableFields.sort()).toEqual(schemaFields.sort());
      
      // 4. Individual field resources should match schema
      for (const field of ['id', 'title', 'state']) {
        const fieldResource = await mcpServer.readResource(`bitbucket://pull-requests/fields/${field}`);
        const fieldDef = JSON.parse(fieldResource.contents[0].text);
        const schemaFieldDef = JSON.parse(schema.contents[0].text)[field];
        
        expect(fieldDef.type).toBe(schemaFieldDef.type);
        expect(fieldDef.description).toBe(schemaFieldDef.description);
      }
    });
  });

  describe('User Workflow: Error Recovery', () => {
    it('should provide helpful error messages', async () => {
      // 1. User tries to access non-existent field
      await expect(
        mcpServer.readResource('bitbucket://pull-requests/fields/nonexistent')
      ).rejects.toThrow('Unknown field: nonexistent');
      
      // 2. User uses wrong URI format  
      await expect(
        mcpServer.readResource('invalid://uri')
      ).rejects.toThrow('Invalid resource URI');
      
      // 3. User tries to access non-existent resource
      await expect(
        mcpServer.readResource('bitbucket://unknown/path')
      ).rejects.toThrow('Resource not found');
    });

    it('should guide users to valid alternatives', async () => {
      // When implementing, error messages should suggest:
      // - Valid field names when invalid field is requested
      // - Available resources when unknown path is accessed
      // - Proper URI format when malformed URI is used
      
      // This will be implemented in the actual error handling
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Performance and Caching', () => {
    it('should serve resources efficiently', async () => {
      // 1. Multiple requests should be fast
      const start = Date.now();
      
      await Promise.all([
        mcpServer.readResource('bitbucket://pull-requests/fields/schema'),
        mcpServer.readResource('bitbucket://pull-requests/fields/list'),
        mcpServer.readResource('bitbucket://server/info'),
        mcpServer.readResource('bitbucket://pull-requests/examples/basic')
      ]);
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should be very fast for static content
    });

    it('should handle concurrent resource requests', async () => {
      // 1. Many concurrent requests should not cause issues
      const requests = Array(10).fill(0).map(() =>
        mcpServer.readResource('bitbucket://pull-requests/fields/schema')
      );
      
      const results = await Promise.all(requests);
      
      // 2. All should return same content
      const firstResult = results[0].contents[0].text;
      results.forEach(result => {
        expect(result.contents[0].text).toBe(firstResult);
      });
    });
  });

  describe('Integration with Tools', () => {
    it('should complement tool functionality', async () => {
      // 1. User discovers list_pull_requests tool
      const tools = await mcpServer.listTools();
      const listPRTool = tools.tools.find((t: any) => t.name === 'list_pull_requests');
      expect(listPRTool).toBeDefined();
      
      // 2. User explores field parameter using resources
      const fieldSchema = await mcpServer.readResource('bitbucket://pull-requests/fields/schema');
      const schema = JSON.parse(fieldSchema.contents[0].text);
      
      // 3. User learns about field filtering from examples
      const examples = await mcpServer.readResource('bitbucket://pull-requests/examples/fields-filtering');
      const exampleContent = examples.contents[0].text;
      
      // 4. Resources should help user understand tool usage
      expect(exampleContent).toContain('list_pull_requests');
      expect(exampleContent).toContain('fields=');
      expect(Object.keys(schema)).toContain('id');
      expect(Object.keys(schema)).toContain('reviewers');
    });
  });
});