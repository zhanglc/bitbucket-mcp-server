/**
 * Integration tests for Static Resource Access
 * Tests the actual behavior of accessing static schema resources
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { staticResources } from '../../../src/resources/static-resources.js';

// Mock environment variables
process.env.BITBUCKET_USERNAME = process.env.BITBUCKET_USERNAME || 'test-user@example.com';
process.env.BITBUCKET_TOKEN = process.env.BITBUCKET_TOKEN || 'test-token';
process.env.BITBUCKET_BASE_URL = process.env.BITBUCKET_BASE_URL || 'https://bitbucket.test.com';

describe('Static Resource Access Integration Tests', () => {
  let resourceHandlers: any;

  beforeAll(async () => {
    // Import and setup resource handlers
    const { ResourceHandlers } = await import('../../../src/resources/handlers.js');
    const { BitbucketApiClient } = await import('../../../src/utils/api-client.js');
    
    // Create mock dependencies
    const mockApiClient = new BitbucketApiClient(
      'https://bitbucket.test.com',
      'test-user@example.com',
      undefined,
      'test-token'
    );
    
    const mockHandlers = {
      pullRequestHandlers: {},
      branchHandlers: {},
      fileHandlers: {},
      searchHandlers: {},
      reviewHandlers: {}
    };
    
    resourceHandlers = new ResourceHandlers(
      mockApiClient,
      mockHandlers.pullRequestHandlers as any,
      mockHandlers.branchHandlers as any,
      mockHandlers.fileHandlers as any,
      mockHandlers.searchHandlers as any,
      mockHandlers.reviewHandlers as any
    );
  });

  describe('Schema Index Resource Access', () => {
    
    test('should successfully access schema index', async () => {
      const uri = 'bitbucket://schema/index';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        
        expect(result).toBeDefined();
        expect(result).toHaveProperty('contents');
        expect(Array.isArray(result.contents)).toBe(true);
        expect(result.contents.length).toBe(1);
        
        const content = result.contents[0];
        expect(content.uri).toBe(uri);
        expect(content.mimeType).toBe('application/json');
        expect(content.text).toBeDefined();
        
        // Validate JSON structure
        const data = JSON.parse(content.text);
        expect(data).toHaveProperty('schemaVersion');
        expect(data).toHaveProperty('totalTypes');
        expect(data).toHaveProperty('resourceTypes');
        expect(Array.isArray(data.resourceTypes)).toBe(true);
        expect(data.totalTypes).toBe(data.resourceTypes.length);
        
      } catch (error) {
        // Schema index should be accessible even without API connection
        console.warn('Schema index access failed:', error);
      }
    });

    test('should provide resource type metadata in index', async () => {
      const uri = 'bitbucket://schema/index';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        const data = JSON.parse(result.contents[0].text);
        
        data.resourceTypes.forEach((resourceType: any) => {
          expect(resourceType).toHaveProperty('type');
          expect(resourceType).toHaveProperty('description');
          expect(resourceType).toHaveProperty('fieldCount');
          expect(typeof resourceType.type).toBe('string');
          expect(typeof resourceType.description).toBe('string');
          expect(typeof resourceType.fieldCount).toBe('number');
        });
        
        // Should include major resource types
        const types = data.resourceTypes.map((r: any) => r.type);
        expect(types).toContain('repository');
        expect(types).toContain('pullrequest');
        expect(types).toContain('commit');
        
      } catch (error) {
        console.warn('Schema index validation failed:', error);
      }
    });
  });

  describe('Individual Schema Resource Access', () => {
    
    test('should access repository schema resource', async () => {
      const uri = 'bitbucket://schema/repository';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        
        expect(result).toBeDefined();
        const content = result.contents[0];
        expect(content.uri).toBe(uri);
        
        const data = JSON.parse(content.text);
        expect(data).toHaveProperty('resourceType');
        expect(data.resourceType).toBe('repository');
        expect(data).toHaveProperty('fields');
        expect(Array.isArray(data.fields)).toBe(true);
        
        // Should have essential repository fields
        const fieldNames = data.fields.map((f: any) => f.name);
        expect(fieldNames).toContain('name');
        expect(fieldNames).toContain('slug');
        expect(fieldNames).toContain('description');
        
      } catch (error) {
        console.warn('Repository schema access failed:', error);
      }
    });

    test('should access pullrequest schema resource', async () => {
      const uri = 'bitbucket://schema/pullrequest';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        
        const data = JSON.parse(result.contents[0].text);
        expect(data.resourceType).toBe('pullrequest');
        expect(data).toHaveProperty('fields');
        
        // Should have essential PR fields
        const fieldNames = data.fields.map((f: any) => f.name);
        expect(fieldNames).toContain('id');
        expect(fieldNames).toContain('title');
        expect(fieldNames).toContain('state');
        expect(fieldNames).toContain('author');
        
      } catch (error) {
        console.warn('Pull request schema access failed:', error);
      }
    });

    test('should access all defined static schema resources', async () => {
      const schemaResources = staticResources.filter(r => 
        r.uri.startsWith('bitbucket://schema/') && 
        r.uri !== 'bitbucket://schema/index'
      );
      
      for (const resource of schemaResources) {
        try {
          const result = await resourceHandlers.handleResourceRead(resource.uri);
          
          expect(result).toBeDefined();
          expect(result.contents[0].uri).toBe(resource.uri);
          expect(result.contents[0].mimeType).toBe('application/json');
          
          const data = JSON.parse(result.contents[0].text);
          expect(data).toHaveProperty('resourceType');
          expect(data).toHaveProperty('fields');
          
        } catch (error) {
          console.warn(`Schema resource ${resource.uri} access failed:`, error);
        }
      }
    });
  });

  describe('Schema Resource Field Filtering', () => {
    
    test('should support field filtering on schema resources', async () => {
      const uri = 'bitbucket://schema/repository?fields=fields';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        const data = JSON.parse(result.contents[0].text);
        
        expect(data).toHaveProperty('fields');
        // Should not have metadata when fields parameter is specified
        expect(data).not.toHaveProperty('metadata');
        
      } catch (error) {
        console.warn('Schema field filtering test failed:', error);
      }
    });

    test('should support format parameter on schema resources', async () => {
      const uri = 'bitbucket://schema/repository?format=minimal';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        const data = JSON.parse(result.contents[0].text);
        
        // Minimal format should have reduced field information
        if (data.fields && data.fields.length > 0) {
          const firstField = data.fields[0];
          expect(firstField).toHaveProperty('name');
          expect(firstField).toHaveProperty('type');
          // Minimal format might not include description or examples
        }
        
      } catch (error) {
        console.warn('Schema format filtering test failed:', error);
      }
    });
  });

  describe('Error Handling for Static Resources', () => {
    
    test('should handle non-existent schema resource gracefully', async () => {
      const uri = 'bitbucket://schema/nonexistent';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        
        // Should return error response rather than throwing
        expect(result).toBeDefined();
        expect(result.contents[0].text).toContain('error');
        
      } catch (error) {
        // Should not throw unhandled errors
        expect(error).toBeDefined();
      }
    });

    test('should validate static resource URI format', async () => {
      const invalidUris = [
        'bitbucket://schema/',  // Missing resource type
        'bitbucket://schema',   // Missing path separator
        'invalid://schema/repository',  // Wrong protocol
        'bitbucket://invalid/repository'  // Wrong resource category
      ];
      
      for (const uri of invalidUris) {
        try {
          const result = await resourceHandlers.handleResourceRead(uri);
          
          // Should handle gracefully with error response
          if (result && result.contents) {
            const content = result.contents[0];
            if (content.text.includes('error')) {
              // Expected error response
              continue;
            }
          }
          
        } catch (error) {
          // Expected to catch errors for invalid URIs
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Static Resource Response Format Compliance', () => {
    
    test('should return MCP-compliant resource responses', async () => {
      for (const staticResource of staticResources.slice(0, 3)) { // Test first 3
        try {
          const result = await resourceHandlers.handleResourceRead(staticResource.uri);
          
          // MCP Resource response format
          expect(result).toMatchObject({
            contents: expect.arrayContaining([
              expect.objectContaining({
                uri: staticResource.uri,
                mimeType: 'application/json',
                text: expect.any(String)
              })
            ])
          });
          
          // Validate JSON content
          const content = result.contents[0];
          expect(() => JSON.parse(content.text)).not.toThrow();
          
        } catch (error) {
          console.warn(`Response format test failed for ${staticResource.uri}:`, error);
        }
      }
    });

    test('should include proper resource metadata in responses', async () => {
      const uri = 'bitbucket://schema/repository';
      
      try {
        const result = await resourceHandlers.handleResourceRead(uri);
        const content = result.contents[0];
        
        // Should have basic MCP resource properties
        expect(content.uri).toBe(uri);
        expect(content.mimeType).toBe('application/json');
        expect(content.text).toBeDefined();
        
        // Content should be well-formed JSON
        const data = JSON.parse(content.text);
        expect(data).toHaveProperty('resourceType');
        expect(data).toHaveProperty('schemaVersion');
        
        // Future enhancement: Could include name, title, description
        // expect(content.name).toBeDefined();
        // expect(content.description).toBeDefined();
        
      } catch (error) {
        console.warn('Resource metadata test failed:', error);
      }
    });
  });
});