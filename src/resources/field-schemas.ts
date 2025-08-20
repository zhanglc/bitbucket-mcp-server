/**
 * Static field schemas and metadata for Bitbucket Cloud and Server REST API resources
 * Based on official Bitbucket Cloud and Server REST API documentation
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
 * Repository resource field schema (Cloud and Server)
 */
export const repositorySchema: ResourceSchema = {
  type: 'repository',
  description: 'Bitbucket repository object with complete metadata',
  fields: [
    // Common fields (both Cloud and Server)
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
      name: 'description',
      type: 'string',
      description: 'Repository description text',
      example: 'This is a sample repository'
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
      name: 'project',
      type: 'object',
      description: 'Associated project object',
      nested: true,
      example: { name: 'Master station', key: 'PROJ' }
    },
    
    // Cloud-specific fields
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "repository" (Cloud only)',
      readonly: true,
      example: 'repository'
    },
    {
      name: 'uuid',
      type: 'string',
      description: 'Unique repository identifier in UUID format with braces (Cloud only)',
      readonly: true,
      example: '{b4434b4d-6a0e-4f57-8d75-e02a824abeb0}'
    },
    {
      name: 'full_name',
      type: 'string',
      description: 'Full repository name in format "workspace/repo_slug" (Cloud only)',
      readonly: true,
      example: 'teamsinspace/documentation-tests'
    },
    {
      name: 'scm',
      type: 'string',
      description: 'Source control management type (git, hg) (Cloud only)',
      readonly: true,
      example: 'git'
    },
    {
      name: 'is_private',
      type: 'boolean',
      description: 'Whether the repository is private (Cloud only)',
      example: false
    },
    {
      name: 'size',
      type: 'number',
      description: 'Repository size in bytes (Cloud only)',
      readonly: true,
      example: 1172663
    },
    {
      name: 'language',
      type: 'string',
      description: 'Primary programming language detected (Cloud only)',
      readonly: true,
      example: 'JavaScript'
    },
    {
      name: 'has_issues',
      type: 'boolean',
      description: 'Whether issue tracker is enabled (Cloud only)',
      example: true
    },
    {
      name: 'has_wiki',
      type: 'boolean',
      description: 'Whether wiki is enabled (Cloud only)',
      example: true
    },
    {
      name: 'fork_policy',
      type: 'string',
      description: 'Fork permission policy (allow_forks, no_public_forks, no_forks) (Cloud only)',
      example: 'allow_forks'
    },
    {
      name: 'website',
      type: 'string',
      description: 'Repository website URL (Cloud only)',
      example: 'https://example.com'
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Repository creation timestamp in ISO 8601 format (Cloud only)',
      readonly: true,
      example: '2014-07-24T21:48:26.648365+00:00'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format (Cloud only)',
      readonly: true,
      example: '2016-07-29T18:45:36.317590+00:00'
    },
    {
      name: 'mainbranch',
      type: 'object',
      description: 'Main branch information object (Cloud only)',
      nested: true,
      example: { name: 'main' }
    },
    {
      name: 'owner',
      type: 'object',
      description: 'Repository owner (user or team) object (Cloud only)',
      nested: true,
      example: { username: 'teamsinspace', type: 'team' }
    },
    {
      name: 'properties',
      type: 'object',
      description: 'Application-specific properties stored for this repository (Cloud only)',
      nested: true
    },

    // Server-specific fields
    {
      name: 'id',
      type: 'number',
      description: 'Numeric repository identifier (Server only)',
      readonly: true,
      example: 1234
    },
    {
      name: 'hierarchyId',
      type: 'string',
      description: 'Repository hierarchy identifier (Server only)',
      readonly: true,
      example: 'abc123def456'
    },
    {
      name: 'scmId',
      type: 'string',
      description: 'Source control management identifier (Server only)',
      readonly: true,
      example: 'git'
    },
    {
      name: 'state',
      type: 'string',
      description: 'Repository state (AVAILABLE, INITIALISING, etc.) (Server only)',
      readonly: true,
      example: 'AVAILABLE'
    },
    {
      name: 'statusMessage',
      type: 'string',
      description: 'Repository status message (Server only)',
      readonly: true,
      example: 'Available'
    },
    {
      name: 'forkable',
      type: 'boolean',
      description: 'Whether the repository can be forked (Server only)',
      readonly: true,
      example: true
    },
    {
      name: 'public',
      type: 'boolean',
      description: 'Whether the repository is public (Server only)',
      example: false
    },
    {
      name: 'archived',
      type: 'boolean',
      description: 'Whether the repository is archived (Server only)',
      example: false
    }
  ]
};

/**
 * Branch resource field schema (Cloud and Server)
 */
