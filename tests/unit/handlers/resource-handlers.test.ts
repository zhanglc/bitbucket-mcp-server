import { describe, it, expect, beforeEach } from '@jest/globals';
import { ResourceHandlers } from '../../../src/handlers/resource-handlers';

describe('ResourceHandlers', () => {
  let resourceHandlers: ResourceHandlers;

  beforeEach(() => {
    resourceHandlers = new ResourceHandlers();
  });

  describe('listResources', () => {
    it('should return all available resources', async () => {
      const result = await resourceHandlers.listResources();
      
      expect(result).toHaveProperty('resources');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);
    });

    it('should include pull request field resources', async () => {
      const result = await resourceHandlers.listResources();
      
      const prResources = result.resources.filter(r => 
        r.uri.startsWith('bitbucket://pull-requests/')
      );
      
      expect(prResources.length).toBeGreaterThanOrEqual(5);
      
      // Check specific resources exist
      const uris = prResources.map(r => r.uri);
      expect(uris).toContain('bitbucket://pull-requests/fields/schema');
      expect(uris).toContain('bitbucket://pull-requests/fields/list');
      expect(uris).toContain('bitbucket://pull-requests/examples/basic');
      expect(uris).toContain('bitbucket://pull-requests/examples/fields-filtering');
      expect(uris).toContain('bitbucket://pull-requests/docs/api-reference');
    });

    it('should include server information resources', async () => {
      const result = await resourceHandlers.listResources();
      
      const serverResources = result.resources.filter(r => 
        r.uri.startsWith('bitbucket://server/')
      );
      
      expect(serverResources.length).toBeGreaterThanOrEqual(2);
      
      const uris = serverResources.map(r => r.uri);
      expect(uris).toContain('bitbucket://server/info');
      expect(uris).toContain('bitbucket://server/capabilities');
    });

    it('should have proper resource metadata', async () => {
      const result = await resourceHandlers.listResources();
      
      result.resources.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        
        expect(typeof resource.uri).toBe('string');
        expect(typeof resource.name).toBe('string');
        expect(typeof resource.description).toBe('string');
        expect(typeof resource.mimeType).toBe('string');
        
        expect(resource.uri).toMatch(/^bitbucket:\/\//);
      });
    });

    it('should include correct MIME types', async () => {
      const result = await resourceHandlers.listResources();
      
      const schemaResource = result.resources.find(r => 
        r.uri === 'bitbucket://pull-requests/fields/schema'
      );
      expect(schemaResource?.mimeType).toBe('application/json');
      
      const listResource = result.resources.find(r => 
        r.uri === 'bitbucket://pull-requests/fields/list'
      );
      expect(listResource?.mimeType).toBe('text/plain');
      
      const exampleResource = result.resources.find(r => 
        r.uri === 'bitbucket://pull-requests/examples/basic'
      );
      expect(exampleResource?.mimeType).toBe('text/markdown');
    });
  });

  describe('listResources (including templates)', () => {
    it('should return both resources and resource templates', async () => {
      const result = await resourceHandlers.listResources();
      
      expect(result).toHaveProperty('resources');
      expect(result).toHaveProperty('resourceTemplates');
      expect(Array.isArray(result.resources)).toBe(true);
      expect(Array.isArray(result.resourceTemplates)).toBe(true);
    });

    it('should include field-specific template', async () => {
      const result = await resourceHandlers.listResources();
      
      const fieldTemplate = result.resourceTemplates.find(t => 
        t.uriTemplate === 'bitbucket://pull-requests/fields/{field_name}'
      );
      
      expect(fieldTemplate).toBeDefined();
      expect(fieldTemplate?.name).toBe('Pull Request Field Definition');
      expect(fieldTemplate?.description).toContain('specific field');
      expect(fieldTemplate?.mimeType).toBe('application/json');
    });

    it('should include example-specific template', async () => {
      const result = await resourceHandlers.listResources();
      
      const exampleTemplate = result.resourceTemplates.find(t => 
        t.uriTemplate === 'bitbucket://pull-requests/examples/{example_type}'
      );
      
      expect(exampleTemplate).toBeDefined();
      expect(exampleTemplate?.name).toBe('Pull Request Examples');
      expect(exampleTemplate?.mimeType).toBe('text/markdown');
    });
  });

  describe('readResource', () => {
    describe('pull-requests/fields/schema', () => {
      it('should return complete field schema as JSON', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/schema');
        
        expect(result).toHaveProperty('contents');
        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].type).toBe('text');
        
        const content = JSON.parse(result.contents[0].text);
        expect(content).toHaveProperty('id');
        expect(content).toHaveProperty('title');
        expect(content).toHaveProperty('author');
        expect(content).toHaveProperty('reviewers');
        
        // Validate schema structure
        expect(content.id).toHaveProperty('type', 'number');
        expect(content.id).toHaveProperty('description');
        expect(content.reviewers).toHaveProperty('type', 'array');
        expect(content.reviewers).toHaveProperty('items');
      });
    });

    describe('pull-requests/fields/list', () => {
      it('should return field names as plain text', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/list');
        
        expect(result.contents[0].type).toBe('text');
        
        const fieldsList = result.contents[0].text;
        const fields = fieldsList.trim().split('\n');
        
        expect(fields).toContain('id');
        expect(fields).toContain('title');
        expect(fields).toContain('author');
        expect(fields).toContain('reviewers');
        expect(fields).toContain('state');
        expect(fields.length).toBeGreaterThan(15);
      });

      it('should have fields sorted alphabetically', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/list');
        
        const fieldsList = result.contents[0].text;
        const fields = fieldsList.trim().split('\n');
        const sortedFields = [...fields].sort();
        
        expect(fields).toEqual(sortedFields);
      });
    });

    describe('pull-requests/fields/{field_name}', () => {
      it('should return specific field definition for valid field', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/id');
        
        expect(result.contents[0].type).toBe('text');
        
        const fieldDef = JSON.parse(result.contents[0].text);
        expect(fieldDef).toHaveProperty('name', 'id');
        expect(fieldDef).toHaveProperty('type', 'number');
        expect(fieldDef).toHaveProperty('description');
        expect(fieldDef.description).toContain('identifier');
      });

      it('should return complex field definition for reviewers', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/reviewers');
        
        const fieldDef = JSON.parse(result.contents[0].text);
        expect(fieldDef).toHaveProperty('name', 'reviewers');
        expect(fieldDef).toHaveProperty('type', 'array');
        expect(fieldDef).toHaveProperty('items');
        expect(fieldDef.items).toHaveProperty('properties');
        expect(fieldDef.items.properties).toHaveProperty('name');
        expect(fieldDef.items.properties).toHaveProperty('approved');
      });

      it('should include nested field examples', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/fields/reviewers');
        
        const fieldDef = JSON.parse(result.contents[0].text);
        expect(fieldDef).toHaveProperty('examples');
        expect(fieldDef.examples).toContain('reviewers.name');
        expect(fieldDef.examples).toContain('reviewers.0.approved');
      });

      it('should throw error for invalid field name', async () => {
        await expect(
          resourceHandlers.readResource('bitbucket://pull-requests/fields/nonexistent')
        ).rejects.toThrow('Unknown field: nonexistent');
      });
    });

    describe('pull-requests/examples/basic', () => {
      it('should return basic usage examples in markdown', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/examples/basic');
        
        expect(result.contents[0].type).toBe('text');
        
        const content = result.contents[0].text;
        expect(content).toContain('# Basic Pull Request Queries');
        expect(content).toContain('list_pull_requests');
        expect(content).toContain('workspace=');
        expect(content).toContain('repository=');
        expect(content).toContain('```');
      });

      it('should include real-world examples', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/examples/basic');
        
        const content = result.contents[0].text;
        expect(content).toContain('state=OPEN');
        expect(content).toContain('state=MERGED');
        expect(content).toContain('author=');
        expect(content).toContain('reviewer=');
      });
    });

    describe('pull-requests/examples/fields-filtering', () => {
      it('should return field filtering examples', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/examples/fields-filtering');
        
        const content = result.contents[0].text;
        expect(content).toContain('# Field Filtering Examples');
        expect(content).toContain('fields=');
        expect(content).toContain('reviewers.name');
        expect(content).toContain('reviewers.0.approved');
        expect(content).toContain('Dot Notation');
      });

      it('should include practical filtering scenarios', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/examples/fields-filtering');
        
        const content = result.contents[0].text;
        expect(content).toContain('id,title,state');
        expect(content).toContain('author,reviewers.name');
        expect(content).toContain('Only basic information');
        expect(content).toContain('Only author and reviewer names');
      });
    });

    describe('pull-requests/docs/api-reference', () => {
      it('should return comprehensive API documentation', async () => {
        const result = await resourceHandlers.readResource('bitbucket://pull-requests/docs/api-reference');
        
        const content = result.contents[0].text;
        expect(content).toContain('# Pull Request API Reference');
        expect(content).toContain('## Parameters');
        expect(content).toContain('## Fields');
        expect(content).toContain('workspace');
        expect(content).toContain('repository');
        expect(content).toContain('fields');
      });
    });

    describe('server/info', () => {
      it('should return server information', async () => {
        const result = await resourceHandlers.readResource('bitbucket://server/info');
        
        expect(result.contents[0].type).toBe('text');
        
        const content = result.contents[0].text;
        expect(content).toContain('Server Type:');
        expect(content).toContain('Base URL:');
        expect(content).toContain('Version:');
      });
    });

    describe('server/capabilities', () => {
      it('should return server capabilities', async () => {
        const result = await resourceHandlers.readResource('bitbucket://server/capabilities');
        
        const content = result.contents[0].text;
        expect(content).toContain('Supported Features:');
        expect(content).toContain('Pull Requests');
        expect(content).toContain('Field Filtering');
        expect(content).toContain('Search');
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid URI format', async () => {
        await expect(
          resourceHandlers.readResource('invalid://uri')
        ).rejects.toThrow('Invalid resource URI');
      });

      it('should throw error for unknown resource path', async () => {
        await expect(
          resourceHandlers.readResource('bitbucket://unknown/path')
        ).rejects.toThrow('Resource not found');
      });

      it('should throw error for invalid pull request resource', async () => {
        await expect(
          resourceHandlers.readResource('bitbucket://pull-requests/invalid')
        ).rejects.toThrow('Resource not found');
      });
    });
  });

  describe('URI parsing', () => {
    it('should correctly parse URI components', () => {
      const uri = 'bitbucket://pull-requests/fields/reviewers';
      const parsed = resourceHandlers.parseResourceUri(uri);
      
      expect(parsed).toEqual({
        scheme: 'bitbucket',
        domain: 'pull-requests',
        category: 'fields',
        resource: 'reviewers'
      });
    });

    it('should handle nested resource paths', () => {
      const uri = 'bitbucket://pull-requests/examples/fields-filtering';
      const parsed = resourceHandlers.parseResourceUri(uri);
      
      expect(parsed.domain).toBe('pull-requests');
      expect(parsed.category).toBe('examples');
      expect(parsed.resource).toBe('fields-filtering');
    });

    it('should handle server resources', () => {
      const uri = 'bitbucket://server/info';
      const parsed = resourceHandlers.parseResourceUri(uri);
      
      expect(parsed.domain).toBe('server');
      expect(parsed.category).toBe('info');
      expect(parsed.resource).toBeUndefined();
    });
  });
});