import { describe, it, expect } from '@jest/globals';
import { 
  RESOURCE_DEFINITIONS, 
  RESOURCE_TEMPLATES,
  getResourceByUri,
  getResourceTemplateByUri,
  generateResourceContent
} from '../../../src/resources/resource-definitions';

describe('Resource Definitions', () => {
  describe('RESOURCE_DEFINITIONS', () => {
    it('should be defined and export resource array', () => {
      expect(RESOURCE_DEFINITIONS).toBeDefined();
      expect(Array.isArray(RESOURCE_DEFINITIONS)).toBe(true);
      expect(RESOURCE_DEFINITIONS.length).toBeGreaterThan(5);
    });

    it('should have all required pull-request resources', () => {
      const uris = RESOURCE_DEFINITIONS.map(r => r.uri);
      
      expect(uris).toContain('bitbucket://pull-requests/fields/schema');
      expect(uris).toContain('bitbucket://pull-requests/fields/list');
      expect(uris).toContain('bitbucket://pull-requests/examples/basic');
      expect(uris).toContain('bitbucket://pull-requests/examples/fields-filtering');
      expect(uris).toContain('bitbucket://pull-requests/docs/api-reference');
    });

    it('should have server information resources', () => {
      const uris = RESOURCE_DEFINITIONS.map(r => r.uri);
      
      expect(uris).toContain('bitbucket://server/info');
      expect(uris).toContain('bitbucket://server/capabilities');
    });

    it('should have proper metadata for each resource', () => {
      RESOURCE_DEFINITIONS.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        
        expect(typeof resource.uri).toBe('string');
        expect(typeof resource.name).toBe('string');
        expect(typeof resource.description).toBe('string');
        expect(typeof resource.mimeType).toBe('string');
        
        expect(resource.uri).toMatch(/^bitbucket:\/\//);
        expect(resource.name.length).toBeGreaterThan(5);
        expect(resource.description.length).toBeGreaterThan(10);
      });
    });

    it('should have correct MIME types', () => {
      const schemaResource = RESOURCE_DEFINITIONS.find(r => 
        r.uri === 'bitbucket://pull-requests/fields/schema'
      );
      expect(schemaResource?.mimeType).toBe('application/json');
      
      const listResource = RESOURCE_DEFINITIONS.find(r => 
        r.uri === 'bitbucket://pull-requests/fields/list'
      );
      expect(listResource?.mimeType).toBe('text/plain');
      
      const exampleResource = RESOURCE_DEFINITIONS.find(r => 
        r.uri === 'bitbucket://pull-requests/examples/basic'
      );
      expect(exampleResource?.mimeType).toBe('text/markdown');
    });

    it('should have unique URIs', () => {
      const uris = RESOURCE_DEFINITIONS.map(r => r.uri);
      const uniqueUris = [...new Set(uris)];
      
      expect(uris.length).toBe(uniqueUris.length);
    });
  });

  describe('RESOURCE_TEMPLATES', () => {
    it('should be defined and export template array', () => {
      expect(RESOURCE_TEMPLATES).toBeDefined();
      expect(Array.isArray(RESOURCE_TEMPLATES)).toBe(true);
      expect(RESOURCE_TEMPLATES.length).toBeGreaterThan(0);
    });

    it('should include field-specific template', () => {
      const fieldTemplate = RESOURCE_TEMPLATES.find(t => 
        t.uriTemplate === 'bitbucket://pull-requests/fields/{field_name}'
      );
      
      expect(fieldTemplate).toBeDefined();
      expect(fieldTemplate?.name).toBe('Pull Request Field Definition');
      expect(fieldTemplate?.description).toContain('specific field');
      expect(fieldTemplate?.mimeType).toBe('application/json');
    });

    it('should have proper template metadata', () => {
      RESOURCE_TEMPLATES.forEach(template => {
        expect(template).toHaveProperty('uriTemplate');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('mimeType');
        
        expect(template.uriTemplate).toMatch(/^bitbucket:\/\//);
        expect(template.uriTemplate).toMatch(/\{[^}]+\}/); // Contains template variable
        expect(template.name.length).toBeGreaterThan(5);
        expect(template.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('getResourceByUri', () => {
    it('should find existing static resources', () => {
      const resource = getResourceByUri('bitbucket://pull-requests/fields/schema');
      
      expect(resource).toBeDefined();
      expect(resource?.uri).toBe('bitbucket://pull-requests/fields/schema');
      expect(resource?.mimeType).toBe('application/json');
    });

    it('should return undefined for non-existent resources', () => {
      const resource = getResourceByUri('bitbucket://nonexistent/resource');
      
      expect(resource).toBeUndefined();
    });

    it('should handle all defined resource URIs', () => {
      RESOURCE_DEFINITIONS.forEach(expectedResource => {
        const foundResource = getResourceByUri(expectedResource.uri);
        
        expect(foundResource).toBeDefined();
        expect(foundResource?.uri).toBe(expectedResource.uri);
      });
    });
  });

  describe('getResourceTemplateByUri', () => {
    it('should match template patterns correctly', () => {
      const template = getResourceTemplateByUri('bitbucket://pull-requests/fields/reviewers');
      
      expect(template).toBeDefined();
      expect(template?.uriTemplate).toBe('bitbucket://pull-requests/fields/{field_name}');
    });

    it('should extract template variables', () => {
      const template = getResourceTemplateByUri('bitbucket://pull-requests/fields/author');
      
      expect(template).toBeDefined();
      if (template?.extractVariables) {
        const variables = template.extractVariables('bitbucket://pull-requests/fields/author');
        expect(variables).toBeDefined();
        expect(variables?.field_name).toBe('author');
      }
    });

    it('should return undefined for non-matching URIs', () => {
      const template = getResourceTemplateByUri('bitbucket://invalid/path');
      
      expect(template).toBeUndefined();
    });

    it('should handle all template patterns', () => {
      const testCases = [
        {
          uri: 'bitbucket://pull-requests/fields/id',
          expectedTemplate: 'bitbucket://pull-requests/fields/{field_name}',
          expectedVar: { field_name: 'id' }
        },
        {
          uri: 'bitbucket://pull-requests/examples/custom',
          expectedTemplate: 'bitbucket://pull-requests/examples/{example_type}',
          expectedVar: { example_type: 'custom' }
        }
      ];
      
      testCases.forEach(({ uri, expectedTemplate, expectedVar }) => {
        const template = getResourceTemplateByUri(uri);
        expect(template?.uriTemplate).toBe(expectedTemplate);
        
        if (template?.extractVariables) {
          const variables = template.extractVariables(uri);
          expect(variables).toEqual(expectedVar);
        }
      });
    });
  });

  describe('generateResourceContent', () => {
    describe('static resources', () => {
      it('should generate field schema content', async () => {
        const content = await generateResourceContent('bitbucket://pull-requests/fields/schema');
        
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        
        const parsed = JSON.parse(content);
        expect(parsed).toHaveProperty('id');
        expect(parsed).toHaveProperty('title');
        expect(parsed).toHaveProperty('reviewers');
        expect(parsed.id).toHaveProperty('type', 'number');
      });

      it('should generate field list content', async () => {
        const content = await generateResourceContent('bitbucket://pull-requests/fields/list');
        
        expect(content).toBeDefined();
        expect(typeof content).toBe('string');
        
        const fields = content.trim().split('\n');
        expect(fields).toContain('id');
        expect(fields).toContain('title');
        expect(fields).toContain('reviewers');
        
        // Should be sorted
        const sortedFields = [...fields].sort();
        expect(fields).toEqual(sortedFields);
      });

      it('should generate example content with proper markdown', async () => {
        const content = await generateResourceContent('bitbucket://pull-requests/examples/basic');
        
        expect(content).toBeDefined();
        expect(content).toContain('# Basic Pull Request Queries');
        expect(content).toContain('list_pull_requests');
        expect(content).toContain('```');
        expect(content).toContain('workspace=');
      });

      it('should generate server info content', async () => {
        const content = await generateResourceContent('bitbucket://server/info');
        
        expect(content).toContain('Server Type:');
        expect(content).toContain('Base URL:');
        expect(content).toContain('Version:');
      });
    });

    describe('template resources', () => {
      it('should generate specific field definitions', async () => {
        const content = await generateResourceContent('bitbucket://pull-requests/fields/reviewers');
        
        expect(content).toBeDefined();
        const parsed = JSON.parse(content);
        
        expect(parsed).toHaveProperty('name', 'reviewers');
        expect(parsed).toHaveProperty('type', 'array');
        expect(parsed).toHaveProperty('description');
        expect(parsed).toHaveProperty('examples');
        expect(parsed.examples).toContain('reviewers.name');
        expect(parsed.examples).toContain('reviewers.0.approved');
      });

      it('should generate field definitions for all valid fields', async () => {
        const validFields = ['id', 'title', 'state', 'author', 'reviewers', 'participants'];
        
        for (const field of validFields) {
          const content = await generateResourceContent(`bitbucket://pull-requests/fields/${field}`);
          const parsed = JSON.parse(content);
          
          expect(parsed.name).toBe(field);
          expect(parsed).toHaveProperty('type');
          expect(parsed).toHaveProperty('description');
          expect(typeof parsed.description).toBe('string');
          expect(parsed.description.length).toBeGreaterThan(5);
        }
      });

      it('should throw error for invalid field names', async () => {
        await expect(
          generateResourceContent('bitbucket://pull-requests/fields/nonexistent')
        ).rejects.toThrow('Unknown field: nonexistent');
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid URIs', async () => {
        await expect(
          generateResourceContent('invalid://uri')
        ).rejects.toThrow('Invalid resource URI');
      });

      it('should throw error for unknown resources', async () => {
        await expect(
          generateResourceContent('bitbucket://unknown/resource')
        ).rejects.toThrow('Resource not found');
      });
    });
  });

  describe('Content Quality Validation', () => {
    it('should generate valid JSON for JSON resources', async () => {
      const jsonResources = RESOURCE_DEFINITIONS
        .filter(r => r.mimeType === 'application/json')
        .map(r => r.uri);
      
      for (const uri of jsonResources) {
        const content = await generateResourceContent(uri);
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('should generate non-empty content for all resources', async () => {
      for (const resource of RESOURCE_DEFINITIONS) {
        const content = await generateResourceContent(resource.uri);
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(10);
      }
    });

    it('should generate proper markdown structure for markdown resources', async () => {
      const markdownResources = RESOURCE_DEFINITIONS
        .filter(r => r.mimeType === 'text/markdown')
        .map(r => r.uri);
      
      for (const uri of markdownResources) {
        const content = await generateResourceContent(uri);
        
        // Should have at least one heading
        expect(content).toMatch(/^# /m);
        // Should have code blocks for examples
        if (uri.includes('examples')) {
          expect(content).toContain('```');
        }
      }
    });
  });
});