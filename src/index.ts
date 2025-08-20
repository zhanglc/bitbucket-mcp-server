#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import package.json version safely for ESM
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const version = pkg.version;

import { BitbucketApiClient } from './utils/api-client.js';
import { PullRequestHandlers } from './handlers/pull-request-handlers.js';
import { BranchHandlers } from './handlers/branch-handlers.js';
import { ReviewHandlers } from './handlers/review-handlers.js';
import { FileHandlers } from './handlers/file-handlers.js';
import { SearchHandlers } from './handlers/search-handlers.js';
import { toolDefinitions } from './tools/definitions.js';
import { resourceTemplates } from './resources/templates.js';
import { staticResources } from './resources/static-resources.js';
import { ResourceHandlers } from './resources/handlers.js';
import { getResourceTypeIndex } from './resources/field-schemas.js';

// Get environment variables
const BITBUCKET_USERNAME = process.env.BITBUCKET_USERNAME;
const BITBUCKET_APP_PASSWORD = process.env.BITBUCKET_APP_PASSWORD;
const BITBUCKET_TOKEN = process.env.BITBUCKET_TOKEN; // For Bitbucket Server
const BITBUCKET_BASE_URL = process.env.BITBUCKET_BASE_URL || 'https://api.bitbucket.org/2.0';

// Check for either app password (Cloud) or token (Server)
if (!BITBUCKET_USERNAME || (!BITBUCKET_APP_PASSWORD && !BITBUCKET_TOKEN)) {
  console.error('Error: BITBUCKET_USERNAME and either BITBUCKET_APP_PASSWORD (for Cloud) or BITBUCKET_TOKEN (for Server) are required');
  console.error('Please set these in your MCP settings configuration');
  process.exit(1);
}

export class BitbucketMCPServer {
  private server: Server;
  private apiClient: BitbucketApiClient;
  private pullRequestHandlers: PullRequestHandlers;
  private branchHandlers: BranchHandlers;
  private reviewHandlers: ReviewHandlers;
  private fileHandlers: FileHandlers;
  private searchHandlers: SearchHandlers;
  private resourceHandlers: ResourceHandlers;

  constructor() {
    this.server = new Server(
      {
        name: 'bitbucket-mcp-server',
        version: version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize API client
    this.apiClient = new BitbucketApiClient(
      BITBUCKET_BASE_URL,
      BITBUCKET_USERNAME!,
      BITBUCKET_APP_PASSWORD,
      BITBUCKET_TOKEN
    );

    // Initialize handlers
    this.pullRequestHandlers = new PullRequestHandlers(
      this.apiClient,
      BITBUCKET_BASE_URL,
      BITBUCKET_USERNAME!
    );
    this.branchHandlers = new BranchHandlers(this.apiClient, BITBUCKET_BASE_URL);
    this.reviewHandlers = new ReviewHandlers(this.apiClient, BITBUCKET_USERNAME!);
    this.fileHandlers = new FileHandlers(this.apiClient, BITBUCKET_BASE_URL);
    this.searchHandlers = new SearchHandlers(this.apiClient, BITBUCKET_BASE_URL);

    // Initialize resource handlers
    this.resourceHandlers = new ResourceHandlers(
      this.apiClient,
      this.pullRequestHandlers,
      this.branchHandlers,
      this.fileHandlers,
      this.searchHandlers,
      this.reviewHandlers
    );

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefinitions,
    }));

    // List available static resources (MCP compliant)
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: staticResources
      };
    });

    // List available resource templates
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      return {
        resourceTemplates: resourceTemplates,
      };
    });

    // Handle resource reads (Stage 2 implementation)
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        // Special handling for static schema index resource
        if (request.params.uri === 'bitbucket://schema/index') {
          // Static content - no query parameters supported
          const index = getResourceTypeIndex();
          
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  schemaVersion: version,
                  totalTypes: index.length,
                  resourceTypes: index,
                  note: 'This index contains static field schemas. For dynamic resource access patterns, use the resource templates via ListResourceTemplates.',
                  usage: {
                    fieldFiltering: "Add ?fields=field1,field2 to limit response fields",
                    formatOptions: "Add ?format=minimal|summary|metadata for different detail levels",
                    resourceTemplates: "Use ListResourceTemplates to discover dynamic resource patterns"
                  },
                  lastUpdated: new Date().toISOString()
                }, null, 2),
              },
            ],
          };
        }
        
        const result = await this.resourceHandlers.handleResourceRead(request.params.uri);
        return this.convertToolResponseToResource(request.params.uri, result);
      } catch (error) {

        // Fallback to placeholder for unimplemented resources
        const uri = request.params.uri;
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                error: 'Resource retrieval failed',
                uri,
                message: error instanceof Error ? error.message : 'Unknown error',
                note: 'This resource may not be fully implemented yet'
              }, null, 2),
            },
          ],
        };
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        // Pull Request tools
        case 'get_pull_request':
          return this.pullRequestHandlers.handleGetPullRequest(request.params.arguments);
        case 'list_pull_requests':
          return this.pullRequestHandlers.handleListPullRequests(request.params.arguments);
        case 'create_pull_request':
          return this.pullRequestHandlers.handleCreatePullRequest(request.params.arguments);
        case 'update_pull_request':
          return this.pullRequestHandlers.handleUpdatePullRequest(request.params.arguments);
        case 'add_comment':
          return this.pullRequestHandlers.handleAddComment(request.params.arguments);
        case 'merge_pull_request':
          return this.pullRequestHandlers.handleMergePullRequest(request.params.arguments);
        case 'list_pr_commits':
          return this.pullRequestHandlers.handleListPrCommits(request.params.arguments);
        
        // Branch tools
        case 'list_branches':
          return this.branchHandlers.handleListBranches(request.params.arguments);
        case 'delete_branch':
          return this.branchHandlers.handleDeleteBranch(request.params.arguments);
        case 'get_branch':
          return this.branchHandlers.handleGetBranch(request.params.arguments);
        case 'list_branch_commits':
          return this.branchHandlers.handleListBranchCommits(request.params.arguments);
        
        // Code Review tools
        case 'get_pull_request_diff':
          return this.reviewHandlers.handleGetPullRequestDiff(request.params.arguments);
        case 'approve_pull_request':
          return this.reviewHandlers.handleApprovePullRequest(request.params.arguments);
        case 'unapprove_pull_request':
          return this.reviewHandlers.handleUnapprovePullRequest(request.params.arguments);
        case 'request_changes':
          return this.reviewHandlers.handleRequestChanges(request.params.arguments);
        case 'remove_requested_changes':
          return this.reviewHandlers.handleRemoveRequestedChanges(request.params.arguments);
        
        // File tools
        case 'list_directory_content':
          return this.fileHandlers.handleListDirectoryContent(request.params.arguments);
        case 'get_file_content':
          return this.fileHandlers.handleGetFileContent(request.params.arguments);
        
        // Search tools
        case 'search_code':
          return this.searchHandlers.handleSearchCode(request.params.arguments);
        
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }


  /**
   * Convert tool response to resource response format
   */
  private convertToolResponseToResource(uri: string, toolResponse: any): any {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: Array.isArray(toolResponse.content) 
            ? toolResponse.content[0].text 
            : JSON.stringify(toolResponse, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Bitbucket MCP server running on stdio (${this.apiClient.getIsServer() ? 'Server' : 'Cloud'} mode)`);
  }
}

const server = new BitbucketMCPServer();
server.run().catch(console.error);
