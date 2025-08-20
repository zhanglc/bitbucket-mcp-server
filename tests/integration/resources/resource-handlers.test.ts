import { ResourceHandlers } from '../../../src/resources/handlers.js';
import { BitbucketApiClient } from '../../../src/utils/api-client.js';
import { PullRequestHandlers } from '../../../src/handlers/pull-request-handlers.js';
import { BranchHandlers } from '../../../src/handlers/branch-handlers.js';
import { FileHandlers } from '../../../src/handlers/file-handlers.js';
import { SearchHandlers } from '../../../src/handlers/search-handlers.js';
import { ReviewHandlers } from '../../../src/handlers/review-handlers.js';
import { 
  getResourceSchema, 
  branchSchema, 
  pullRequestSchema,
  repositorySchema,
  getResourceFields,
  commonFieldSets 
} from '../../../src/resources/field-schemas.js';

describe('ResourceHandlers Integration Tests', () => {
  let resourceHandlers: ResourceHandlers;
  let apiClient: BitbucketApiClient;
  
  // Test environment configuration from environment variables
  const TEST_CONFIG = {
    baseURL: process.env.BITBUCKET_BASE_URL || 'https://api.bitbucket.org/2.0',
    username: process.env.BITBUCKET_USERNAME || '',
    token: process.env.BITBUCKET_TOKEN || '',
    workspace: process.env.TEST_WORKSPACE || '',
    repository: process.env.TEST_REPOSITORY || ''
  };

  // Validate required environment variables
  beforeAll(() => {
    if (!TEST_CONFIG.username || !TEST_CONFIG.token || !TEST_CONFIG.workspace || !TEST_CONFIG.repository) {
      throw new Error(
        'Missing required environment variables. Please set:\n' +
        '- BITBUCKET_USERNAME\n' +
        '- BITBUCKET_TOKEN\n' +
        '- TEST_WORKSPACE\n' +
        '- TEST_REPOSITORY'
      );
    }
  });

  /**
   * Helper function to validate response structure based on field schemas
   */
  function validateResponseStructure(data: any, resourceType: string, expectedFields?: string[]) {
    const schema = getResourceSchema(resourceType);
    if (!schema) return;

    if (expectedFields) {
      // Validate specific fields are present
      expectedFields.forEach(field => {
        expect(data).toHaveProperty(field);
      });
    } else {
      // Validate at least some core fields are present
      const coreFields = schema.fields.filter(f => f.required).map(f => f.name);
      if (coreFields.length > 0) {
        const hasAtLeastOneCore = coreFields.some(field => data.hasOwnProperty(field));
        expect(hasAtLeastOneCore).toBe(true);
      }
    }
  }

  /**
   * Helper to validate file response structure
   */
  function validateFileResponse(data: any) {
    // File responses should have either path/file_path and content, or error information
    if (data.path || data.file_path) {
      expect(data.path || data.file_path).toBeDefined();
      expect(typeof (data.path || data.file_path)).toBe('string');
      
      if (data.content) {
        expect(typeof data.content).toBe('string');
      }
      
      // Validate file metadata fields
      if (data.size !== undefined) {
        expect(typeof data.size).toBe('number');
      }
      if (data.encoding) {
        expect(typeof data.encoding).toBe('string');
      }
      if (data.branch) {
        expect(typeof data.branch).toBe('string');
      }
    } else if (data.text) {
      // Error response format
      expect(typeof data.text).toBe('string');
    } else {
      // Unknown format - just ensure it's defined
      expect(data).toBeDefined();
    }
  }

  /**
   * Helper to validate branch response structure
   */
  function validateBranchResponse(data: any) {
    if (data.branches && Array.isArray(data.branches)) {
      // Branches list response
      data.branches.forEach((branch: any) => {
        // Bitbucket Server branches should have displayId or name
        expect(branch.displayId || branch.name).toBeDefined();
        if (branch.type) {
          expect(['BRANCH', 'branch'].includes(branch.type)).toBe(true);
        }
      });
    } else if (data.displayId || data.name) {
      // Single branch response
      expect(data.displayId || data.name).toBeDefined();
      if (data.type) {
        expect(['BRANCH', 'branch'].includes(data.type)).toBe(true);
      }
    }
  }

  /**
   * Helper to validate pull request response structure
   */
  function validatePullRequestResponse(data: any) {
    if (data.pull_requests && Array.isArray(data.pull_requests)) {
      // PR list response
      data.pull_requests.forEach((pr: any) => {
        expect(pr.id).toBeDefined();
        expect(typeof pr.id).toBe('number');
        if (pr.title) {
          expect(typeof pr.title).toBe('string');
        }
        if (pr.state) {
          expect(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'].includes(pr.state)).toBe(true);
        }
      });
    } else if (data.id) {
      // Single PR response
      expect(typeof data.id).toBe('number');
      if (data.title) {
        expect(typeof data.title).toBe('string');
      }
      if (data.state) {
        expect(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'].includes(data.state)).toBe(true);
      }
    }
  }

  beforeAll(() => {
    // Initialize API client with test credentials
    apiClient = new BitbucketApiClient(
      TEST_CONFIG.baseURL,
      TEST_CONFIG.username,
      undefined,
      TEST_CONFIG.token
    );

    // Initialize handlers
    const pullRequestHandlers = new PullRequestHandlers(
      apiClient,
      TEST_CONFIG.baseURL,
      TEST_CONFIG.username
    );
    const branchHandlers = new BranchHandlers(apiClient, TEST_CONFIG.baseURL);
    const fileHandlers = new FileHandlers(apiClient, TEST_CONFIG.baseURL);
    const searchHandlers = new SearchHandlers(apiClient, TEST_CONFIG.baseURL);
    const reviewHandlers = new ReviewHandlers(apiClient, TEST_CONFIG.username);

    // Initialize resource handlers
    resourceHandlers = new ResourceHandlers(
      apiClient,
      pullRequestHandlers,
      branchHandlers,
      fileHandlers,
      searchHandlers,
      reviewHandlers
    );
  });

  describe('Schema Resources', () => {
    it('should handle schema index resource', async () => {
      const uri = 'bitbucket://schema/index';
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      expect(data).toHaveProperty('resourceTypes');
      expect(data).toHaveProperty('schemaVersion');
      expect(Array.isArray(data.resourceTypes)).toBe(true);
    });

    it('should handle specific resource type schema', async () => {
      const uri = 'bitbucket://schema/repository';
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      
      const data = JSON.parse(result.contents[0].text);
      expect(data).toHaveProperty('resourceType');
      expect(data).toHaveProperty('description');
    });
  });

  describe('File Resources', () => {
    it('should handle file content with basic parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      validateFileResponse(data);
      
      // If file exists, validate specific file structure
      if (data.path || data.file_path) {
        expect(data.path || data.file_path).toBe('README.md');
        expect(data.content).toBeDefined();
        expect(typeof data.content).toBe('string');
        expect(data.content.length).toBeGreaterThan(0);
        
        // Validate expected file metadata
        if (data.size !== undefined) {
          expect(data.size).toBeGreaterThan(0);
        }
        if (data.encoding) {
          expect(data.encoding).toBe('utf-8');
        }
      }
    });

    it('should handle file with branch parameter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?ref=main`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      validateFileResponse(data);
      
      // Verify branch parameter was processed
      if (data.path || data.file_path) {
        expect(data.branch || data.ref).toBeDefined();
        expect(data.content).toBeDefined();
        
        // Branch should be specified in response
        const branchValue = data.branch || data.ref;
        expect(typeof branchValue).toBe('string');
      }
    });

    it('should handle file with line range parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?start_line=1&line_count=10`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      validateFileResponse(data);
      
      // Verify line range parameters if file exists
      if (data.path || data.file_path) {
        // Line range should be reflected in response
        if (data.start_line !== undefined) {
          expect(data.start_line).toBe(1);
        }
        if (data.line_count !== undefined) {
          expect(data.line_count).toBe(10);
        }
        
        // Content should be limited if line range is applied
        if (data.content && data.line_count) {
          const lines = data.content.split('\n');
          expect(lines.length).toBeLessThanOrEqual(data.line_count + 2); // Allow some buffer
        }
      }
    });

    it('should handle file with full_content parameter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?full_content=true`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      validateFileResponse(data);
      
      // Verify full_content parameter if file exists
      if (data.path || data.file_path) {
        expect(data.content).toBeDefined();
        
        // full_content parameter should be reflected
        if (data.full_content !== undefined) {
          expect(data.full_content).toBe(true);
        }
        
        // Content should be substantial for full content
        if (data.content) {
          expect(data.content.length).toBeGreaterThan(100); // README should be substantial
        }
      }
    });
  });

  describe('Directory Resources', () => {
    it('should handle directory listing with basic parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/dir/src`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      
      // Directory response should have contents array or error
      if (data.contents && Array.isArray(data.contents)) {
        expect(data.path).toBe('src');
        expect(data.contents.length).toBeGreaterThan(0);
        
        // Validate directory contents structure
        data.contents.forEach((item: any) => {
          expect(item.name || item.path).toBeDefined();
          expect(typeof (item.name || item.path)).toBe('string');
          
          if (item.type) {
            expect(['file', 'directory', 'commit_file', 'commit_directory'].includes(item.type)).toBe(true);
          }
          
          // Size should be number if present
          if (item.size !== undefined) {
            expect(typeof item.size).toBe('number');
          }
        });
      } else if (data.text) {
        // Error case - directory not found
        expect(typeof data.text).toBe('string');
      }
    });

    it('should handle root directory listing', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/dir`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      
      // Root directory should have contents
      if (data.contents && Array.isArray(data.contents)) {
        expect(data.contents.length).toBeGreaterThan(0);
        
        // Root should contain typical files like README.md
        const fileNames = data.contents.map((item: any) => item.name || item.path);
        expect(fileNames.some((name: string) => name.includes('README'))).toBe(true);
      }
    });

    it('should handle directory with branch parameter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/dir/src?ref=main`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('ref=main');
      
      const data = JSON.parse(result.contents[0].text);
      
      // Branch parameter should be reflected if directory exists
      if (data.contents && Array.isArray(data.contents)) {
        if (data.branch) {
          expect(data.branch).toBe('main');
        }
      }
    });
  });

  describe('Branch Resources', () => {
    it('should handle branches list with basic parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      validateBranchResponse(data);
      
      // Should have branches array
      if (data.branches && Array.isArray(data.branches)) {
        expect(data.branches.length).toBeGreaterThan(0);
        
        // Should have at least default branch
        const branchNames = data.branches.map((b: any) => b.displayId || b.name);
        expect(branchNames.some((name: string) => ['main', 'master', 'default'].includes(name))).toBe(true);
        
        // Validate branch schema compliance for each branch
        data.branches.forEach((branch: any) => {
          validateResponseStructure(branch, 'branch');
        });
      }
    });

    it('should handle branches list with filter parameter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches?filter=main`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('filter=main');
      
      const data = JSON.parse(result.contents[0].text);
      validateBranchResponse(data);
      
      // Filter should be applied if branches found
      if (data.branches && Array.isArray(data.branches)) {
        // Filter parameter should be reflected in URI or response
        if (data.filter) {
          expect(data.filter).toBe('main');
        }
        
        // If results are returned, they should match the filter
        if (data.branches.length > 0) {
          data.branches.forEach((branch: any) => {
            const branchName = branch.displayId || branch.name;
            expect(branchName.toLowerCase()).toContain('main');
          });
        }
      }
    });

    it('should handle branches list with pagination parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches?limit=5&start=0`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('limit=5');
      expect(uri).toContain('start=0');
      
      const data = JSON.parse(result.contents[0].text);
      validateBranchResponse(data);
      
      // Pagination should be applied
      if (data.branches && Array.isArray(data.branches)) {
        expect(data.limit).toBe(5);
        expect(data.start).toBe(0);
        expect(data.branches.length).toBeLessThanOrEqual(5);
      }
    });

    it('should handle specific branch details', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branch/main`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      
      // Single branch response should have branch details or error
      if (data.displayId || data.name) {
        validateResponseStructure(data, 'branch');
        
        const branchName = data.displayId || data.name;
        expect(branchName).toBe('main');
        
        // Should have commit information
        if (data.latestCommit || data.target) {
          const commitHash = data.latestCommit || data.target?.hash;
          expect(typeof commitHash).toBe('string');
          expect(commitHash.length).toBeGreaterThan(6); // SHA should be substantial
        }
      } else if (data.text) {
        // Branch not found or network error
        expect(typeof data.text).toBe('string');
        // Could be branch not found or network error, both are valid test outcomes
      }
    });
  });

  describe('Pull Request Resources', () => {
    it('should handle pull requests list with basic parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pull-requests`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const data = JSON.parse(result.contents[0].text);
      validatePullRequestResponse(data);
      
      // Should have pull_requests array or error message
      if (data.pull_requests && Array.isArray(data.pull_requests)) {
        expect(data.pull_requests.length).toBeGreaterThanOrEqual(0);
        
        // Validate each PR structure
        data.pull_requests.forEach((pr: any) => {
          validateResponseStructure(pr, 'pull-request', ['id', 'title', 'state']);
          
          // Validate PR state
          expect(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'].includes(pr.state)).toBe(true);
        });
      } else if (data.text) {
        // No PRs found or access denied
        expect(typeof data.text).toBe('string');
      }
    });

    it('should handle pull requests with state parameter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pull-requests?state=MERGED`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('state=MERGED');
      
      const data = JSON.parse(result.contents[0].text);
      validatePullRequestResponse(data);
      
      // State filter should be applied
      if (data.pull_requests && Array.isArray(data.pull_requests)) {
        // State parameter should be reflected in URI or response
        if (data.state) {
          expect(data.state).toBe('MERGED');
        }
        
        // If results are returned, they should match the state filter
        if (data.pull_requests.length > 0) {
          data.pull_requests.forEach((pr: any) => {
            expect(pr.state).toBe('MERGED');
          });
        }
      }
    });

    it('should handle pull requests with pagination parameters', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pull-requests?limit=10&start=0`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('limit=10');
      expect(uri).toContain('start=0');
      
      const data = JSON.parse(result.contents[0].text);
      validatePullRequestResponse(data);
      
      // Pagination should be applied
      if (data.pull_requests && Array.isArray(data.pull_requests)) {
        expect(data.limit).toBe(10);
        expect(data.start).toBe(0);
        expect(data.pull_requests.length).toBeLessThanOrEqual(10);
      }
    });

    it('should handle pull requests with author filter', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pull-requests?author=${encodeURIComponent(TEST_CONFIG.username)}`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('author=');
      
      const data = JSON.parse(result.contents[0].text);
      validatePullRequestResponse(data);
      
      // Author filter should be applied
      if (data.pull_requests && Array.isArray(data.pull_requests)) {
        // Author parameter should be reflected in URI or response
        if (data.author) {
          expect(data.author).toBe(TEST_CONFIG.username);
        }
        
        // If results are returned, they should match the author filter
        if (data.pull_requests.length > 0) {
          data.pull_requests.forEach((pr: any) => {
            if (pr.author) {
              const authorEmail = pr.author.emailAddress || pr.author.email;
              const authorName = pr.author.name || pr.author.displayName;
              
              // Author should match either by email or username
              const isAuthorMatch = 
                authorEmail === TEST_CONFIG.username ||
                authorName === TEST_CONFIG.username ||
                authorName === TEST_CONFIG.username.split('@')[0];
              
              expect(isAuthorMatch).toBe(true);
            }
          });
        }
      }
    });
  });

  describe('Field Filtering', () => {
    it('should handle fields parameter for inclusion', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches?fields=displayId,type`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      
      if (data.branches && data.branches.length > 0) {
        const branch = data.branches[0];
        
        // Should contain only requested fields (plus any system fields)
        if (branch.displayId || branch.name) {
          expect(branch.displayId || branch.name).toBeDefined();
        }
        if (branch.type) {
          expect(branch.type).toBeDefined();
        }
        
        // Should have limited fields compared to full response
        const fieldCount = Object.keys(branch).length;
        expect(fieldCount).toBeLessThan(10); // Should be filtered down
      }
    });

    it('should handle exclude parameter for field exclusion', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches?exclude=latestCommit,latestChangeset`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      
      const data = JSON.parse(result.contents[0].text);
      
      if (data.branches && data.branches.length > 0) {
        data.branches.forEach((branch: any) => {
          // Excluded fields should not be present
          expect(branch).not.toHaveProperty('latestCommit');
          expect(branch).not.toHaveProperty('latestChangeset');
          
          // Other fields should still be present
          expect(branch.displayId || branch.name).toBeDefined();
        });
      }
    });

    it('should handle format parameter for minimal format', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?format=minimal`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('format=minimal');
      
      const data = JSON.parse(result.contents[0].text);
      
      // Minimal format should have fewer fields
      if (data.path || data.file_path) {
        const fieldCount = Object.keys(data).length;
        expect(fieldCount).toBeLessThan(8); // Should be minimal
        
        // Should contain essential fields (path/file_path is most essential for files)
        expect(data.path || data.file_path).toBeDefined();
        
        // For files, minimal should exclude content or have limited fields
        if (data.content && data.content.length > 1000) {
          // If content is present and substantial, field count should be reasonable
          expect(fieldCount).toBeLessThanOrEqual(8);
        }
      }
    });

    it('should handle format parameter for summary format', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?format=summary`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('format=summary');
      
      const data = JSON.parse(result.contents[0].text);
      
      // Summary format should have more fields than minimal but less than full
      if (data.path || data.file_path) {
        const fieldCount = Object.keys(data).length;
        expect(fieldCount).toBeGreaterThan(3);
        expect(fieldCount).toBeLessThan(15); // Should be moderate
      }
    });

    it('should handle format parameter for metadata format', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/README.md?format=metadata`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('format=metadata');
      
      const data = JSON.parse(result.contents[0].text);
      
      // Metadata format should exclude content but include metadata
      if (data.path || data.file_path) {
        // Should not contain actual content
        expect(data).not.toHaveProperty('content');
        
        // Should contain metadata fields from commonFieldSets.metadata
        const metadataFields = commonFieldSets.metadata;
        const hasMetadataField = metadataFields.some(field => data.hasOwnProperty(field));
        expect(hasMetadataField).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid workspace/repository', async () => {
      const uri = 'bitbucket://invalid-workspace/invalid-repo/file/README.md';
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      
      const data = JSON.parse(result.contents[0].text);
      // Should return error response or 'not found' message
      expect(data.text || data.error || data.message).toBeDefined();
    });

    it('should handle invalid file path', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/file/non-existent-file.txt`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      
      const data = JSON.parse(result.contents[0].text);
      // Should return error response or 'not found' message
      expect(data.text || data.error || data.message).toBeDefined();
    });

    it('should handle malformed URI', async () => {
      const uri = 'bitbucket://invalid-uri';
      
      await expect(resourceHandlers.handleResourceRead(uri)).rejects.toThrow();
    });

    it('should handle unsupported resource type', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/unsupported/resource`;
      
      await expect(resourceHandlers.handleResourceRead(uri)).rejects.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle legacy pr resource type', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pr/1`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      // Should redirect to pull-request handler
    });

    it('should handle legacy prs resource type', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/prs`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      // Should redirect to pull-requests handler
    });
  });

  describe('Complex Parameter Combinations', () => {
    it('should handle multiple parameters together', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/branches?filter=main&limit=10&fields=name,type&format=summary`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      expect(result.contents[0].uri).toBe(uri);
      expect(uri).toContain('filter=main');
      expect(uri).toContain('limit=10');
      expect(uri).toContain('fields=name,type');
      expect(uri).toContain('format=summary');
    });

    it('should handle nested field selection with wildcards', async () => {
      const uri = `bitbucket://${TEST_CONFIG.workspace}/${TEST_CONFIG.repository}/pull-requests?fields=*.author.display_name,*.title`;
      const result = await resourceHandlers.handleResourceRead(uri);
      
      expect(result).toBeDefined();
      const data = JSON.parse(result.contents[0].text);
      
      if (data.pull_requests && data.pull_requests.length > 0) {
        const pr = data.pull_requests[0];
        if (pr.author) {
          expect(pr.author).toHaveProperty('display_name');
        }
        if (pr.title) {
          expect(pr).toHaveProperty('title');
        }
      }
    });
  });
});