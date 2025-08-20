import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { BitbucketApiClient } from '../utils/api-client.js';
import { BitbucketURI } from '../utils/bitbucket-uri.js';
import { PullRequestHandlers } from '../handlers/pull-request-handlers.js';
import { BranchHandlers } from '../handlers/branch-handlers.js';
import { FileHandlers } from '../handlers/file-handlers.js';
import { SearchHandlers } from '../handlers/search-handlers.js';
import { ReviewHandlers } from '../handlers/review-handlers.js';
import { SchemaHandlers } from './schema-handlers.js';

export class ResourceHandlers {
  private schemaHandlers: SchemaHandlers;

  constructor(
    private apiClient: BitbucketApiClient,
    private pullRequestHandlers: PullRequestHandlers,
    private branchHandlers: BranchHandlers,
    private fileHandlers: FileHandlers,
    private searchHandlers: SearchHandlers,
    private reviewHandlers: ReviewHandlers
  ) {
    this.schemaHandlers = new SchemaHandlers();
  }

  /**
   * Parse a Bitbucket resource URI and extract components
   */
  private parseResourceUri(uri: string): BitbucketURI {
    return new BitbucketURI(uri);
  }

  /**
   * Handle resource read requests by delegating to appropriate handlers
   */
  async handleResourceRead(uri: string): Promise<any> {
    console.error(`[ResourceHandlers] Starting resource read for URI: ${uri}`);
    
    try {
      const parsed = this.parseResourceUri(uri);
      const { workspace, repo, resourceType, resourcePath, params } = parsed;
      
      console.error(`[ResourceHandlers] Parsed URI:`, {
        workspace,
        repo,
        resourceType,
        resourcePath,
        params: Object.keys(params).length > 0 ? params : 'none'
      });

      switch (resourceType) {
        case 'schema':
          // Handle schema resources: bitbucket://schema/...
          console.error(`[ResourceHandlers] Handling schema resource: ${resourcePath || 'index'}`);
          const schemaResult = await this.schemaHandlers.handleSchemaResource(uri);
          console.error(`[ResourceHandlers] Schema resource processed successfully`);
          // Schema handlers already return the correct resource format, just wrap it
          return {
            contents: [schemaResult]
          };

        case 'file':
          if (!resourcePath) {
            throw new McpError(ErrorCode.InvalidParams, 'File path is required');
          }
          if (!workspace || !repo) {
            throw new McpError(ErrorCode.InvalidParams, 'Workspace and repository are required for file resources');
          }
          console.error(`[ResourceHandlers] Handling file resource: ${workspace}/${repo}/${resourcePath}`);
          const fileResult = await this.fileHandlers.handleGetFileContent({
            workspace,
            repository: repo,
            file_path: resourcePath,
            branch: params.ref,
            start_line: params.start_line ? parseInt(params.start_line) : undefined,
            line_count: params.line_count ? parseInt(params.line_count) : undefined,
            full_content: params.full_content === 'true'
          });
          console.error(`[ResourceHandlers] File resource processed successfully`);
          return this.convertToolResponseToResource(uri, fileResult);

        case 'dir':
          if (!workspace || !repo) {
            throw new McpError(ErrorCode.InvalidParams, 'Workspace and repository are required for directory resources');
          }
          console.error(`[ResourceHandlers] Handling directory resource: ${workspace}/${repo}/${resourcePath || 'root'}`);
          const dirResult = await this.fileHandlers.handleListDirectoryContent({
            workspace,
            repository: repo,
            path: resourcePath,
            branch: params.ref
          });
          console.error(`[ResourceHandlers] Directory resource processed successfully`);
          return this.convertToolResponseToResource(uri, dirResult);

        case 'pull-request':
          if (!resourcePath) {
            throw new McpError(ErrorCode.InvalidParams, 'PR ID is required');
          }
          
          // Parse hierarchical resource path: {id}/diff, {id}/commits, {id}/diff/{filePath}, or just {id}
          const pathParts = resourcePath.split('/');
          const prId = pathParts[0];
          const subResource = pathParts[1];
          const filePath = pathParts.slice(2).join('/');
          
          if (!prId || !/^\d+$/.test(prId)) {
            throw new McpError(ErrorCode.InvalidParams, 'Valid PR ID is required');
          }
          
          if (subResource === 'diff') {
            if (filePath) {
              // Single file diff: bitbucket://workspace/repo/pull-request/123/diff/path/to/file
              console.error(`[ResourceHandlers] Handling PR file diff resource: ${workspace}/${repo}/pull-request/${prId}/diff/${filePath}`);
              const fileDiffResult = await this.reviewHandlers.handleGetPullRequestDiff({
                workspace,
                repository: repo,
                pull_request_id: parseInt(prId),
                file_path: filePath,
                context: params.context ? parseInt(params.context) : undefined,
                mode: params.mode
              });
              console.error(`[ResourceHandlers] PR file diff resource processed successfully`);
              return this.convertToolResponseToResource(uri, fileDiffResult);
            } else {
              // Full PR diff: bitbucket://workspace/repo/pull-request/123/diff
              console.error(`[ResourceHandlers] Handling PR diff resource: ${workspace}/${repo}/pull-request/${prId}/diff`);
              const diffResult = await this.reviewHandlers.handleGetPullRequestDiff({
                workspace,
                repository: repo,
                pull_request_id: parseInt(prId),
                context: params.context ? parseInt(params.context) : undefined,
                include_patterns: params.include,
                exclude_patterns: params.exclude,
                mode: params.mode
              });
              console.error(`[ResourceHandlers] PR diff resource processed successfully`);
              return this.convertToolResponseToResource(uri, diffResult);
            }
          } else if (subResource === 'commits') {
            // PR commits: bitbucket://workspace/repo/pull-request/123/commits
            console.error(`[ResourceHandlers] Handling PR commits resource: ${workspace}/${repo}/pull-request/${prId}/commits`);
            const commitsResult = await this.pullRequestHandlers.handleListPrCommits({
              workspace,
              repository: repo,
              pull_request_id: parseInt(prId),
              start: params.start ? parseInt(params.start) : undefined,
              limit: params.limit ? parseInt(params.limit) : undefined
            });
            console.error(`[ResourceHandlers] PR commits resource processed successfully`);
            return this.convertToolResponseToResource(uri, commitsResult);
          } else if (subResource) {
            // Unknown sub-resource
            throw new McpError(ErrorCode.InvalidParams, `Unknown pull request sub-resource: ${subResource}`);
          } else {
            // PR details: bitbucket://workspace/repo/pull-request/123
            console.error(`[ResourceHandlers] Handling PR details resource: ${workspace}/${repo}/pull-request/${prId}`);
            const prResult = await this.pullRequestHandlers.handleGetPullRequest({
              workspace,
              repository: repo,
              pull_request_id: parseInt(prId)
            });
            console.error(`[ResourceHandlers] PR details resource processed successfully`);
            return this.convertToolResponseToResource(uri, prResult);
          }

        case 'branches':
          console.error(`[ResourceHandlers] Handling branches list resource: ${workspace}/${repo}/branches`);
          const branchesResult = await this.branchHandlers.handleListBranches({
            workspace,
            repository: repo,
            filter: params.filter,
            limit: params.limit ? parseInt(params.limit) : undefined,
            start: params.start ? parseInt(params.start) : undefined
          });
          console.error(`[ResourceHandlers] Branches list resource processed successfully`);
          return this.convertToolResponseToResource(uri, branchesResult);

        case 'branch':
          if (!resourcePath) {
            throw new McpError(ErrorCode.InvalidParams, 'Branch name is required');
          }
          console.error(`[ResourceHandlers] Handling branch details resource: ${workspace}/${repo}/branch/${resourcePath}`);
          const branchResult = await this.branchHandlers.handleGetBranch({
            workspace,
            repository: repo,
            branch_name: resourcePath
          });
          console.error(`[ResourceHandlers] Branch details resource processed successfully`);
          return this.convertToolResponseToResource(uri, branchResult);

        case 'search':
          if (!params.query) {
            throw new McpError(ErrorCode.InvalidParams, 'Search query is required');
          }
          console.error(`[ResourceHandlers] Handling search resource: ${workspace}/${repo}/search?query=${params.query}`);
          const searchResult = await this.searchHandlers.handleSearchCode({
            workspace,
            repository: repo,
            search_query: params.query,
            file_extensions: params.file_extensions,
            include_paths: params.include_paths,
            exclude_paths: params.exclude_paths,
            limit: params.limit ? parseInt(params.limit) : undefined
          });
          console.error(`[ResourceHandlers] Search resource processed successfully`);
          return this.convertToolResponseToResource(uri, searchResult);

        case 'pull-requests':
          console.error(`[ResourceHandlers] Handling PRs list resource: ${workspace}/${repo}/pull-requests with state=${params.state || 'OPEN'}`);
          const prsResult = await this.pullRequestHandlers.handleListPullRequests({
            workspace,
            repository: repo,
            state: params.state || 'OPEN',
            author: params.author,
            reviewer: params.reviewer,
            limit: params.limit ? parseInt(params.limit) : 25,
            start: params.start ? parseInt(params.start) : 0
          });
          console.error(`[ResourceHandlers] PRs list resource processed successfully`);
          return this.convertToolResponseToResource(uri, prsResult);

        // Backward compatibility cases
        case 'pr':
          // Redirect to pull-request handler for backward compatibility
          console.error(`[ResourceHandlers] Redirecting legacy 'pr' to 'pull-request' handler`);
          return this.handleResourceRead(uri.replace('/pr/', '/pull-request/'));

        case 'prs':
          // Redirect to pull-requests handler for backward compatibility
          console.error(`[ResourceHandlers] Redirecting legacy 'prs' to 'pull-requests' handler`);
          return this.handleResourceRead(uri.replace('/prs', '/pull-requests'));

        default:
          console.error(`[ResourceHandlers] Unknown resource type: ${resourceType}`);
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unknown resource type: ${resourceType}`
          );
      }
    } catch (error) {
      console.error(`[ResourceHandlers] Error processing resource URI: ${uri}`, error);
      
      if (error instanceof McpError) {
        console.error(`[ResourceHandlers] MCP Error - Code: ${error.code}, Message: ${error.message}`);
        throw error;
      }
      
      console.error(`[ResourceHandlers] Unexpected error:`, error instanceof Error ? error.message : error);
      
      // Convert API errors to MCP errors
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              error: 'Resource retrieval failed',
              message: error instanceof Error ? error.message : 'Unknown error',
              uri
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Convert tool response to resource response format with field filtering support
   */
  private convertToolResponseToResource(uri: string, toolResponse: any): any {
    let responseData: any;
    
    // Extract the actual data from tool response
    if (Array.isArray(toolResponse.content)) {
      try {
        responseData = JSON.parse(toolResponse.content[0].text);
      } catch {
        responseData = { text: toolResponse.content[0].text };
      }
    } else {
      responseData = toolResponse;
    }

    // Apply field filtering based on URI parameters
    const parsed = new URL(uri);
    const fields = parsed.searchParams.get('fields');
    const exclude = parsed.searchParams.get('exclude');
    const format = parsed.searchParams.get('format') || 'full';

    if (fields || exclude || format !== 'full') {
      responseData = this.applyFieldFiltering(responseData, {
        fields: fields?.split(',').map(f => f.trim()),
        exclude: exclude?.split(',').map(f => f.trim()),
        format
      });
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  }

  /**
   * Apply field filtering to response data
   */
  private applyFieldFiltering(data: any, options: {
    fields?: string[];
    exclude?: string[];
    format?: string;
  }): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    let result: any;

    // Handle different format options
    switch (options.format) {
      case 'minimal':
        result = this.extractMinimalFields(data);
        break;
      case 'summary':
        result = this.extractSummaryFields(data);
        break;
      case 'metadata':
        result = this.extractMetadataFields(data);
        break;
      default:
        result = { ...data };
    }

    // Apply explicit field inclusion
    if (options.fields && options.fields.length > 0) {
      result = this.includeOnlyFields(result, options.fields);
    }

    // Apply field exclusion
    if (options.exclude && options.exclude.length > 0) {
      result = this.excludeFields(result, options.exclude);
    }

    return result;
  }

  /**
   * Extract only specified fields using dot notation
   */
  private includeOnlyFields(data: any, fields: string[]): any {
    const result: any = {};
    
    for (const field of fields) {
      if (field.includes('*')) {
        // Handle wildcard fields
        const parts = field.split('.');
        const wildcardIndex = parts.indexOf('*');
        const beforeWildcard = parts.slice(0, wildcardIndex);
        const afterWildcard = parts.slice(wildcardIndex + 1);
        
        // Navigate to the array containing the wildcard
        let current = data;
        for (const part of beforeWildcard) {
          if (current && typeof current === 'object') {
            current = current[part];
          }
        }
        
        if (Array.isArray(current)) {
          // Create result array structure
          const resultArray = current.map(item => {
            if (afterWildcard.length > 0) {
              // Extract nested field from each array item
              let nestedValue = item;
              for (const part of afterWildcard) {
                if (nestedValue && typeof nestedValue === 'object') {
                  nestedValue = nestedValue[part];
                }
              }
              
              if (nestedValue !== undefined) {
                const itemResult: any = {};
                let buildPath = itemResult;
                for (let i = 0; i < afterWildcard.length - 1; i++) {
                  buildPath[afterWildcard[i]] = {};
                  buildPath = buildPath[afterWildcard[i]];
                }
                buildPath[afterWildcard[afterWildcard.length - 1]] = nestedValue;
                return itemResult;
              }
              return undefined;
            }
            return item;
          }).filter(item => item !== undefined);
          
          // Set result in the correct nested structure
          let buildResult = result;
          for (let i = 0; i < beforeWildcard.length - 1; i++) {
            if (!buildResult[beforeWildcard[i]]) {
              buildResult[beforeWildcard[i]] = {};
            }
            buildResult = buildResult[beforeWildcard[i]];
          }
          if (beforeWildcard.length > 0) {
            buildResult[beforeWildcard[beforeWildcard.length - 1]] = resultArray;
          } else {
            return resultArray; // Root level wildcard
          }
        }
      } else {
        // Handle regular fields
        const value = this.getNestedField(data, field);
        if (value !== undefined) {
          this.setNestedField(result, field, value);
        }
      }
    }
    
    return result;
  }

  /**
   * Exclude specified fields using dot notation
   */
  private excludeFields(data: any, fields: string[]): any {
    const result = JSON.parse(JSON.stringify(data)); // Deep clone
    
    for (const field of fields) {
      this.deleteNestedField(result, field);
    }
    
    return result;
  }

  /**
   * Get nested field value using dot notation (e.g., "user.name", "files.0.path", "reviewers.*.display_name")
   */
  private getNestedField(obj: any, path: string): any {
    if (obj === null || obj === undefined) return undefined;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      
      if (current === null || current === undefined) return undefined;
      
      // Handle wildcard for arrays
      if (key === '*' && Array.isArray(current)) {
        const remainingPath = keys.slice(i + 1).join('.');
        if (remainingPath) {
          return current.map(item => this.getNestedField(item, remainingPath));
        }
        return current;
      }
      
      // Handle array indices
      if (Array.isArray(current) && /^\d+$/.test(key)) {
        current = current[parseInt(key)];
      } else {
        current = current[key];
      }
    }
    
    return current;
  }

  /**
   * Set nested field value using dot notation
   */
  private setNestedField(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      
      if (!(key in current)) {
        // Determine if next level should be array or object
        if (nextKey && /^\d+$/.test(nextKey)) {
          current[key] = [];
        } else {
          current[key] = {};
        }
      }
      current = current[key];
    }
    
    // Handle array index assignment
    if (Array.isArray(current) && /^\d+$/.test(lastKey)) {
      const index = parseInt(lastKey);
      current[index] = value;
    } else {
      current[lastKey] = value;
    }
  }

  /**
   * Delete nested field using dot notation
   */
  private deleteNestedField(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!current || !(key in current)) return;
      current = current[key];
    }
    
    if (current && typeof current === 'object') {
      delete current[lastKey];
    }
  }

  /**
   * Extract minimal fields for different resource types
   */
  private extractMinimalFields(data: any): any {
    // Common minimal fields across all resource types
    const commonFields = ['id', 'name', 'title', 'state', 'status'];
    
    if (data.pull_request_id || (data.id && data.source && data.destination)) {
      // Pull request minimal fields
      return this.includeOnlyFields(data, [
        'pull_request_id', 'id', 'title', 'state', 'author.display_name', 'created_on', 'updated_on'
      ]);
    }
    
    if (data.path !== undefined || data.contents) {
      // File/directory minimal fields
      return this.includeOnlyFields(data, [
        'path', 'name', 'type', 'size', 'total_items'
      ]);
    }
    
    if (data.name && (data.target || data.heads)) {
      // Branch minimal fields
      return this.includeOnlyFields(data, [
        'name', 'target.hash', 'type', 'heads'
      ]);
    }
    
    if (data.hash || data.message) {
      // Commit minimal fields
      return this.includeOnlyFields(data, [
        'hash', 'message', 'author.display_name', 'date'
      ]);
    }
    
    if (Array.isArray(data) && data.length > 0) {
      // Array of items - apply minimal to each
      return data.map(item => this.extractMinimalFields(item));
    }
    
    // Default minimal extraction for unknown types
    const result: any = {};
    for (const field of commonFields) {
      if (data[field] !== undefined) {
        result[field] = data[field];
      }
    }
    return Object.keys(result).length > 0 ? result : data;
  }

  /**
   * Extract summary fields for different resource types
   */
  private extractSummaryFields(data: any): any {
    if (data.pull_request_id || (data.id && data.source && data.destination)) {
      // Pull request summary
      return this.includeOnlyFields(data, [
        'pull_request_id', 'id', 'title', 'description', 'state', 'author', 
        'reviewers', 'created_on', 'updated_on', 'source.branch.name', 'destination.branch.name'
      ]);
    }
    
    if (data.path !== undefined || data.contents) {
      // File/directory summary
      return this.includeOnlyFields(data, [
        'path', 'branch', 'contents', 'total_items', 'size', 'mimeType'
      ]);
    }
    
    if (data.name && (data.target || data.heads)) {
      // Branch summary
      return this.includeOnlyFields(data, [
        'name', 'target', 'heads', 'type'
      ]);
    }
    
    if (data.hash || data.message) {
      // Commit summary
      return this.includeOnlyFields(data, [
        'hash', 'message', 'author', 'date', 'parents'
      ]);
    }
    
    if (data.files && Array.isArray(data.files)) {
      // Diff summary
      return this.includeOnlyFields(data, [
        'files', 'stats', 'description'
      ]);
    }
    
    if (Array.isArray(data) && data.length > 0) {
      // Array of items - apply summary to each
      return data.map(item => this.extractSummaryFields(item));
    }
    
    return data;
  }

  /**
   * Extract metadata fields only
   */
  private extractMetadataFields(data: any): any {
    const metadataFields = [
      'id', 'name', 'title', 'description', 'state', 'status', 'type',
      'created_on', 'updated_on', 'author.display_name', 'author.uuid', 
      'size', 'mimeType', 'branch', 'hash', 'pull_request_id'
    ];
    
    if (Array.isArray(data) && data.length > 0) {
      // Array of items - apply metadata to each
      return data.map(item => this.extractMetadataFields(item));
    }
    
    return this.includeOnlyFields(data, metadataFields);
  }
}
