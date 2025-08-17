// Stage 1 resource templates scaffold
// Future stages will implement dynamic resolution & data retrieval.

import { ResourceTemplate } from '@modelcontextprotocol/sdk/types.js';

// Resource URI design (scaffold):
// - bitbucket://{workspace}/{repo}/file/{path}
// - bitbucket://{workspace}/{repo}/dir/{path?}
// - bitbucket://{workspace}/{repo}/pr/{id}
// - bitbucket://{workspace}/{repo}/pr/{id}/diff{/{filePath?}}
// - bitbucket://{workspace}/{repo}/pr/{id}/commits
// - bitbucket://{workspace}/{repo}/branch/{name}
// - bitbucket://{workspace}/{repo}/branches
// Only templates are declared now; ReadResource returns placeholder until Stage 2.

export const resourceTemplates: ResourceTemplate[] = [
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/file/{path}',
    name: 'repository_file',
    description: 'Single file content from a repository with optional field filtering and content slicing',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        path: { type: 'string', description: 'File path relative to repo root' },
        ref: { type: 'string', description: 'Branch or commit (optional, defaults to main/master)' },
        start_line: { type: 'number', description: 'Starting line number for partial content (optional)' },
        line_count: { type: 'number', description: 'Number of lines to retrieve (optional)' },
        full_content: { type: 'boolean', description: 'Force retrieval of large files (optional)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "path,size,content") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'path'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/dir/{path?}',
    name: 'repository_directory',
    description: 'Directory listing with optional path and field filtering support',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        path: { type: 'string', description: 'Directory path or omitted for root' },
        ref: { type: 'string', description: 'Branch or commit (optional, defaults to main/master)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "path,size,type") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/pr/{id}',
    name: 'pull_request',
    description: 'Pull request metadata and detailed information with field filtering support',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        id: { type: 'string', description: 'Pull request ID' },
        include_comments: { type: 'boolean', description: 'Include PR comments in response (optional)' },
        include_commits: { type: 'boolean', description: 'Include commit list in response (optional)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "id,title,state,author") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'id'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/pr/{id}/diff',
    name: 'pull_request_diff',
    description: 'Full pull request diff with filtering and formatting options',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        id: { type: 'string', description: 'Pull request ID' },
        context: { type: 'number', description: 'Context lines (default 3)' },
        include: { type: 'string', description: 'Comma-separated glob patterns to include (future)' },
        exclude: { type: 'string', description: 'Comma-separated glob patterns to exclude (future)' },
        mode: { type: 'string', enum: ['structured', 'patch', 'raw'], description: 'Diff output format' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "files,stats,changes") (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'id'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/pr/{id}/diff/{filePath}',
    name: 'pull_request_diff_file',
    description: 'Single file diff within a pull request with enhanced formatting and field filtering',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        id: { type: 'string', description: 'Pull request ID' },
        filePath: { type: 'string', description: 'Exact file path in diff' },
        context: { type: 'number', description: 'Number of context lines around changes' },
        mode: { type: 'string', enum: ['structured', 'patch', 'raw'], description: 'Diff output format' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "path,changes,stats") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'id', 'filePath'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/pr/{id}/commits',
    name: 'pull_request_commits',
    description: 'Commits that belong to a pull request with metadata, changes and field filtering',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        id: { type: 'string', description: 'Pull request ID' },
        start: { type: 'number', description: 'Pagination start offset (optional)' },
        limit: { type: 'number', description: 'Maximum number of commits to return (optional)' },
        include_changes: { type: 'boolean', description: 'Include file changes for each commit (optional)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "hash,message,author") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'id'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/branches',
    name: 'repository_branches',
    description: 'List all branches in the repository with metadata and field filtering',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        filter: { type: 'string', description: 'Filter branches by name pattern (optional)' },
        limit: { type: 'number', description: 'Maximum number of branches to return (optional)' },
        start: { type: 'number', description: 'Pagination start offset (optional)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "name,target,heads") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/branch/{name}',
    name: 'repository_branch',
    description: 'Detailed information about a specific branch with field filtering support',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        name: { type: 'string', description: 'Branch name' },
        include_commits: { type: 'boolean', description: 'Include recent commits (optional)' },
        commit_limit: { type: 'number', description: 'Limit for recent commits (optional, default 10)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "name,target,commits") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'name'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/search',
    name: 'repository_search',
    description: 'Search code within the repository with field filtering support',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        query: { type: 'string', description: 'Search query string' },
        file_extensions: { type: 'string', description: 'Comma-separated file extensions to search (optional)' },
        include_paths: { type: 'string', description: 'Comma-separated path patterns to include (optional)' },
        exclude_paths: { type: 'string', description: 'Comma-separated path patterns to exclude (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (optional, default 25)' },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "path,line,content") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo', 'query'],
    },
  },
  {
    uriTemplate: 'bitbucket://{workspace}/{repo}/prs',
    name: 'pull_requests_list',
    description: 'List pull requests with filtering, pagination and field filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        workspace: { type: 'string', description: 'Project/workspace key' },
        repo: { type: 'string', description: 'Repository slug' },
        state: { 
          type: 'string', 
          enum: ['OPEN', 'MERGED', 'DECLINED', 'ALL'],
          description: 'Filter by PR state (optional, default: OPEN)' 
        },
        author: { 
          type: 'string', 
          description: 'Filter by author username/email (optional)' 
        },
        reviewer: { 
          type: 'string', 
          description: 'Filter by reviewer username/email (optional)' 
        },
        limit: { 
          type: 'number', 
          description: 'Maximum number of PRs to return (optional, default 25)' 
        },
        start: { 
          type: 'number', 
          description: 'Start index for pagination (optional, default 0)' 
        },
        sort: {
          type: 'string',
          enum: ['updated', 'created', 'activity'],
          description: 'Sort order for results (optional, default: updated)'
        },
        fields: { type: 'string', description: 'Comma-separated list of fields to include (e.g., "id,title,state,author") (optional)' },
        exclude: { type: 'string', description: 'Comma-separated list of fields to exclude (optional)' },
        format: { type: 'string', enum: ['full', 'minimal', 'summary', 'metadata'], description: 'Response format (optional, default: full)' },
      },
      required: ['workspace', 'repo'],
    },
  },
  {
    uriTemplate: 'bitbucket://schema/{resource_type}',
    name: 'resource_schema',
    description: 'Get complete field schema for a specific Bitbucket resource type. Returns detailed information about all fields including types, descriptions, examples, and validation rules. Use this after discovering resource types from the index to understand how to work with specific resources and build intelligent field selectors.',
    inputSchema: {
      type: 'object',
      properties: {
        resource_type: {
          type: 'string',
          description: 'Bitbucket resource type (e.g., repository, pullrequest, commit, branch, etc.)'
        },
        fields: {
          type: 'string',
          description: 'Comma-separated list of schema aspects to include (optional): "fields", "metadata", "examples", "validation"'
        },
        field_details: {
          type: 'string',
          enum: ['minimal', 'full'],
          description: 'Level of field detail (optional, default: full)'
        },
        filter_by: {
          type: 'string',
          enum: ['required', 'optional', 'readonly', 'nested'],
          description: 'Filter fields by properties (optional)'
        }
      },
      required: ['resource_type']
    }
  },
  {
    uriTemplate: 'bitbucket://schema/{resource_type}/field/{field_name}',
    name: 'field_schema',
    description: 'Get detailed schema information for a specific field of a resource type',
    inputSchema: {
      type: 'object',
      properties: {
        resource_type: {
          type: 'string',
          description: 'Bitbucket resource type (e.g., repository, pullrequest, commit)'
        },
        field_name: {
          type: 'string',
          description: 'Field name to get schema for'
        },
        include_nested: {
          type: 'boolean',
          description: 'Include nested field schemas if applicable (optional, default: false)'
        }
      },
      required: ['resource_type', 'field_name']
    }
  },
  {
    uriTemplate: 'bitbucket://schema/validation/{resource_type}',
    name: 'resource_validation',
    description: 'Get validation rules and constraints for a specific resource type',
    inputSchema: {
      type: 'object',
      properties: {
        resource_type: {
          type: 'string',
          description: 'Bitbucket resource type to get validation rules for'
        },
        operation: {
          type: 'string',
          enum: ['create', 'update', 'read'],
          description: 'Operation context for validation (optional, default: read)'
        }
      },
      required: ['resource_type']
    }
  },
];

export default resourceTemplates;
