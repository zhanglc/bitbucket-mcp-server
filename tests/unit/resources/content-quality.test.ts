import { describe, it, expect } from '@jest/globals';
import { generateResourceContent } from '../../../src/resources/resource-definitions';
import { PULL_REQUEST_FIELDS } from '../../../src/resources/field-schemas';

describe('Resource Content Quality', () => {
  describe('Field Schema Content', () => {
    it('should generate complete and valid field schema', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/fields/schema');
      const schema = JSON.parse(content);
      
      // Should contain all fields from PULL_REQUEST_FIELDS
      const expectedFields = Object.keys(PULL_REQUEST_FIELDS);
      const actualFields = Object.keys(schema);
      
      expect(actualFields.sort()).toEqual(expectedFields.sort());
      
      // Each field should have proper structure
      expectedFields.forEach(field => {
        expect(schema[field]).toHaveProperty('type');
        expect(schema[field]).toHaveProperty('description');
        expect(typeof schema[field].type).toBe('string');
        expect(typeof schema[field].description).toBe('string');
        expect(schema[field].description.length).toBeGreaterThan(10);
      });
    });

    it('should maintain consistency with field-schemas.ts', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/fields/schema');
      const resourceSchema = JSON.parse(content);
      
      // Should exactly match PULL_REQUEST_FIELDS
      expect(resourceSchema).toEqual(PULL_REQUEST_FIELDS);
    });
  });

  describe('Field List Content', () => {
    it('should generate alphabetically sorted field list', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/fields/list');
      const fields = content.trim().split('\n');
      
      // Should be sorted
      const sortedFields = [...fields].sort();
      expect(fields).toEqual(sortedFields);
      
      // Should contain all expected fields
      expect(fields).toContain('id');
      expect(fields).toContain('title');
      expect(fields).toContain('author');
      expect(fields).toContain('reviewers');
      expect(fields).toContain('state');
      
      // Should match field schema keys
      const schemaContent = await generateResourceContent('bitbucket://pull-requests/fields/schema');
      const schemaFields = Object.keys(JSON.parse(schemaContent));
      expect(fields.sort()).toEqual(schemaFields.sort());
    });

    it('should be newline-separated plain text', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/fields/list');
      
      // Should not contain special characters or formatting
      expect(content).not.toContain(',');
      expect(content).not.toContain(';');
      expect(content).not.toContain('"');
      expect(content).not.toContain('[');
      expect(content).not.toContain('{');
      
      // Should end with newline
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  describe('Individual Field Content', () => {
    const testFields = ['id', 'title', 'author', 'reviewers', 'participants', 'state'];
    
    testFields.forEach(fieldName => {
      it(`should generate complete definition for ${fieldName} field`, async () => {
        const content = await generateResourceContent(`bitbucket://pull-requests/fields/${fieldName}`);
        const fieldDef = JSON.parse(content);
        
        // Basic structure
        expect(fieldDef).toHaveProperty('name', fieldName);
        expect(fieldDef).toHaveProperty('type');
        expect(fieldDef).toHaveProperty('description');
        expect(fieldDef).toHaveProperty('examples');
        
        // Should match schema definition
        const originalDef = PULL_REQUEST_FIELDS[fieldName];
        expect(fieldDef.type).toBe(originalDef.type);
        expect(fieldDef.description).toBe(originalDef.description);
        
        // Examples should be helpful
        expect(Array.isArray(fieldDef.examples)).toBe(true);
        expect(fieldDef.examples.length).toBeGreaterThan(0);
        expect(fieldDef.examples[0]).toContain(fieldName);
      });
    });

    it('should generate proper examples for array fields', async () => {
      const arrayFields = ['reviewers', 'participants'];
      
      for (const field of arrayFields) {
        const content = await generateResourceContent(`bitbucket://pull-requests/fields/${field}`);
        const fieldDef = JSON.parse(content);
        
        expect(fieldDef.type).toBe('array');
        expect(fieldDef.examples).toContain(`${field}.name`);
        expect(fieldDef.examples).toContain(`${field}.0.name`);
        
        // Should include property-specific examples
        if (field === 'reviewers') {
          expect(fieldDef.examples).toContain('reviewers.approved');
          expect(fieldDef.examples).toContain('reviewers.0.approved');
        }
      }
    });

    it('should include nested property information for complex fields', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/fields/reviewers');
      const fieldDef = JSON.parse(content);
      
      expect(fieldDef).toHaveProperty('items');
      expect(fieldDef.items).toHaveProperty('properties');
      expect(fieldDef.items.properties).toHaveProperty('name');
      expect(fieldDef.items.properties).toHaveProperty('approved');
      expect(fieldDef.items.properties).toHaveProperty('status');
    });
  });

  describe('Example Content Quality', () => {
    it('should generate well-structured basic examples', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/examples/basic');
      
      // Should have proper markdown structure
      expect(content).toMatch(/^# Basic Pull Request Queries/m);
      expect(content).toMatch(/^## /m); // Has subheadings
      
      // Should contain code examples
      expect(content).toContain('```');
      expect(content).toContain('list_pull_requests');
      
      // Should show different parameter combinations
      expect(content).toContain('workspace=');
      expect(content).toContain('repository=');
      expect(content).toContain('state=OPEN');
      expect(content).toContain('state=MERGED');
      expect(content).toContain('author=');
      expect(content).toContain('reviewer=');
      
      // Should include explanations
      expect(content).toContain('List all');
      expect(content).toContain('Filter by');
    });

    it('should generate comprehensive field filtering examples', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/examples/fields-filtering');
      
      // Should explain field filtering concept
      expect(content).toMatch(/^# Field Filtering Examples/m);
      expect(content).toContain('fields=');
      expect(content).toContain('Field filtering allows you to specify exactly which fields');
      expect(content).toContain('Dot Notation');
      
      // Should show progression from simple to complex
      expect(content).toContain('id,title,state');
      expect(content).toContain('reviewers.name');
      expect(content).toContain('reviewers.0.approved');
      
      // Should include practical scenarios
      expect(content).toContain('basic information');
      expect(content).toContain('author and reviewer');
      expect(content).toContain('specific reviewer');
      
      // Should explain benefits
      expect(content).toContain('reduce');
      expect(content).toContain('performance');
    });
  });

  describe('Documentation Content Quality', () => {
    it('should generate comprehensive API reference', async () => {
      const content = await generateResourceContent('bitbucket://pull-requests/docs/api-reference');
      
      // Should have complete structure
      expect(content).toMatch(/^# Pull Request API Reference/m);
      expect(content).toContain('## Parameters');
      expect(content).toContain('## Fields');
      expect(content).toContain('## Examples');
      
      // Should document all parameters
      expect(content).toContain('workspace');
      expect(content).toContain('repository');
      expect(content).toContain('fields');
      expect(content).toContain('state');
      expect(content).toContain('author');
      expect(content).toContain('reviewer');
      expect(content).toContain('limit');
      expect(content).toContain('start');
      
      // Should explain parameter types and requirements
      expect(content).toContain('Required Parameters');
      expect(content).toContain('Optional Parameters');
      expect(content).toContain('string');
      expect(content).toContain('number');
      
      // Should include valid values
      expect(content).toContain('OPEN');
      expect(content).toContain('MERGED');
      expect(content).toContain('DECLINED');
    });
  });

  describe('Server Information Content', () => {
    it('should generate informative server info', async () => {
      const content = await generateResourceContent('bitbucket://server/info');
      
      expect(content).toContain('Server Type:');
      expect(content).toContain('Base URL:');
      expect(content).toContain('Version:');
      expect(content).toContain('Authentication:');
      
      // Should indicate current configuration
      expect(content).toMatch(/Server Type:\s+(Server|Cloud)/);
      expect(content).toMatch(/Base URL:\s+https?:\/\//);
    });

    it('should generate accurate capabilities list', async () => {
      const content = await generateResourceContent('bitbucket://server/capabilities');
      
      expect(content).toContain('Supported Features:');
      expect(content).toContain('✓ Pull Requests');
      expect(content).toContain('✓ Field Filtering');
      expect(content).toContain('✓ Branches');
      expect(content).toContain('✓ File Operations');
      
      // Should indicate limitations for Cloud vs Server
      expect(content).toContain('Note:');
    });
  });

  describe('Content Consistency', () => {
    it('should use consistent terminology across all resources', async () => {
      const resources = [
        'bitbucket://pull-requests/examples/basic',
        'bitbucket://pull-requests/examples/fields-filtering',
        'bitbucket://pull-requests/docs/api-reference'
      ];
      
      const contents = await Promise.all(
        resources.map(uri => generateResourceContent(uri))
      );
      
      // Should consistently use same parameter names
      contents.forEach(content => {
        if (content.includes('workspace')) {
          expect(content).not.toContain('project'); // Don't mix terminology
        }
        // Check parameter names are consistent (not repository names like my-repo)
        if (content.includes('repository=')) {
          expect(content).not.toContain('repo='); // Use full parameter name consistently
        }
      });
    });

    it('should provide accurate field information across resources', async () => {
      // Get field schema
      const schemaContent = await generateResourceContent('bitbucket://pull-requests/fields/schema');
      const schema = JSON.parse(schemaContent);
      
      // Check individual field resources match
      for (const fieldName of ['id', 'title', 'reviewers']) {
        const fieldContent = await generateResourceContent(`bitbucket://pull-requests/fields/${fieldName}`);
        const fieldDef = JSON.parse(fieldContent);
        
        expect(fieldDef.type).toBe(schema[fieldName].type);
        expect(fieldDef.description).toBe(schema[fieldName].description);
      }
    });
  });

  describe('Content Formatting', () => {
    it('should generate valid markdown for documentation resources', async () => {
      const markdownResources = [
        'bitbucket://pull-requests/examples/basic',
        'bitbucket://pull-requests/examples/fields-filtering',
        'bitbucket://pull-requests/docs/api-reference'
      ];
      
      for (const uri of markdownResources) {
        const content = await generateResourceContent(uri);
        
        // Should have main heading
        expect(content).toMatch(/^# /m);
        
        // Should have proper code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g);
        expect(codeBlocks).toBeTruthy();
        expect(codeBlocks!.length).toBeGreaterThan(0);
        
        // Code blocks should be properly closed
        const openBlocks = (content.match(/```/g) || []).length;
        expect(openBlocks % 2).toBe(0); // Even number (each ``` opens and closes)
      }
    });

    it('should generate valid JSON for JSON resources', async () => {
      const jsonResources = [
        'bitbucket://pull-requests/fields/schema',
        'bitbucket://pull-requests/fields/id',
        'bitbucket://pull-requests/fields/reviewers'
      ];
      
      for (const uri of jsonResources) {
        const content = await generateResourceContent(uri);
        
        // Should be valid JSON
        expect(() => JSON.parse(content)).not.toThrow();
        
        // Should be properly formatted (indented)
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        expect(content).toBe(formatted);
      }
    });
  });
});