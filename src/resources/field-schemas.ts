/**
 * Static field schemas and metadata for Bitbucket Cloud REST API resources
 * Based on official Bitbucket Cloud REST API documentation
 */

export interface FieldMetadata {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  readonly?: boolean;
  example?: any;
  nested?: boolean;
}

export interface ResourceSchema {
  type: string;
  description: string;
  fields: FieldMetadata[];
}

/**
 * Repository resource field schema
 */
export const repositorySchema: ResourceSchema = {
  type: 'repository',
  description: 'Bitbucket repository object with complete metadata',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "repository"',
      required: true,
      readonly: true,
      example: 'repository'
    },
    {
      name: 'uuid',
      type: 'string',
      description: 'Unique repository identifier in UUID format with braces',
      required: true,
      readonly: true,
      example: '{b4434b4d-6a0e-4f57-8d75-e02a824abeb0}'
    },
    {
      name: 'name',
      type: 'string',
      description: 'Repository display name',
      required: true,
      example: 'My Repository'
    },
    {
      name: 'slug',
      type: 'string',
      description: 'URL-safe repository identifier',
      required: true,
      example: 'my-repository'
    },
    {
      name: 'full_name',
      type: 'string',
      description: 'Full repository name in format "workspace/repo_slug"',
      required: true,
      readonly: true,
      example: 'teamsinspace/documentation-tests'
    },
    {
      name: 'description',
      type: 'string',
      description: 'Repository description text',
      example: 'This is a sample repository'
    },
    {
      name: 'scm',
      type: 'string',
      description: 'Source control management type (git, hg)',
      required: true,
      readonly: true,
      example: 'git'
    },
    {
      name: 'is_private',
      type: 'boolean',
      description: 'Whether the repository is private',
      required: true,
      example: false
    },
    {
      name: 'size',
      type: 'number',
      description: 'Repository size in bytes',
      readonly: true,
      example: 1172663
    },
    {
      name: 'language',
      type: 'string',
      description: 'Primary programming language detected',
      readonly: true,
      example: 'JavaScript'
    },
    {
      name: 'has_issues',
      type: 'boolean',
      description: 'Whether issue tracker is enabled',
      example: true
    },
    {
      name: 'has_wiki',
      type: 'boolean',
      description: 'Whether wiki is enabled',
      example: true
    },
    {
      name: 'fork_policy',
      type: 'string',
      description: 'Fork permission policy (allow_forks, no_public_forks, no_forks)',
      example: 'allow_forks'
    },
    {
      name: 'website',
      type: 'string',
      description: 'Repository website URL',
      example: 'https://example.com'
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Repository creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2014-07-24T21:48:26.648365+00:00'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format',
      readonly: true,
      example: '2016-07-29T18:45:36.317590+00:00'
    },
    {
      name: 'mainbranch',
      type: 'object',
      description: 'Main branch information object',
      nested: true,
      example: { name: 'main' }
    },
    {
      name: 'owner',
      type: 'object',
      description: 'Repository owner (user or team) object',
      required: true,
      nested: true,
      example: { username: 'teamsinspace', type: 'team' }
    },
    {
      name: 'project',
      type: 'object',
      description: 'Associated project object',
      nested: true,
      example: { name: 'Master station', key: 'PROJ' }
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for repository resources',
      readonly: true,
      nested: true,
      example: { self: { href: 'https://api.bitbucket.org/2.0/repositories/...' } }
    },
    {
      name: 'properties',
      type: 'object',
      description: 'Application-specific properties stored for this repository',
      nested: true
    }
  ]
};

/**
 * Pull Request resource field schema
 */
