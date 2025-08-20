import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PullRequestHandlers } from '../../src/handlers/pull-request-handlers';
import { BitbucketApiClient } from '../../src/utils/api-client';

// Mock the API client
jest.mock('../../src/utils/api-client');

describe('PullRequestHandlers - Fields Integration', () => {
  let pullRequestHandlers: PullRequestHandlers;
  let mockApiClient: jest.Mocked<BitbucketApiClient>;

  const mockServerPRResponse = {
    values: [
      {
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
        properties: {}
      }
    ],
    size: 1,
    isLastPage: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock API client
    mockApiClient = {
      makeRequest: jest.fn(),
      getIsServer: jest.fn().mockReturnValue(true),
      handleApiError: jest.fn()
    } as any;

    pullRequestHandlers = new PullRequestHandlers(
      mockApiClient,
      'https://bitbucket.company.com',
      'test.user@company.com'
    );
  });

  describe('list_pull_requests with fields parameter', () => {
    beforeEach(() => {
      mockApiClient.makeRequest.mockResolvedValue(mockServerPRResponse);
    });

    it('should return all fields when no fields parameter is provided', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      expect(result.content[0].type).toBe('text');
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      // Verify all standard fields are present
      expect(pr).toHaveProperty('id', 123);
      expect(pr).toHaveProperty('title', 'Test PR');
      expect(pr).toHaveProperty('description', 'Test description');
      expect(pr).toHaveProperty('state', 'OPEN');
      expect(pr).toHaveProperty('author', 'John Doe');
      expect(pr).toHaveProperty('author_username', 'john.doe');
      expect(pr).toHaveProperty('author_email', 'john.doe@company.com');
      expect(pr).toHaveProperty('source_branch', 'feature/test');
      expect(pr).toHaveProperty('destination_branch', 'main');
      expect(pr).toHaveProperty('reviewers');
      expect(pr).toHaveProperty('participants');
      expect(pr).toHaveProperty('created_on');
      expect(pr).toHaveProperty('updated_on');
      expect(pr).toHaveProperty('web_url');
      expect(pr).toHaveProperty('api_url');
    });

    it('should return only specified basic fields', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title,state'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      // Should only have the requested fields
      expect(Object.keys(pr)).toEqual(['id', 'title', 'state']);
      expect(pr.id).toBe(123);
      expect(pr.title).toBe('Test PR');
      expect(pr.state).toBe('OPEN');
    });

    it('should return only author-related fields', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,author,author_username,author_email'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(Object.keys(pr).sort()).toEqual(['id', 'author', 'author_username', 'author_email'].sort());
      expect(pr.id).toBe(123);
      expect(pr.author).toBe('John Doe');
      expect(pr.author_username).toBe('john.doe');
      expect(pr.author_email).toBe('john.doe@company.com');
    });

    it('should return only branch-related fields', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,source_branch,destination_branch,source_commit,destination_commit'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(Object.keys(pr).sort()).toEqual(['id', 'source_branch', 'destination_branch', 'source_commit', 'destination_commit'].sort());
      expect(pr.source_branch).toBe('feature/test');
      expect(pr.destination_branch).toBe('main');
      expect(pr.source_commit).toBe('abc123');
      expect(pr.destination_commit).toBe('def456');
    });

    it('should support nested field access with dot notation', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,reviewers.name,reviewers.approved'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(pr.id).toBe(123);
      expect(pr.reviewers).toEqual([{
        name: 'Jane Smith',
        approved: true
      }]);
    });

    it('should support accessing specific array elements', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,reviewers.0.name,reviewers.0.approved'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(pr.id).toBe(123);
      expect(pr.reviewers).toEqual([{
        name: 'Jane Smith',
        approved: true
      }]);
    });

    it('should handle mixed simple and nested fields', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title,author,reviewers.name,participants.role'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(pr.id).toBe(123);
      expect(pr.title).toBe('Test PR');
      expect(pr.author).toBe('John Doe');
      expect(pr.reviewers).toEqual([{ name: 'Jane Smith' }]);
      expect(pr.participants).toEqual([{ role: 'PARTICIPANT' }]);
    });

    it('should handle fields that do not exist gracefully', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title,nonexistent_field,invalid.nested.field'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      // Should only include existing fields
      expect(Object.keys(pr).sort()).toEqual(['id', 'title'].sort());
      expect(pr.id).toBe(123);
      expect(pr.title).toBe('Test PR');
    });

    it('should handle empty fields parameter', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: ''
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      // Empty fields should return all fields (same as no fields parameter)
      expect(pr).toHaveProperty('id');
      expect(pr).toHaveProperty('title');
      expect(pr).toHaveProperty('author');
      expect(Object.keys(pr).length).toBeGreaterThan(10);
    });

    it('should handle whitespace in fields parameter', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: ' id , title , state '
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      const pr = responseData.pull_requests[0];
      
      expect(Object.keys(pr).sort()).toEqual(['id', 'title', 'state'].sort());
    });

    it('should preserve pagination metadata when using fields', async () => {
      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title',
        limit: 10,
        start: 0
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      
      expect(responseData).toHaveProperty('pull_requests');
      expect(responseData).toHaveProperty('total_count', 1);
      expect(responseData).toHaveProperty('start', 0);
      expect(responseData).toHaveProperty('limit', 10);
      expect(responseData).toHaveProperty('has_more', false);
      
      // Check that PRs have only the filtered fields
      expect(Object.keys(responseData.pull_requests[0]).sort()).toEqual(['id', 'title'].sort());
    });

    it('should work with multiple PRs in the response', async () => {
      const multiPRResponse = {
        ...mockServerPRResponse,
        values: [
          mockServerPRResponse.values[0],
          {
            ...mockServerPRResponse.values[0],
            id: 124,
            title: 'Second PR',
            author: {
              user: {
                displayName: 'Alice Brown',
                name: 'alice.brown',
                emailAddress: 'alice.brown@company.com'
              }
            }
          }
        ],
        size: 2
      };

      mockApiClient.makeRequest.mockResolvedValue(multiPRResponse);

      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title,author'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      const responseData = JSON.parse(result.content[0].text);
      
      expect(responseData.pull_requests).toHaveLength(2);
      
      expect(responseData.pull_requests[0]).toEqual({
        id: 123,
        title: 'Test PR',
        author: 'John Doe'
      });
      
      expect(responseData.pull_requests[1]).toEqual({
        id: 124,
        title: 'Second PR',
        author: 'Alice Brown'
      });
    });
  });

  describe('error handling with fields', () => {
    it('should handle API errors while preserving fields functionality', async () => {
      const errorResponse = new Error('API Error');
      mockApiClient.makeRequest.mockRejectedValue(errorResponse);
      mockApiClient.handleApiError.mockReturnValue({
        content: [{ type: 'text', text: 'Error occurred' }],
        isError: true
      });

      const args = {
        workspace: 'PROJ',
        repository: 'test-repo',
        fields: 'id,title'
      };

      const result = await pullRequestHandlers.handleListPullRequests(args);
      
      expect(mockApiClient.handleApiError).toHaveBeenCalledWith(
        errorResponse,
        'listing pull requests in PROJ/test-repo'
      );
      expect(result.content[0].text).toBe('Error occurred');
    });
  });
});