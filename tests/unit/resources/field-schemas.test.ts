import { describe, it, expect } from '@jest/globals';
import { PULL_REQUEST_FIELDS } from '../../../src/resources/field-schemas';
import { formatServerResponse } from '../../../src/utils/formatters';

describe('Field Schemas', () => {
  // Mock PR data for testing field completeness
  const mockServerPR = {
    id: 123,
    title: 'Test PR',
    description: 'Test description',
    state: 'OPEN',
    open: true,
    closed: false,
    locked: false,
    author: {
      user: {
        displayName: 'John Doe',
        name: 'john.doe',
        emailAddress: 'john.doe@company.com'
      }
    },
    fromRef: {
      displayId: 'feature/test',
      latestCommit: 'abc123'
    },
    toRef: {
      displayId: 'main',
      latestCommit: 'def456',
      repository: {
        project: { key: 'PROJ' },
        slug: 'test-repo'
      }
    },
    reviewers: [
      {
        user: {
          displayName: 'Jane Smith',
          name: 'jane.smith',
          emailAddress: 'jane.smith@company.com'
        },
        approved: true,
        status: 'APPROVED'
      }
    ],
    participants: [
      {
        user: {
          displayName: 'Bob Wilson',
          name: 'bob.wilson',
          emailAddress: 'bob.wilson@company.com'
        },
        role: 'PARTICIPANT',
        approved: false,
        status: 'UNAPPROVED'
      }
    ],
    createdDate: 1703001600000,
    updatedDate: 1703002600000,
    links: {
      self: [{ href: 'https://bitbucket.company.com/rest/api/1.0/projects/PROJ/repos/test-repo/pull-requests/123' }]
    },
    properties: {
      mergeCommit: {
        id: 'merge123'
      }
    }
  };

  const mergeInfo = {
    mergeCommitHash: 'merge123',
    mergedBy: 'Alice Admin',
    mergedAt: '2023-12-19T12:00:00.000Z',
    mergeCommitMessage: 'Merged PR #123'
  };

  describe('PULL_REQUEST_FIELDS', () => {
    it('should be defined and export field definitions', () => {
      expect(PULL_REQUEST_FIELDS).toBeDefined();
      expect(typeof PULL_REQUEST_FIELDS).toBe('object');
    });

    it('should contain all basic fields', () => {
      const expectedBasicFields = [
        'id',
        'title', 
        'description',
        'state',
        'is_open',
        'is_closed'
      ];

      expectedBasicFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
        expect(PULL_REQUEST_FIELDS[field]).toHaveProperty('type');
        expect(PULL_REQUEST_FIELDS[field]).toHaveProperty('description');
      });
    });

    it('should contain all author fields', () => {
      const expectedAuthorFields = [
        'author',
        'author_username',
        'author_email'
      ];

      expectedAuthorFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
        expect(PULL_REQUEST_FIELDS[field].type).toBe('string');
      });
    });

    it('should contain all branch fields', () => {
      const expectedBranchFields = [
        'source_branch',
        'destination_branch',
        'source_commit',
        'destination_commit'
      ];

      expectedBranchFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
        expect(PULL_REQUEST_FIELDS[field].type).toBe('string');
      });
    });

    it('should contain reviewer and participant fields with nested structure', () => {
      expect(PULL_REQUEST_FIELDS).toHaveProperty('reviewers');
      expect(PULL_REQUEST_FIELDS.reviewers.type).toBe('array');
      expect(PULL_REQUEST_FIELDS.reviewers).toHaveProperty('items');
      expect(PULL_REQUEST_FIELDS.reviewers.items).toHaveProperty('properties');

      expect(PULL_REQUEST_FIELDS).toHaveProperty('participants');
      expect(PULL_REQUEST_FIELDS.participants.type).toBe('array');
      expect(PULL_REQUEST_FIELDS.participants).toHaveProperty('items');
      expect(PULL_REQUEST_FIELDS.participants.items).toHaveProperty('properties');
    });

    it('should contain time fields', () => {
      const expectedTimeFields = [
        'created_on',
        'updated_on'
      ];

      expectedTimeFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
        expect(PULL_REQUEST_FIELDS[field].type).toBe('string');
        expect(PULL_REQUEST_FIELDS[field].format).toBe('date-time');
      });
    });

    it('should contain URL fields', () => {
      const expectedUrlFields = [
        'web_url',
        'api_url'
      ];

      expectedUrlFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
        expect(PULL_REQUEST_FIELDS[field].type).toBe('string');
        expect(PULL_REQUEST_FIELDS[field].format).toBe('uri');
      });
    });

    it('should contain merge-related fields', () => {
      const expectedMergeFields = [
        'is_merged',
        'merge_commit_hash',
        'merged_by',
        'merged_at',
        'merge_commit_message'
      ];

      expectedMergeFields.forEach(field => {
        expect(PULL_REQUEST_FIELDS).toHaveProperty(field);
      });

      expect(PULL_REQUEST_FIELDS.is_merged.type).toBe('boolean');
      expect(PULL_REQUEST_FIELDS.merge_commit_hash.type).toBe('string');
      expect(PULL_REQUEST_FIELDS.merged_by.type).toBe('string');
      expect(PULL_REQUEST_FIELDS.merged_at.type).toBe('string');
      expect(PULL_REQUEST_FIELDS.merge_commit_message.type).toBe('string');
    });

    it('should contain additional fields', () => {
      expect(PULL_REQUEST_FIELDS).toHaveProperty('is_locked');
      expect(PULL_REQUEST_FIELDS.is_locked.type).toBe('boolean');
    });
  });

  describe('Field coverage validation', () => {
    it('should cover all fields produced by formatServerResponse', () => {
      const formattedPR = formatServerResponse(mockServerPR as any, mergeInfo, 'https://bitbucket.company.com');
      const formattedFields = Object.keys(formattedPR);
      const schemaFields = Object.keys(PULL_REQUEST_FIELDS);

      formattedFields.forEach(field => {
        expect(schemaFields).toContain(field);
      });
    });

    it('should have valid field definitions for all schema fields', () => {
      Object.entries(PULL_REQUEST_FIELDS).forEach(([fieldName, fieldDef]) => {
        expect(fieldDef).toHaveProperty('type');
        expect(fieldDef).toHaveProperty('description');
        expect(typeof fieldDef.description).toBe('string');
        expect(fieldDef.description.length).toBeGreaterThan(0);

        // Validate type values
        const validTypes = ['string', 'number', 'boolean', 'array', 'object'];
        expect(validTypes).toContain(fieldDef.type);

        // If it's an array, it should have items definition
        if (fieldDef.type === 'array') {
          expect(fieldDef).toHaveProperty('items');
          expect(fieldDef.items).toHaveProperty('type');
        }

        // If it has format, validate format values
        if (fieldDef.format) {
          const validFormats = ['date-time', 'uri', 'email'];
          expect(validFormats).toContain(fieldDef.format);
        }
      });
    });

    it('should have nested properties defined for complex fields', () => {
      // Check reviewers array structure
      const reviewersField = PULL_REQUEST_FIELDS.reviewers;
      expect(reviewersField.items.type).toBe('object');
      expect(reviewersField.items).toHaveProperty('properties');
      
      const reviewerProps = reviewersField.items.properties;
      expect(reviewerProps).toHaveProperty('name');
      expect(reviewerProps).toHaveProperty('approved');
      expect(reviewerProps).toHaveProperty('status');

      // Check participants array structure
      const participantsField = PULL_REQUEST_FIELDS.participants;
      expect(participantsField.items.type).toBe('object');
      expect(participantsField.items).toHaveProperty('properties');
      
      const participantProps = participantsField.items.properties;
      expect(participantProps).toHaveProperty('name');
      expect(participantProps).toHaveProperty('role');
      expect(participantProps).toHaveProperty('approved');
      expect(participantProps).toHaveProperty('status');
    });
  });

  describe('Field documentation quality', () => {
    it('should have meaningful descriptions for all fields', () => {
      Object.entries(PULL_REQUEST_FIELDS).forEach(([fieldName, fieldDef]) => {
        // Description should be at least 10 characters and contain meaningful content
        expect(fieldDef.description.length).toBeGreaterThanOrEqual(10);
        
        // Should not just repeat the field name
        expect(fieldDef.description.toLowerCase()).not.toBe(fieldName.toLowerCase());
        
        // Should contain descriptive words
        const descriptiveWords = ['the', 'of', 'for', 'pull', 'request', 'commit', 'branch', 'user', 'review'];
        const hasDescriptiveWord = descriptiveWords.some(word => 
          fieldDef.description.toLowerCase().includes(word)
        );
        expect(hasDescriptiveWord).toBe(true);
      });
    });

    it('should use consistent description formatting', () => {
      Object.entries(PULL_REQUEST_FIELDS).forEach(([fieldName, fieldDef]) => {
        // Description should start with uppercase letter
        expect(fieldDef.description[0]).toBe(fieldDef.description[0].toUpperCase());
        
        // Description should not end with period (following API convention)
        expect(fieldDef.description).not.toMatch(/\.$/);
      });
    });
  });
});