export const pullRequestSchema: ResourceSchema = {
  type: 'pull-request',
  description: 'Bitbucket pull request object with complete metadata',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "pullrequest"',
      required: true,
      readonly: true,
      example: 'pullrequest'
    },
    {
      name: 'id',
      type: 'number',
      description: 'Unique pull request identifier',
      required: true,
      readonly: true,
      example: 1234
    },
    {
      name: 'title',
      type: 'string',
      description: 'Pull request title',
      required: true,
      example: 'Add new feature'
    },
    {
      name: 'description',
      type: 'string',
      description: 'Pull request description in Markdown format',
      example: 'This PR adds a new feature...'
    },
    {
      name: 'state',
      type: 'string',
      description: 'Pull request state (OPEN, MERGED, DECLINED, SUPERSEDED)',
      required: true,
      example: 'OPEN'
    },
    {
      name: 'draft',
      type: 'boolean',
      description: 'Whether the pull request is in draft status',
      example: false
    },
    {
      name: 'author',
      type: 'object',
      description: 'Pull request author (user) object',
      required: true,
      nested: true,
      example: { username: 'developer', display_name: 'Developer Name' }
    },
    {
      name: 'source',
      type: 'object',
      description: 'Source branch information',
      required: true,
      nested: true,
      example: { branch: { name: 'feature-branch' } }
    },
    {
      name: 'destination',
      type: 'object',
      description: 'Destination branch information',
      required: true,
      nested: true,
      example: { branch: { name: 'main' }, repository: { full_name: 'team/repo' } }
    },
    {
      name: 'merge_commit',
      type: 'object',
      description: 'Merge commit information (available after merge)',
      nested: true,
      readonly: true
    },
    {
      name: 'close_source_branch',
      type: 'boolean',
      description: 'Whether to close source branch after merge',
      example: true
    },
    {
      name: 'closed_by',
      type: 'object',
      description: 'User who closed the pull request',
      nested: true,
      readonly: true
    },
    {
      name: 'reason',
      type: 'string',
      description: 'Reason for closing (if declined)',
      readonly: true
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-15T10:30:00.000Z'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-16T14:20:00.000Z'
    },
    {
      name: 'comment_count',
      type: 'number',
      description: 'Total number of comments',
      readonly: true,
      example: 5
    },
    {
      name: 'task_count',
      type: 'number',
      description: 'Total number of tasks',
      readonly: true,
      example: 2
    },
    {
      name: 'reviewers',
      type: 'array',
      description: 'List of pull request reviewers',
      nested: true,
      example: [{ user: { username: 'reviewer1' }, approved: true }]
    },
    {
      name: 'participants',
      type: 'array',
      description: 'List of pull request participants',
      nested: true,
      readonly: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for pull request resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * Commit resource field schema
 */
export const commitSchema: ResourceSchema = {
  type: 'commit',
  description: 'Bitbucket commit object with complete metadata',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "commit"',
      required: true,
      readonly: true,
      example: 'commit'
    },
    {
      name: 'hash',
      type: 'string',
      description: 'Commit SHA hash',
      required: true,
      readonly: true,
      example: 'abc123def456'
    },
    {
      name: 'message',
      type: 'string',
      description: 'Commit message',
      required: true,
      readonly: true,
      example: 'Fix bug in user authentication'
    },
    {
      name: 'summary',
      type: 'object',
      description: 'Commit message summary with raw and markup',
      readonly: true,
      nested: true
    },
    {
      name: 'author',
      type: 'object',
      description: 'Commit author information',
      required: true,
      readonly: true,
      nested: true,
      example: { user: { username: 'developer' }, raw: 'Developer <dev@example.com>' }
    },
    {
      name: 'date',
      type: 'string',
      description: 'Commit date in ISO 8601 format',
      required: true,
      readonly: true,
      example: '2023-01-15T10:30:00+00:00'
    },
    {
      name: 'parents',
      type: 'array',
      description: 'Parent commit objects',
      readonly: true,
      nested: true,
      example: [{ hash: 'parent123abc' }]
    },
    {
      name: 'repository',
      type: 'object',
      description: 'Repository object this commit belongs to',
      required: true,
      readonly: true,
      nested: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for commit resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * Branch resource field schema
 */
export const branchSchema: ResourceSchema = {
  type: 'branch',
  description: 'Bitbucket branch reference object',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "branch"',
      required: true,
      readonly: true,
      example: 'branch'
    },
    {
      name: 'name',
      type: 'string',
      description: 'Branch name',
      required: true,
      example: 'main'
    },
    {
      name: 'target',
      type: 'object',
      description: 'Target commit object',
      required: true,
      readonly: true,
      nested: true,
      example: { hash: 'abc123def456' }
    },
    {
      name: 'heads',
      type: 'array',
      description: 'Branch head commits',
      readonly: true,
      nested: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for branch resources',
      readonly: true,
      nested: true
    },
    {
      name: 'default_merge_strategy',
      type: 'string',
      description: 'Default merge strategy for this branch',
      example: 'merge_commit'
    },
    {
      name: 'merge_strategies',
      type: 'array',
      description: 'Available merge strategies',
      readonly: true,
      example: ['merge_commit', 'squash', 'fast_forward']
    }
  ]
};

/**
 * File/Directory resource field schema
 */