export const branchSchema: ResourceSchema = {
  type: 'branch',
  description: 'Bitbucket branch reference object',
  fields: [
    // Common fields (both Cloud and Server)
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier (Server: "BRANCH", Cloud: "branch")',
      readonly: true,
      example: 'branch'
    },
    
    // Cloud-specific fields
    {
      name: 'name',
      type: 'string',
      description: 'Branch name (Cloud only)',
      example: 'main'
    },
    {
      name: 'target',
      type: 'object',
      description: 'Target commit object (Cloud only)',
      readonly: true,
      nested: true,
      example: { hash: 'abc123def456' }
    },
    {
      name: 'heads',
      type: 'array',
      description: 'Branch head commits (Cloud only)',
      readonly: true,
      nested: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for branch resources (Cloud only)',
      readonly: true,
      nested: true
    },
    {
      name: 'default_merge_strategy',
      type: 'string',
      description: 'Default merge strategy for this branch (Cloud only)',
      example: 'merge_commit'
    },
    {
      name: 'merge_strategies',
      type: 'array',
      description: 'Available merge strategies (Cloud only)',
      readonly: true,
      example: ['merge_commit', 'squash', 'fast_forward']
    },

    // Server-specific fields
    {
      name: 'id',
      type: 'string',
      description: 'Branch identifier (Server only)',
      readonly: true,
      example: 'refs/heads/main'
    },
    {
      name: 'displayId',
      type: 'string',
      description: 'Display name of the branch (Server only)',
      readonly: true,
      example: 'main'
    },
    {
      name: 'latestCommit',
      type: 'string',
      description: 'Latest commit hash on this branch (Server only)',
      readonly: true,
      example: 'abc123def456789'
    },
    {
      name: 'latestChangeset',
      type: 'string',
      description: 'Latest changeset hash on this branch (Server only)',
      readonly: true,
      example: 'abc123def456789'
    },
    {
      name: 'isDefault',
      type: 'boolean',
      description: 'Whether this is the default branch (Server only)',
      readonly: true,
      example: true
    }
  ]
};

/**
 * Pull Request resource field schema (Cloud and Server)
 */
export const pullRequestSchema: ResourceSchema = {
  type: 'pull-request',
  description: 'Bitbucket pull request object with complete metadata',
  fields: [
    // Common fields (both Cloud and Server)
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
      description: 'Pull request description',
      example: 'This PR adds a new feature...'
    },
    {
      name: 'state',
      type: 'string',
      description: 'Pull request state (OPEN, MERGED, DECLINED, SUPERSEDED)',
      required: true,
      example: 'OPEN'
    },
    
    // Cloud-specific fields
    {
      name: 'type',
      type: 'string',
      description: 'Object type identifier, always "pullrequest" (Cloud only)',
      readonly: true,
      example: 'pullrequest'
    },
    {
      name: 'draft',
      type: 'boolean',
      description: 'Whether the pull request is in draft status (Cloud only)',
      example: false
    },
    {
      name: 'author',
      type: 'object',
      description: 'Pull request author (user) object (Cloud only)',
      nested: true,
      example: { username: 'developer', display_name: 'Developer Name' }
    },
    {
      name: 'source',
      type: 'object',
      description: 'Source branch information (Cloud only)',
      nested: true,
      example: { branch: { name: 'feature-branch' } }
    },
    {
      name: 'destination',
      type: 'object',
      description: 'Destination branch information (Cloud only)',
      nested: true,
      example: { branch: { name: 'main' }, repository: { full_name: 'team/repo' } }
    },
    {
      name: 'merge_commit',
      type: 'object',
      description: 'Merge commit information (available after merge) (Cloud only)',
      nested: true,
      readonly: true
    },
    {
      name: 'close_source_branch',
      type: 'boolean',
      description: 'Whether to close source branch after merge (Cloud only)',
      example: true
    },
    {
      name: 'closed_by',
      type: 'object',
      description: 'User who closed the pull request (Cloud only)',
      nested: true,
      readonly: true
    },
    {
      name: 'reason',
      type: 'string',
      description: 'Reason for closing (if declined) (Cloud only)',
      readonly: true
    },
    {
      name: 'created_on',
      type: 'string',
      description: 'Creation timestamp in ISO 8601 format (Cloud only)',
      readonly: true,
      example: '2023-01-15T10:30:00.000Z'
    },
    {
      name: 'updated_on',
      type: 'string',
      description: 'Last update timestamp in ISO 8601 format (Cloud only)',
      readonly: true,
      example: '2023-01-16T14:20:00.000Z'
    },
    {
      name: 'comment_count',
      type: 'number',
      description: 'Total number of comments (Cloud only)',
      readonly: true,
      example: 5
    },
    {
      name: 'task_count',
      type: 'number',
      description: 'Total number of tasks (Cloud only)',
      readonly: true,
      example: 2
    },
    {
      name: 'reviewers',
      type: 'array',
      description: 'List of pull request reviewers (Cloud only)',
      nested: true,
      example: [{ user: { username: 'reviewer1' }, approved: true }]
    },
    {
      name: 'participants',
      type: 'array',
      description: 'List of pull request participants (Cloud only)',
      nested: true,
      readonly: true
    },
    {
      name: 'links',
      type: 'object',
      description: 'Related links for pull request resources (Cloud only)',
      readonly: true,
      nested: true
    }

    // Note: Server-specific PR fields would be added here when we test PR responses from server
  ]
};

/**
 * Simplified schemas for common resources - keeping existing schemas for compatibility
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
    }
  ]
};

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
    }
  ]
};

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
    }
  ]
};

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
      name: 'display_name',
      type: 'string',
      description: 'User display name',
      required: true,
      example: 'John Developer'
    }
  ]
};

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
      name: 'key',
      type: 'string',
      description: 'Project key (unique within workspace)',
      required: true,
      example: 'PROJ'
    }
  ]
};

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