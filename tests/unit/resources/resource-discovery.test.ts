/**
 * Tests for Resource Discovery compliance with MCP specification
 * 
 * Tests the distinction between:
 * - ListResources: Static, directly accessible resources
 * - ListResourceTemplates: URI templates for parameterized resources
 */

import { jest } from '@jest/globals';
import { staticResources, isStaticResource, getStaticResource } from '../../../src/resources/static-resources.js';
import { resourceTemplates } from '../../../src/resources/templates.js';

describe('Resource Discovery - MCP Compliance Tests', () => {

  describe('Static Resources Definition', () => {
    
    test('should have well-defined static resources', () => {
      expect(staticResources).toBeDefined();
      expect(Array.isArray(staticResources)).toBe(true);
      expect(staticResources.length).toBeGreaterThan(0);
    });

    test('should have valid static resource structure', () => {
      staticResources.forEach(resource => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        
        expect(typeof resource.uri).toBe('string');
        expect(typeof resource.name).toBe('string');
        expect(typeof resource.description).toBe('string');
        expect(typeof resource.mimeType).toBe('string');
        
        // All static resources should be schema resources
        expect(resource.uri).toMatch(/^bitbucket:\/\/schema\//);
        expect(resource.mimeType).toBe('application/json');
      });
    });

    test('should have unique URIs for all static resources', () => {
      const uris = staticResources.map(r => r.uri);
      const uniqueUris = new Set(uris);
      expect(uniqueUris.size).toBe(uris.length);
    });

    test('should include essential schema resources', () => {
      const uris = staticResources.map(r => r.uri);
      const essentialResources = [
        'bitbucket://schema/index',
        'bitbucket://schema/repository',
        'bitbucket://schema/pullrequest',
        'bitbucket://schema/commit',
        'bitbucket://schema/branch',
        'bitbucket://schema/file'
      ];

      essentialResources.forEach(uri => {
        expect(uris).toContain(uri);
      });
    });
  });

  describe('Static Resource Helper Functions', () => {
    
    test('isStaticResource should correctly identify static resources', () => {
      expect(isStaticResource('bitbucket://schema/index')).toBe(true);
      expect(isStaticResource('bitbucket://schema/repository')).toBe(true);
      expect(isStaticResource('bitbucket://workspace/repo/file/path')).toBe(false);
      expect(isStaticResource('bitbucket://workspace/repo/pull-request/123')).toBe(false);
      expect(isStaticResource('invalid-uri')).toBe(false);
    });

    test('getStaticResource should return correct resource definition', () => {
      const resource = getStaticResource('bitbucket://schema/index');
      expect(resource).toBeDefined();
      expect(resource?.name).toBe('Resource Schema Index');
      expect(resource?.mimeType).toBe('application/json');

      const nonExistent = getStaticResource('bitbucket://schema/nonexistent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Resource Templates Validation', () => {
    
    test('should have valid resource templates structure', () => {
      expect(resourceTemplates).toBeDefined();
      expect(Array.isArray(resourceTemplates)).toBe(true);
      expect(resourceTemplates.length).toBeGreaterThan(0);
    });

    test('should have correct template properties', () => {
      resourceTemplates.forEach(template => {
        expect(template).toHaveProperty('uriTemplate');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('inputSchema');
        
        expect(typeof template.uriTemplate).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(typeof template.inputSchema).toBe('object');
        
        // URI templates should contain placeholders
        expect(template.uriTemplate).toMatch(/\{[^}]+\}/);
        // Should start with bitbucket://
        expect(template.uriTemplate).toMatch(/^bitbucket:\/\//);
      });
    });

    test('should have no overlap between static resources and templates', () => {
      const staticUris = staticResources.map(r => r.uri);
      const templateUris = resourceTemplates.map(t => t.uriTemplate);
      
      // Templates should be parameterized (contain {})
      templateUris.forEach(templateUri => {
        expect(templateUri).toMatch(/\{[^}]+\}/);
        expect(staticUris).not.toContain(templateUri);
      });
      
      // Static resources should not be parameterized
      staticUris.forEach(staticUri => {
        expect(staticUri).not.toMatch(/\{[^}]+\}/);
        expect(templateUris).not.toContain(staticUri);
      });
    });
  });

  describe('MCP Compliance Validation', () => {
    
    test('static resources should follow MCP resource format', () => {
      staticResources.forEach(resource => {
        // MCP Resource interface compliance
        expect(resource.uri).toBeDefined();
        expect(resource.name).toBeDefined();
        expect(resource.description).toBeDefined();
        expect(resource.mimeType).toBeDefined();
        
        // Optional properties should be undefined or of correct type
        if ('annotations' in resource) {
          expect(typeof resource.annotations).toBe('object');
        }
      });
    });

    test('resource templates should follow MCP template format', () => {
      resourceTemplates.forEach(template => {
        // MCP ResourceTemplate interface compliance
        expect(template.uriTemplate).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        
        // Input schema should be valid JSON Schema
        expect(template.inputSchema).toBeDefined();
        const schema = template.inputSchema as any;
        expect(schema.type).toBeDefined();
        expect(schema.properties).toBeDefined();
        
        if (schema.required) {
          expect(Array.isArray(schema.required)).toBe(true);
        }
      });
    });

    test('should provide comprehensive resource coverage', () => {
      const templateNames = resourceTemplates.map(t => t.name);
      const staticNames = staticResources.map(r => r.name);
      
      // Should cover main Bitbucket resource types
      const expectedTemplates = [
        'repository-file',
        'repository-directory', 
        'pull-request',
        'pull-request-diff',
        'repository-branches',
        'repository-branch',
        'pull-requests-list'
      ];
      
      expectedTemplates.forEach(name => {
        expect(templateNames).toContain(name);
      });
      
      // Should have schema resources for major types
      const schemaIndexResource = staticResources.find(r => r.uri === 'bitbucket://schema/index');
      expect(schemaIndexResource).toBeDefined();
    });
  });

  describe('Resource Discovery Integration', () => {
    
    test('should provide clear separation between discovery mechanisms', () => {
      // Static resources: concrete, directly accessible
      staticResources.forEach(resource => {
        expect(resource.uri).not.toMatch(/\{[^}]+\}/); // No parameters
        expect(resource.uri).toMatch(/^bitbucket:\/\/schema\//); // Schema resources only
      });
      
      // Templates: parameterized, require instantiation
      resourceTemplates.forEach(template => {
        expect(template.uriTemplate).toMatch(/\{[^}]+\}/); // Contains parameters
        // Templates can be either data resources or schema resources
        expect(template.uriTemplate).toMatch(/^bitbucket:\/\//); // All start with bitbucket://
      });
    });

    test('should support resource discovery workflow', () => {
      // 1. Client calls ListResources() -> gets static schema resources
      const listResourcesResponse = { resources: staticResources };
      expect(listResourcesResponse.resources.length).toBeGreaterThan(0);
      
      // 2. Client calls ListResourceTemplates() -> gets dynamic patterns  
      const listTemplatesResponse = { resourceTemplates };
      expect(listTemplatesResponse.resourceTemplates.length).toBeGreaterThan(0);
      
      // 3. Client can access schema/index to understand field schemas
      const schemaIndex = staticResources.find(r => r.uri === 'bitbucket://schema/index');
      expect(schemaIndex).toBeDefined();
      
      // 4. Client can instantiate templates with parameters
      const fileTemplate = resourceTemplates.find(t => t.name === 'repository-file');
      expect(fileTemplate).toBeDefined();
      expect(fileTemplate?.uriTemplate).toBe('bitbucket://{workspace}/{repo}/file/{path}');
    });
  });

  describe('Error Scenarios', () => {
    
    test('should handle invalid static resource access gracefully', () => {
      expect(isStaticResource('')).toBe(false);
      expect(isStaticResource('invalid')).toBe(false);
      expect(isStaticResource('bitbucket://invalid')).toBe(false);
      expect(getStaticResource('nonexistent')).toBeUndefined();
    });

    test('should validate template parameter requirements', () => {
      resourceTemplates.forEach(template => {
        const schema = template.inputSchema as any;
        if (schema.required) {
          expect(schema.required.length).toBeGreaterThan(0);
          schema.required.forEach((param: string) => {
            expect(schema.properties).toHaveProperty(param);
          });
        }
      });
    });
  });
});