export const fileSchema: ResourceSchema = {
  type: 'commit-file',
  description: 'File or directory in a repository at a specific commit',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type (commit_file or commit_directory)',
      required: true,
      readonly: true,
      example: 'commit_file'
    },
    {
      name: 'path',
      type: 'string',
      description: 'File or directory path relative to repository root',
      required: true,
      readonly: true,
      example: 'src/main.js'
    },
    {
      name: 'commit',
      type: 'object',
      description: 'Commit object this file belongs to',
      required: true,
      readonly: true,
      nested: true
    },
    {
      name: 'size',
      type: 'number',
      description: 'File size in bytes (files only)',
      readonly: true,
      example: 1024
    },
    {
      name: 'mimetype',
      type: 'string',
      description: 'MIME type of the file content',
      readonly: true,
      example: 'text/javascript'
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for file resources',
      readonly: true,
      nested: true
    },
    {
      name: 'escaped_path',
      type: 'string',
      description: 'URL-escaped file path',
      readonly: true
    },
    {
      name: 'attributes',
      type: 'array',
      description: 'File attributes (executable, symlink, etc.)',
      readonly: true,
      example: ['executable']
    }
  ]
};

/**
 * Issue resource field schema
 */
export const issueSchema: ResourceSchema = {
  type: 'issue',
  description: 'Bitbucket issue object',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "issue"',
      required: true,
      readonly: true,
      example: 'issue'
    },
    {
      name: 'id',
      type: 'number',
      description: 'Unique issue identifier',
      required: true,
      readonly: true,
      example: 42
    },
    {
      name: 'title',
      type: 'string',
      description: 'Issue title',
      required: true,
      example: 'Bug in login system'
    },
    {
      name: 'content',
      type: 'object',
      description: 'Issue content with raw and markup',
      nested: true
    },
    {
      name: 'reporter',
      type: 'object',
      description: 'User who reported the issue',
      required: true,
      readonly: true,
      nested: true
    },
    {
      name: 'assignee',
      type: 'object',
      description: 'User assigned to the issue',
      nested: true
    },
    {
      name: 'state',
      type: 'string',
      description: 'Issue state (new, open, resolved, closed, etc.)',
      required: true,
      example: 'open'
    },
    {
      name: 'kind',
      type: 'string',
      description: 'Issue kind (bug, enhancement, proposal, task)',
      required: true,
      example: 'bug'
    },
    {
      name: 'priority',
      type: 'string',
      description: 'Issue priority (trivial, minor, major, critical, blocker)',
      required: true,
      example: 'major'
    },
    {
      name: 'component',
      type: 'object',
      description: 'Component this issue belongs to',
      nested: true
    },
    {
      name: 'milestone',
      type: 'object',
      description: 'Milestone this issue is assigned to',
      nested: true
    },
    {
      name: 'version',
      type: 'object',
      description: 'Version this issue affects',
      nested: true
    },
    {
      name: 'votes',
      type: 'number',
      description: 'Number of votes for this issue',
      readonly: true,
      example: 5
    },
    {
      name: 'watches',
      type: 'number',
      description: 'Number of watchers for this issue',
      readonly: true,
      example: 3
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-15T10:30:00.000Z'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-16T14:20:00.000Z'
    },
    {
      name: 'repository',
      type: 'object',
      description: 'Repository this issue belongs to',
      required: true,
      readonly: true,
      nested: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for issue resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * User/Account resource field schema
 */
export const userSchema: ResourceSchema = {
  type: 'user',
  description: 'Bitbucket user or team account object',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type (user or team)',
      required: true,
      readonly: true,
      example: 'user'
    },
    {
      name: 'uuid',
      type: 'string',
      description: 'Unique user identifier in UUID format with braces',
      required: true,
      readonly: true,
      example: '{61fc5cf6-d054-47d2-b4a9-061ccf858379}'
    },
    {
      name: 'account_id',
      type: 'string',
      description: 'Account identifier string',
      readonly: true,
      example: '5d5355e8c6b9320d9ea5b28d'
    },
    {
      name: 'username',
      type: 'string',
      description: 'Username (deprecated for users, still valid for teams)',
      readonly: true,
      example: 'teamsinspace'
    },
    {
      name: 'nickname',
      type: 'string',
      description: 'User nickname',
      readonly: true,
      example: 'dev123'
    },
    {
      name: 'display_name',
      type: 'string',
      description: 'User display name',
      required: true,
      example: 'John Developer'
    },
    {
      name: 'website',
      type: 'string',
      description: 'User website URL',
      example: 'https://johndeveloper.com'
    },
    {
      name: 'location',
      type: 'string',
      description: 'User location',
      example: 'San Francisco, CA'
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Account creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2019-01-01T00:00:00.000Z'
    },
    {
      name: 'account_status',
      type: 'string',
      description: 'Account status (active, inactive)',
      readonly: true,
      example: 'active'
    },
    {
      name: 'has_2fa_enabled',
      type: 'boolean',
      description: 'Whether two-factor authentication is enabled',
      readonly: true,
      example: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for user resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * Project resource field schema
 */
export const projectSchema: ResourceSchema = {
  type: 'project',
  description: 'Bitbucket project object for organizing repositories',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "project"',
      required: true,
      readonly: true,
      example: 'project'
    },
    {
      name: 'uuid',
      type: 'string',
      description: 'Unique project identifier in UUID format with braces',
      required: true,
      readonly: true,
      example: '{a18967d5-acba-4f73-bf9c-36d9fa6ea143}'
    },
    {
      name: 'key',
      type: 'string',
      description: 'Project key (unique within workspace)',
      required: true,
      example: 'PROJ'
    },
    {
      name: 'name',
      type: 'string',
      description: 'Project display name',
      required: true,
      example: 'My Project'
    },
    {
      name: 'description',
      type: 'string',
      description: 'Project description',
      example: 'This is a sample project'
    },
    {
      name: 'is_private',
      type: 'boolean',
      description: 'Whether the project is private',
      required: true,
      example: false
    },
    {
      name: 'owner',
      type: 'object',
      description: 'Project owner (team or user) object',
      required: true,
      nested: true
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Project creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-01T00:00:00.000Z'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-15T12:00:00.000Z'
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for project resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * Comment resource field schema (for pull requests, commits, issues)
 */
export const commentSchema: ResourceSchema = {
  type: 'comment',
  description: 'Comment object for pull requests, commits, or issues',
  fields: [
    {
      name: 'type',
      type: 'string',
      description: 'Comment type (pullrequest_comment, commit_comment, issue_comment)',
      required: true,
      readonly: true,
      example: 'pullrequest_comment'
    },
    {
      name: 'id',
      type: 'number',
      description: 'Unique comment identifier',
      required: true,
      readonly: true,
      example: 12345
    },
    {
      name: 'content',
      type: 'object',
      description: 'Comment content with raw and markup',
      required: true,
      nested: true
    },
    {
      name: 'user',
      type: 'object',
      description: 'User who created the comment',
      required: true,
      readonly: true,
      nested: true
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Creation timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-15T10:30:00.000Z'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format',
      readonly: true,
      example: '2023-01-16T14:20:00.000Z'
    },
    {
      name: 'inline',
      type: 'object',
      description: 'Inline comment positioning (for code comments)',
      nested: true
    },
    {
      name: 'parent',
      type: 'object',
      description: 'Parent comment (for threaded comments)',
      nested: true,
      readonly: true
    },
    {
      name: 'pullrequest',
      type: 'object',
      description: 'Associated pull request (for PR comments)',
      readonly: true,
      nested: true
    },
    {
      name: 'commit',
      type: 'object',
      description: 'Associated commit (for commit comments)',
      readonly: true,
      nested: true
    },
    {
      name: 'issue',
      type: 'object',
      description: 'Associated issue (for issue comments)',
      readonly: true,
      nested: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for comment resources',
      readonly: true,
      nested: true
    }
  ]
};

/**
 * All available resource schemas indexed by type
 */
export const resourceSchemas: Record<string, ResourceSchema> = {
  repository: repositorySchema,
  pullrequest: pullRequestSchema,
  commit: commitSchema,
  branch: branchSchema,
  commit_file: fileSchema,
  commit_directory: fileSchema,
  issue: issueSchema,
  user: userSchema,
  team: userSchema,
  project: projectSchema,
  pullrequest_comment: commentSchema,
  commit_comment: commentSchema,
  issue_comment: commentSchema
};

/**
 * Get field schema for a specific resource type
 */
export function getResourceSchema(resourceType: string): ResourceSchema | undefined {
  return resourceSchemas[resourceType];
}

/**
 * Get all field names for a resource type
 */
export function getResourceFields(resourceType: string): string[] {
  const schema = getResourceSchema(resourceType);
  return schema?.fields.map(f => f.name) || [];
}

/**
 * Get field metadata for a specific field
 */
export function getFieldMetadata(resourceType: string, fieldName: string): FieldMetadata | undefined {
  const schema = getResourceSchema(resourceType);
  return schema?.fields.find(f => f.name === fieldName);
}

/**
 * Get commonly requested fields for different access patterns
 */
export const commonFieldSets = {
  minimal: ['type', 'id', 'uuid', 'name', 'full_name'],
  summary: ['type', 'id', 'uuid', 'name', 'full_name', 'title', 'description', 'state', 'created_on', 'updated_on'],
  metadata: ['type', 'id', 'uuid', 'name', 'full_name', 'title', 'description', 'state', 'created_on', 'updated_on', 'author', 'owner'],
  detailed: [] // Empty means all fields
};

/**
 * Get predefined field set
 */
export function getCommonFields(pattern: keyof typeof commonFieldSets): string[] {
  return commonFieldSets[pattern];
}

/**
 * Resource type categories for organization and discovery
 */
export const resourceCategories = {
  core: {
    description: 'Core Bitbucket resources essential for most operations',
    types: ['repository', 'pull-request', 'commit', 'branch', 'user']
  },
  extended: {
    description: 'Extended resources for advanced functionality',
    types: ['issue', 'project', 'pull-request-comment', 'commit-comment', 'issue-comment', 'commit-file', 'commit-directory']
  }
};

/**
 * Get all available resource types
 */
export function getAllResourceTypes(): string[] {
  return Object.keys(resourceSchemas);
}

/**
 * Get resource types by category
 */
export function getResourceTypesByCategory(category: 'core' | 'extended' | 'all' = 'all'): string[] {
  if (category === 'all') {
    return getAllResourceTypes();
  }
  return resourceCategories[category]?.types || [];
}

/**
 * Get resource type index with metadata
 * Returns a static list of all available resource types
 */
export function getResourceTypeIndex(): Array<{
  type: string;
  description: string;
  category: 'core' | 'extended';
}> {
  const types = getResourceTypesByCategory('all');
  
  return types.map(type => {
    const schema = getResourceSchema(type);
    if (!schema) return null;
    
    return {
      type: schema.type,
      description: schema.description,
      category: resourceCategories.core.types.includes(type) ? 'core' : 'extended'
    };
  }).filter(Boolean) as Array<{
    type: string;
    description: string;
    category: 'core' | 'extended';
  }>;
}

/**
 * Get filtered fields based on criteria
 */
export function getFilteredFields(
  resourceType: string, 
  filterBy?: 'required' | 'optional' | 'readonly' | 'nested'
): FieldMetadata[] {
  const schema = getResourceSchema(resourceType);
  if (!schema) return [];
  
  if (!filterBy) return schema.fields;
  
  return schema.fields.filter(field => {
    switch (filterBy) {
      case 'required':
        return field.required === true;
      case 'optional':
        return !field.required;
      case 'readonly':
        return field.readonly === true;
      case 'nested':
        return field.nested === true;
      default:
        return true;
    }
  });
}

/**
 * Get validation rules for a resource type
 */
export function getValidationRules(resourceType: string, operation: 'create' | 'update' | 'read' = 'read') {
  const schema = getResourceSchema(resourceType);
  if (!schema) return null;
  
  const rules = {
    resourceType: schema.type,
    operation,
    requiredFields: schema.fields.filter(f => f.required && !f.readonly).map(f => f.name),
    readonlyFields: schema.fields.filter(f => f.readonly).map(f => f.name),
    optionalFields: schema.fields.filter(f => !f.required && !f.readonly).map(f => f.name),
    nestedFields: schema.fields.filter(f => f.nested).map(f => f.name),
    fieldTypes: schema.fields.reduce((acc, field) => {
      acc[field.name] = field.type;
      return acc;
    }, {} as Record<string, string>)
  };
  
  // Adjust rules based on operation
  if (operation === 'create') {
    // For create operations, some readonly fields might be auto-generated
    rules.readonlyFields = schema.fields.filter(f => f.readonly && !['type', 'created_on'].includes(f.name)).map(f => f.name);
  } else if (operation === 'update') {
    // For update operations, some required fields might become optional
    rules.requiredFields = schema.fields.filter(f => f.required && !f.readonly && !['type', 'id', 'uuid'].includes(f.name)).map(f => f.name);
  }
  
  return rules;
}

/**
 * Get field schema with detailed information
 */
export function getDetailedFieldSchema(
  resourceType: string, 
  fieldName: string, 
  includeNested: boolean = false
) {
  const fieldMetadata = getFieldMetadata(resourceType, fieldName);
  if (!fieldMetadata) return null;
  
  const result: any = {
    ...fieldMetadata,
    resourceType,
    validationRules: {
      required: fieldMetadata.required || false,
      readonly: fieldMetadata.readonly || false,
      type: fieldMetadata.type
    }
  };
  
  // Add nested schema information if requested and applicable
  if (includeNested && fieldMetadata.nested && fieldMetadata.type === 'object') {
    // For now, we'll indicate that nested schemas are available
    // In the future, this could include detailed nested field definitions
    result.nestedSchema = {
      available: true,
      note: `Nested schema for ${fieldName} in ${resourceType} - use specific resource type for detailed schema`
    };
  }
  
  return result;
}
