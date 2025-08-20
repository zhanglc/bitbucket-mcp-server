import { describe, it, expect } from '@jest/globals';
import { filterFields, parseFieldsParameter, getNestedValue, setNestedValue } from '../../../src/utils/field-filter';

describe('Field Filter Utilities', () => {
  const sampleObject = {
    id: 123,
    title: 'Test PR',
    description: 'Test description',
    state: 'OPEN',
    author: 'John Doe',
    author_username: 'john.doe',
    author_email: 'john.doe@company.com',
    reviewers: [
      {
        name: 'Jane Smith',
        approved: true,
        status: 'APPROVED'
      },
      {
        name: 'Bob Wilson',
        approved: false,
        status: 'UNAPPROVED'
      }
    ],
    participants: [
      {
        user: {
          displayName: 'Alice Brown',
          email: 'alice@company.com'
        },
        role: 'PARTICIPANT',
        approved: false
      }
    ],
    metadata: {
      project: {
        key: 'PROJ',
        name: 'Test Project'
      },
      stats: {
        commits: 5,
        files_changed: 10
      }
    }
  };

  describe('parseFieldsParameter', () => {
    it('should parse comma-separated fields', () => {
      const result = parseFieldsParameter('id,title,state');
      expect(result).toEqual(['id', 'title', 'state']);
    });

    it('should handle whitespace around fields', () => {
      const result = parseFieldsParameter(' id , title , state ');
      expect(result).toEqual(['id', 'title', 'state']);
    });

    it('should handle empty string', () => {
      const result = parseFieldsParameter('');
      expect(result).toEqual([]);
    });

    it('should handle single field', () => {
      const result = parseFieldsParameter('id');
      expect(result).toEqual(['id']);
    });

    it('should handle nested fields', () => {
      const result = parseFieldsParameter('id,reviewers.name,metadata.project.key');
      expect(result).toEqual(['id', 'reviewers.name', 'metadata.project.key']);
    });

    it('should handle array index access', () => {
      const result = parseFieldsParameter('reviewers.0.name,reviewers.1.approved');
      expect(result).toEqual(['reviewers.0.name', 'reviewers.1.approved']);
    });
  });

  describe('getNestedValue', () => {
    it('should get simple property value', () => {
      const result = getNestedValue(sampleObject, 'id');
      expect(result).toBe(123);
    });

    it('should get nested property value', () => {
      const result = getNestedValue(sampleObject, 'metadata.project.key');
      expect(result).toBe('PROJ');
    });

    it('should get array element by index', () => {
      const result = getNestedValue(sampleObject, 'reviewers.0.name');
      expect(result).toBe('Jane Smith');
    });

    it('should get property from all array elements', () => {
      const result = getNestedValue(sampleObject, 'reviewers.name');
      expect(result).toEqual(['Jane Smith', 'Bob Wilson']);
    });

    it('should return undefined for non-existent property', () => {
      const result = getNestedValue(sampleObject, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent nested property', () => {
      const result = getNestedValue(sampleObject, 'metadata.nonexistent.field');
      expect(result).toBeUndefined();
    });

    it('should handle array index out of bounds', () => {
      const result = getNestedValue(sampleObject, 'reviewers.10.name');
      expect(result).toBeUndefined();
    });

    it('should handle deeply nested object access', () => {
      const result = getNestedValue(sampleObject, 'participants.0.user.displayName');
      expect(result).toBe('Alice Brown');
    });
  });

  describe('setNestedValue', () => {
    it('should set simple property value', () => {
      const target = {};
      setNestedValue(target, 'id', 123);
      expect(target).toEqual({ id: 123 });
    });

    it('should set nested property value', () => {
      const target = {};
      setNestedValue(target, 'metadata.project.key', 'PROJ');
      expect(target).toEqual({
        metadata: {
          project: {
            key: 'PROJ'
          }
        }
      });
    });

    it('should set array element by index', () => {
      const target = {};
      setNestedValue(target, 'reviewers.0.name', 'Jane Smith');
      expect(target).toEqual({
        reviewers: [{ name: 'Jane Smith' }]
      });
    });

    it('should create array when setting property on all elements', () => {
      const target = {};
      setNestedValue(target, 'reviewers.name', ['Jane Smith', 'Bob Wilson']);
      expect(target).toEqual({
        reviewers: [
          { name: 'Jane Smith' },
          { name: 'Bob Wilson' }
        ]
      });
    });

    it('should handle mixed object and array creation', () => {
      const target = {};
      setNestedValue(target, 'participants.0.user.email', 'alice@company.com');
      expect(target).toEqual({
        participants: [
          {
            user: {
              email: 'alice@company.com'
            }
          }
        ]
      });
    });
  });

  describe('filterFields', () => {
    it('should return all fields when no fields specified', () => {
      const result = filterFields(sampleObject, []);
      expect(result).toEqual(sampleObject);
    });

    it('should filter simple fields', () => {
      const result = filterFields(sampleObject, ['id', 'title', 'state']);
      expect(result).toEqual({
        id: 123,
        title: 'Test PR',
        state: 'OPEN'
      });
    });

    it('should filter nested fields', () => {
      const result = filterFields(sampleObject, ['id', 'metadata.project.key']);
      expect(result).toEqual({
        id: 123,
        metadata: {
          project: {
            key: 'PROJ'
          }
        }
      });
    });

    it('should filter array element fields', () => {
      const result = filterFields(sampleObject, ['id', 'reviewers.0.name', 'reviewers.1.approved']);
      expect(result).toEqual({
        id: 123,
        reviewers: [
          { name: 'Jane Smith' },
          { approved: false }
        ]
      });
    });

    it('should filter properties from all array elements', () => {
      const result = filterFields(sampleObject, ['id', 'reviewers.name']);
      expect(result).toEqual({
        id: 123,
        reviewers: [
          { name: 'Jane Smith' },
          { name: 'Bob Wilson' }
        ]
      });
    });

    it('should handle mixed field types', () => {
      const result = filterFields(sampleObject, [
        'id',
        'title',
        'reviewers.name',
        'reviewers.0.approved',
        'metadata.project.key'
      ]);
      expect(result).toEqual({
        id: 123,
        title: 'Test PR',
        reviewers: [
          { name: 'Jane Smith', approved: true },
          { name: 'Bob Wilson' }
        ],
        metadata: {
          project: {
            key: 'PROJ'
          }
        }
      });
    });

    it('should ignore non-existent fields', () => {
      const result = filterFields(sampleObject, ['id', 'nonexistent', 'invalid.nested.field']);
      expect(result).toEqual({
        id: 123
      });
    });

    it('should handle empty object', () => {
      const result = filterFields({}, ['id', 'title']);
      expect(result).toEqual({});
    });

    it('should handle complex deeply nested access', () => {
      const result = filterFields(sampleObject, [
        'participants.0.user.displayName',
        'participants.user.email',
        'metadata.stats'
      ]);
      expect(result).toEqual({
        participants: [
          {
            user: {
              displayName: 'Alice Brown',
              email: 'alice@company.com'
            }
          }
        ],
        metadata: {
          stats: {
            commits: 5,
            files_changed: 10
          }
        }
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle real pull request filtering scenario', () => {
      const pullRequest = {
        id: 123,
        title: 'Add new feature',
        description: 'This PR adds a new feature',
        state: 'OPEN',
        author: 'John Doe',
        author_username: 'john.doe',
        author_email: 'john.doe@company.com',
        source_branch: 'feature/new-feature',
        destination_branch: 'main',
        reviewers: [
          { name: 'Jane Smith', approved: true, status: 'APPROVED' },
          { name: 'Bob Wilson', approved: false, status: 'UNAPPROVED' }
        ],
        created_on: '2023-12-19T10:00:00.000Z',
        updated_on: '2023-12-19T11:00:00.000Z',
        web_url: 'https://bitbucket.company.com/projects/PROJ/repos/test-repo/pull-requests/123',
        api_url: 'https://bitbucket.company.com/rest/api/1.0/projects/PROJ/repos/test-repo/pull-requests/123'
      };

      const fields = parseFieldsParameter('id,title,state,author,reviewers.name,reviewers.approved');
      const result = filterFields(pullRequest, fields);

      expect(result).toEqual({
        id: 123,
        title: 'Add new feature',
        state: 'OPEN',
        author: 'John Doe',
        reviewers: [
          { name: 'Jane Smith', approved: true },
          { name: 'Bob Wilson', approved: false }
        ]
      });
    });

    it('should handle minimal field selection', () => {
      const pullRequest = {
        id: 123,
        title: 'Add new feature',
        state: 'OPEN',
        author: 'John Doe',
        reviewers: [
          { name: 'Jane Smith', approved: true },
          { name: 'Bob Wilson', approved: false }
        ]
      };

      const fields = parseFieldsParameter('id,title');
      const result = filterFields(pullRequest, fields);

      expect(result).toEqual({
        id: 123,
        title: 'Add new feature'
      });
    });
  });
});