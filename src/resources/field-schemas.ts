/**
 * Field schema definitions for Pull Request resources
 * Used for field filtering and API documentation
 */

export const PULL_REQUEST_FIELDS: Record<string, any> = {
  // Basic PR information
  id: {
    type: 'number',
    description: 'Unique identifier for the pull request'
  },
  title: {
    type: 'string',
    description: 'Title of the pull request'
  },
  description: {
    type: 'string',
    description: 'Description or summary of the pull request'
  },
  state: {
    type: 'string',
    description: 'Current state of the pull request (OPEN, MERGED, DECLINED)'
  },
  is_open: {
    type: 'boolean',
    description: 'Whether the pull request is currently open'
  },
  is_closed: {
    type: 'boolean',
    description: 'Whether the pull request is closed'
  },
  is_locked: {
    type: 'boolean',
    description: 'Whether the pull request is locked for further changes'
  },

  // Author information
  author: {
    type: 'string',
    description: 'Display name of the pull request author'
  },
  author_username: {
    type: 'string',
    description: 'Username of the pull request author'
  },
  author_email: {
    type: 'string',
    description: 'Email address of the pull request author',
    format: 'email'
  },

  // Branch and commit information
  source_branch: {
    type: 'string',
    description: 'Name of the source branch for the pull request'
  },
  destination_branch: {
    type: 'string',
    description: 'Name of the destination branch for the pull request'
  },
  source_commit: {
    type: 'string',
    description: 'Latest commit hash on the source branch'
  },
  destination_commit: {
    type: 'string',
    description: 'Latest commit hash on the destination branch'
  },

  // Review and participation
  reviewers: {
    type: 'array',
    description: 'List of reviewers assigned to the pull request',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Display name of the reviewer'
        },
        approved: {
          type: 'boolean',
          description: 'Whether the reviewer has approved the pull request'
        },
        status: {
          type: 'string',
          description: 'Review status (APPROVED, UNAPPROVED, NEEDS_WORK)'
        }
      }
    }
  },
  participants: {
    type: 'array',
    description: 'List of participants in the pull request',
    items: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Display name of the participant'
        },
        role: {
          type: 'string',
          description: 'Role of the participant (AUTHOR, REVIEWER, PARTICIPANT)'
        },
        approved: {
          type: 'boolean',
          description: 'Whether the participant has approved the pull request'
        },
        status: {
          type: 'string',
          description: 'Participation status'
        }
      }
    }
  },

  // Timestamps
  created_on: {
    type: 'string',
    description: 'Date and time when the pull request was created',
    format: 'date-time'
  },
  updated_on: {
    type: 'string',
    description: 'Date and time when the pull request was last updated',
    format: 'date-time'
  },

  // URLs and links
  web_url: {
    type: 'string',
    description: 'Web URL to view the pull request in the browser',
    format: 'uri'
  },
  api_url: {
    type: 'string',
    description: 'API URL to access the pull request programmatically',
    format: 'uri'
  },

  // Merge information
  is_merged: {
    type: 'boolean',
    description: 'Whether the pull request has been merged'
  },
  merge_commit_hash: {
    type: 'string',
    description: 'Hash of the merge commit if the pull request has been merged'
  },
  merged_by: {
    type: 'string',
    description: 'Name of the user who merged the pull request'
  },
  merged_at: {
    type: 'string',
    description: 'Date and time when the pull request was merged',
    format: 'date-time'
  },
  merge_commit_message: {
    type: 'string',
    description: 'Commit message used for the merge commit'
  }
};

/**
 * Get all available field names for pull requests
 */
export function getAllPullRequestFields(): string[] {
  return Object.keys(PULL_REQUEST_FIELDS);
}

/**
 * Get field definition for a specific field
 */
export function getFieldDefinition(fieldName: string): any {
  return PULL_REQUEST_FIELDS[fieldName as keyof typeof PULL_REQUEST_FIELDS];
}

/**
 * Check if a field exists in the schema
 */
export function isValidField(fieldName: string): boolean {
  return fieldName in PULL_REQUEST_FIELDS;
}

/**
 * Get all fields that can be used with dot notation (nested fields)
 */
export function getNestedFields(): string[] {
  const nestedFields: string[] = [];
  
  Object.entries(PULL_REQUEST_FIELDS).forEach(([fieldName, fieldDef]) => {
    if (fieldDef.type === 'array' && fieldDef.items?.properties) {
      const properties = Object.keys(fieldDef.items.properties);
      properties.forEach(prop => {
        nestedFields.push(`${fieldName}.${prop}`);
      });
    }
  });
  
  return nestedFields;
}