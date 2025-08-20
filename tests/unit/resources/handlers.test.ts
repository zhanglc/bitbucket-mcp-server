import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { ResourceHandlers } from '../../../src/resources/handlers';
import { BitbucketApiClient } from '../../../src/utils/api-client';
import { PullRequestHandlers } from '../../../src/handlers/pull-request-handlers';
import { BranchHandlers } from '../../../src/handlers/branch-handlers';
import { FileHandlers } from '../../../src/handlers/file-handlers';
import { SearchHandlers } from '../../../src/handlers/search-handlers';
import { ReviewHandlers } from '../../../src/handlers/review-handlers';

// Mock all the dependencies
jest.mock('../../../src/utils/api-client');
jest.mock('../../../src/handlers/pull-request-handlers');
jest.mock('../../../src/handlers/branch-handlers');
jest.mock('../../../src/handlers/file-handlers');
jest.mock('../../../src/handlers/search-handlers');
jest.mock('../../../src/handlers/review-handlers');
jest.mock('../../../src/resources/schema-handlers');

describe('ResourceHandlers', () => {
  let resourceHandlers: ResourceHandlers;
  let mockApiClient: jest.Mocked<BitbucketApiClient>;
  let mockPullRequestHandlers: jest.Mocked<PullRequestHandlers>;
  let mockBranchHandlers: jest.Mocked<BranchHandlers>;
  let mockFileHandlers: jest.Mocked<FileHandlers>;
  let mockSearchHandlers: jest.Mocked<SearchHandlers>;
  let mockReviewHandlers: jest.Mocked<ReviewHandlers>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error to reduce noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock instances
    mockApiClient = {
      getIsServer: jest.fn().mockReturnValue(false),
    } as any;

    mockPullRequestHandlers = {
      handleGetPullRequest: jest.fn(),
      handleListPullRequests: jest.fn(),
      handleListPrCommits: jest.fn(),
    } as any;

    mockBranchHandlers = {
      handleListBranches: jest.fn(),
      handleGetBranch: jest.fn(),
    } as any;

    mockFileHandlers = {
      handleGetFileContent: jest.fn(),
      handleListDirectoryContent: jest.fn(),
    } as any;

    mockSearchHandlers = {
      handleSearchCode: jest.fn(),
    } as any;

    mockReviewHandlers = {
      handleGetPullRequestDiff: jest.fn(),
    } as any;

    // Create the ResourceHandlers instance
    resourceHandlers = new ResourceHandlers(
      mockApiClient,
      mockPullRequestHandlers,
      mockBranchHandlers,
      mockFileHandlers,
      mockSearchHandlers,
      mockReviewHandlers
    );
  });

  describe('handleResourceRead', () => {
    describe('schema resources', () => {
      it('should handle schema resource URIs', async () => {
        const uri = 'bitbucket://schema/index';
        
        // Mock the schema handlers more simply
        const mockSchemaResult = {
          uri: 'bitbucket://schema/index',
          mimeType: 'application/json',
          text: '{"types": ["pullrequest", "repository"]}'
        };
        
        // Create a simple mock function
        const handleSchemaResource = jest.fn() as jest.MockedFunction<any>;
        handleSchemaResource.mockResolvedValue(mockSchemaResult);
        
        // Replace the schema handlers instance
        (resourceHandlers as any).schemaHandlers = {
          handleSchemaResource
        };

        const result = await resourceHandlers.handleResourceRead(uri);

        expect(handleSchemaResource).toHaveBeenCalledWith(uri);
        expect(result.contents).toHaveLength(1);
        expect(result.contents[0]).toEqual(mockSchemaResult);
      });
    });

    describe('file resources', () => {
      it('should handle file resource URIs', async () => {
        const uri = 'bitbucket://PROJ/my-repo/file/src/index.ts';
        const mockFileResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              file_path: 'src/index.ts',
              content: 'console.log("hello");',
              size: 100
            })
          }]
        };

        mockFileHandlers.handleGetFileContent.mockResolvedValue(mockFileResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        expect(mockFileHandlers.handleGetFileContent).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          file_path: 'src/index.ts',
          branch: undefined,
          start_line: undefined,
          line_count: undefined,
          full_content: false
        });

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe(uri);
        expect(result.contents[0].mimeType).toBe('application/json');
      });

      it('should handle file resources with query parameters', async () => {
        const uri = 'bitbucket://PROJ/my-repo/file/src/index.ts?ref=develop&start_line=10&line_count=20&full_content=true';
        const mockFileResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({ file_path: 'src/index.ts', content: 'partial content' })
          }]
        };

        mockFileHandlers.handleGetFileContent.mockResolvedValue(mockFileResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockFileHandlers.handleGetFileContent).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          file_path: 'src/index.ts',
          branch: 'develop',
          start_line: 10,
          line_count: 20,
          full_content: true
        });
      });

      it('should throw error for file resource without path', async () => {
        const uri = 'bitbucket://PROJ/my-repo/file/';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('File path is required');
      });

      it('should throw error for file resource without workspace/repo', async () => {
        // Create URI that will be parsed as schema resource but has file path
        const uri = 'bitbucket:///file/src/index.ts';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow();
      });
    });

    describe('directory resources', () => {
      it('should handle directory resource URIs', async () => {
        const uri = 'bitbucket://PROJ/my-repo/dir/src';
        const mockDirResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              path: 'src',
              contents: [
                { name: 'index.ts', type: 'file' },
                { name: 'utils', type: 'directory' }
              ]
            })
          }]
        };

        mockFileHandlers.handleListDirectoryContent.mockResolvedValue(mockDirResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        expect(mockFileHandlers.handleListDirectoryContent).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          path: 'src',
          branch: undefined
        });

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe(uri);
      });

      it('should handle root directory', async () => {
        const uri = 'bitbucket://PROJ/my-repo/dir/';
        const mockDirResponse = {
          content: [{ type: 'text', text: JSON.stringify({ path: '', contents: [] }) }]
        };

        mockFileHandlers.handleListDirectoryContent.mockResolvedValue(mockDirResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockFileHandlers.handleListDirectoryContent).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          path: undefined,
          branch: undefined
        });
      });
    });

    describe('pull request resources', () => {
      it('should handle pull request details', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123';
        const mockPRResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: 123,
              title: 'Test PR',
              state: 'OPEN'
            })
          }]
        };

        mockPullRequestHandlers.handleGetPullRequest.mockResolvedValue(mockPRResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleGetPullRequest).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123
        });

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe(uri);
      });

      it('should handle pull request diff', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123/diff';
        const mockDiffResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pull_request_id: 123,
              diff: '--- a/file.ts\n+++ b/file.ts'
            })
          }]
        };

        mockReviewHandlers.handleGetPullRequestDiff.mockResolvedValue(mockDiffResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockReviewHandlers.handleGetPullRequestDiff).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123,
          context: undefined,
          include_patterns: undefined,
          exclude_patterns: undefined,
          mode: undefined
        });
      });

      it('should handle pull request diff with parameters', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123/diff?context=5&mode=structured';
        const mockDiffResponse = {
          content: [{ type: 'text', text: JSON.stringify({ diff: 'diff content' }) }]
        };

        mockReviewHandlers.handleGetPullRequestDiff.mockResolvedValue(mockDiffResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockReviewHandlers.handleGetPullRequestDiff).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123,
          context: 5,
          include_patterns: undefined,
          exclude_patterns: undefined,
          mode: 'structured'
        });
      });

      it('should handle pull request commits', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123/commits';
        const mockCommitsResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pull_request_id: 123,
              commits: [{ hash: 'abc123', message: 'commit message' }]
            })
          }]
        };

        mockPullRequestHandlers.handleListPrCommits.mockResolvedValue(mockCommitsResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleListPrCommits).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123,
          start: undefined,
          limit: undefined
        });
      });

      it('should handle single file diff', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123/diff/src/index.ts';
        const mockFileDiffResponse = {
          content: [{ type: 'text', text: JSON.stringify({ file_diff: 'diff content' }) }]
        };

        mockReviewHandlers.handleGetPullRequestDiff.mockResolvedValue(mockFileDiffResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockReviewHandlers.handleGetPullRequestDiff).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123,
          file_path: 'src/index.ts',
          context: undefined,
          mode: undefined
        });
      });

      it('should throw error for PR without ID', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('PR ID is required');
      });

      it('should throw error for invalid PR ID', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/invalid-id';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Valid PR ID is required');
      });

      it('should throw error for unknown PR sub-resource', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123/unknown';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Unknown pull request sub-resource: unknown');
      });
    });

    describe('branch resources', () => {
      it('should handle branches list', async () => {
        const uri = 'bitbucket://PROJ/my-repo/branches';
        const mockBranchesResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              branches: [
                { name: 'main', target: { hash: 'abc123' } },
                { name: 'develop', target: { hash: 'def456' } }
              ]
            })
          }]
        };

        mockBranchHandlers.handleListBranches.mockResolvedValue(mockBranchesResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockBranchHandlers.handleListBranches).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          filter: undefined,
          limit: undefined,
          start: undefined
        });
      });

      it('should handle specific branch details', async () => {
        const uri = 'bitbucket://PROJ/my-repo/branch/feature-branch';
        const mockBranchResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              name: 'feature-branch',
              target: { hash: 'abc123' }
            })
          }]
        };

        mockBranchHandlers.handleGetBranch.mockResolvedValue(mockBranchResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockBranchHandlers.handleGetBranch).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          branch_name: 'feature-branch'
        });
      });

      it('should throw error for branch without name', async () => {
        const uri = 'bitbucket://PROJ/my-repo/branch/';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Branch name is required');
      });
    });

    describe('search resources', () => {
      it('should handle search queries', async () => {
        const uri = 'bitbucket://PROJ/my-repo/search?query=function&limit=50';
        const mockSearchResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              query: 'function',
              results: [{ file: 'index.ts', line: 10, match: 'function test()' }]
            })
          }]
        };

        mockSearchHandlers.handleSearchCode.mockResolvedValue(mockSearchResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockSearchHandlers.handleSearchCode).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          search_query: 'function',
          file_extensions: undefined,
          include_paths: undefined,
          exclude_paths: undefined,
          limit: 50
        });
      });

      it('should throw error for search without query', async () => {
        const uri = 'bitbucket://PROJ/my-repo/search';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Search query is required');
      });
    });

    describe('pull requests list', () => {
      it('should handle pull requests list', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-requests?state=OPEN&limit=25';
        const mockPRsResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              pull_requests: [
                { id: 123, title: 'PR 1', state: 'OPEN' },
                { id: 124, title: 'PR 2', state: 'OPEN' }
              ]
            })
          }]
        };

        mockPullRequestHandlers.handleListPullRequests.mockResolvedValue(mockPRsResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleListPullRequests).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          state: 'OPEN',
          author: undefined,
          reviewer: undefined,
          limit: 25,
          start: 0
        });
      });

      it('should use default values for pull requests list', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-requests';
        const mockPRsResponse = {
          content: [{ type: 'text', text: JSON.stringify({ pull_requests: [] }) }]
        };

        mockPullRequestHandlers.handleListPullRequests.mockResolvedValue(mockPRsResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleListPullRequests).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          state: 'OPEN',
          author: undefined,
          reviewer: undefined,
          limit: 25,
          start: 0
        });
      });
    });

    describe('backward compatibility', () => {
      it('should redirect legacy pr to pull-request', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pr/123';
        const mockPRResponse = {
          content: [{ type: 'text', text: JSON.stringify({ id: 123 }) }]
        };

        mockPullRequestHandlers.handleGetPullRequest.mockResolvedValue(mockPRResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleGetPullRequest).toHaveBeenCalledWith({
          workspace: 'PROJ',
          repository: 'my-repo',
          pull_request_id: 123
        });
      });

      it('should redirect legacy prs to pull-requests', async () => {
        const uri = 'bitbucket://PROJ/my-repo/prs';
        const mockPRsResponse = {
          content: [{ type: 'text', text: JSON.stringify({ pull_requests: [] }) }]
        };

        mockPullRequestHandlers.handleListPullRequests.mockResolvedValue(mockPRsResponse);

        await resourceHandlers.handleResourceRead(uri);

        expect(mockPullRequestHandlers.handleListPullRequests).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should throw error for unknown resource type', async () => {
        const uri = 'bitbucket://PROJ/my-repo/unknown/resource';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Unknown resource type: unknown');
      });

      it('should handle invalid URI format', async () => {
        const uri = 'invalid://uri';

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow('Invalid URI scheme');
      });

      it('should handle handler errors gracefully', async () => {
        const uri = 'bitbucket://PROJ/my-repo/file/error.ts';
        const error = new Error('File not found');

        mockFileHandlers.handleGetFileContent.mockRejectedValue(error);

        const result = await resourceHandlers.handleResourceRead(uri);

        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe(uri);
        expect(result.contents[0].mimeType).toBe('application/json');
        
        const responseData = JSON.parse(result.contents[0].text);
        expect(responseData.error).toBe('Resource retrieval failed');
        expect(responseData.message).toBe('File not found');
      });

      it('should re-throw MCP errors', async () => {
        const uri = 'bitbucket://PROJ/my-repo/file/error.ts';
        const mcpError = new McpError(ErrorCode.InvalidParams, 'Invalid parameters');

        mockFileHandlers.handleGetFileContent.mockRejectedValue(mcpError);

        await expect(resourceHandlers.handleResourceRead(uri))
          .rejects.toThrow(mcpError);
      });
    });

    describe('field filtering', () => {
      it('should apply field filtering when specified', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123?fields=id,title,state';
        const mockPRResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: 123,
              title: 'Test PR',
              state: 'OPEN',
              description: 'This should be filtered out',
              author: { name: 'User' }
            })
          }]
        };

        mockPullRequestHandlers.handleGetPullRequest.mockResolvedValue(mockPRResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        const responseData = JSON.parse(result.contents[0].text);
        expect(responseData).toEqual({
          id: 123,
          title: 'Test PR',
          state: 'OPEN'
        });
      });

      it('should apply exclude filtering when specified', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123?exclude=description,author';
        const mockPRResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: 123,
              title: 'Test PR',
              state: 'OPEN',
              description: 'This should be excluded',
              author: { name: 'User' }
            })
          }]
        };

        mockPullRequestHandlers.handleGetPullRequest.mockResolvedValue(mockPRResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        const responseData = JSON.parse(result.contents[0].text);
        expect(responseData).toEqual({
          id: 123,
          title: 'Test PR',
          state: 'OPEN'
        });
      });

      it('should apply format filtering for minimal format', async () => {
        const uri = 'bitbucket://PROJ/my-repo/pull-request/123?format=minimal';
        const mockPRResponse = {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: 123,
              title: 'Test PR',
              state: 'OPEN',
              description: 'Detailed description',
              author: { display_name: 'Test User' },
              source: { branch: { name: 'feature' } },
              destination: { branch: { name: 'main' } },
              created_on: '2025-01-21T10:00:00Z',
              updated_on: '2025-01-21T10:30:00Z'
            })
          }]
        };

        mockPullRequestHandlers.handleGetPullRequest.mockResolvedValue(mockPRResponse);

        const result = await resourceHandlers.handleResourceRead(uri);

        const responseData = JSON.parse(result.contents[0].text);
        // Should only include minimal fields for PR
        expect(responseData).toEqual({
          id: 123,
          title: 'Test PR',
          state: 'OPEN',
          author: { display_name: 'Test User' },
          created_on: '2025-01-21T10:00:00Z',
          updated_on: '2025-01-21T10:30:00Z'
        });
      });
    });
  });
});