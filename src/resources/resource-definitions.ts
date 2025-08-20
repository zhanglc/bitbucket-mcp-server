import { PULL_REQUEST_FIELDS } from './field-schemas.js';

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
  extractVariables?: (uri: string) => Record<string, string> | undefined;
}

export const RESOURCE_DEFINITIONS: Resource[] = [
  {
    uri: 'bitbucket://pull-requests/fields/schema',
    name: 'Pull Request Fields Schema',
    description: 'Complete schema definition for all available pull request fields with types and descriptions',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://pull-requests/fields/list',
    name: 'Pull Request Fields List',
    description: 'Alphabetically sorted list of all available pull request field names',
    mimeType: 'text/plain'
  },
  {
    uri: 'bitbucket://pull-requests/examples/basic',
    name: 'Basic Pull Request Examples',
    description: 'Basic usage examples for the list_pull_requests tool with common parameter combinations',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bitbucket://pull-requests/examples/fields-filtering',
    name: 'Field Filtering Examples',
    description: 'Comprehensive examples showing how to use the fields parameter with dot notation for selective data retrieval',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bitbucket://pull-requests/docs/api-reference',
    name: 'Pull Request API Reference',
    description: 'Complete API reference documentation for the list_pull_requests tool including all parameters and usage',
    mimeType: 'text/markdown'
  },
  {
    uri: 'bitbucket://server/info',
    name: 'Server Information',
    description: 'Current Bitbucket server configuration and connection details',
    mimeType: 'text/plain'
  },
  {
    uri: 'bitbucket://server/capabilities',
    name: 'Server Capabilities',
    description: 'List of supported features and capabilities for the current Bitbucket server configuration',
    mimeType: 'text/plain'
  }
];

export const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    uriTemplate: 'bitbucket://pull-requests/fields/{field_name}',
    name: 'Pull Request Field Definition',
    description: 'Detailed definition, type information, and usage examples for a specific field',
    mimeType: 'application/json',
    extractVariables: (uri: string) => {
      const match = uri.match(/^bitbucket:\/\/pull-requests\/fields\/([^\/]+)$/);
      return match ? { field_name: match[1] } : undefined;
    }
  },
  {
    uriTemplate: 'bitbucket://pull-requests/examples/{example_type}',
    name: 'Pull Request Examples',
    description: 'Specific examples and use cases for pull request operations',
    mimeType: 'text/markdown',
    extractVariables: (uri: string) => {
      const match = uri.match(/^bitbucket:\/\/pull-requests\/examples\/([^\/]+)$/);
      return match ? { example_type: match[1] } : undefined;
    }
  }
];

export function getResourceByUri(uri: string): Resource | undefined {
  return RESOURCE_DEFINITIONS.find(r => r.uri === uri);
}

export function getResourceTemplateByUri(uri: string): ResourceTemplate | undefined {
  return RESOURCE_TEMPLATES.find(template => {
    if (!template.extractVariables) return false;
    return template.extractVariables(uri) !== undefined;
  });
}

export async function generateResourceContent(uri: string): Promise<string> {
  if (!uri.startsWith('bitbucket://')) {
    throw new Error('Invalid resource URI');
  }

  // Check static resources first
  const staticResource = getResourceByUri(uri);
  if (staticResource) {
    return generateStaticResourceContent(uri);
  }

  // Check template resources
  const template = getResourceTemplateByUri(uri);
  if (template) {
    return generateTemplateResourceContent(uri, template);
  }

  throw new Error('Resource not found');
}

function generateStaticResourceContent(uri: string): string {
  switch (uri) {
    case 'bitbucket://pull-requests/fields/schema':
      return JSON.stringify(PULL_REQUEST_FIELDS, null, 2);

    case 'bitbucket://pull-requests/fields/list':
      return Object.keys(PULL_REQUEST_FIELDS).sort().join('\n') + '\n';

    case 'bitbucket://pull-requests/examples/basic':
      return generateBasicExamples();

    case 'bitbucket://pull-requests/examples/fields-filtering':
      return generateFieldFilteringExamples();

    case 'bitbucket://pull-requests/docs/api-reference':
      return generateApiReference();

    case 'bitbucket://server/info':
      return generateServerInfo();

    case 'bitbucket://server/capabilities':
      return generateServerCapabilities();

    default:
      throw new Error('Resource not found');
  }
}

function generateTemplateResourceContent(uri: string, template: ResourceTemplate): string {
  const variables = template.extractVariables!(uri);
  
  if (template.uriTemplate === 'bitbucket://pull-requests/fields/{field_name}') {
    const fieldName = variables!.field_name;
    
    if (!PULL_REQUEST_FIELDS[fieldName]) {
      throw new Error(`Unknown field: ${fieldName}`);
    }
    
    return generateFieldDefinition(fieldName);
  }
  
  throw new Error('Template not implemented');
}

function generateFieldDefinition(fieldName: string): string {
  const fieldSchema = PULL_REQUEST_FIELDS[fieldName];
  
  const definition = {
    name: fieldName,
    ...fieldSchema,
    examples: generateFieldExamples(fieldName, fieldSchema)
  };
  
  return JSON.stringify(definition, null, 2);
}

function generateFieldExamples(fieldName: string, schema: any): string[] {
  const examples = [`${fieldName}`];
  
  if (schema.type === 'array' && schema.items?.properties) {
    const properties = Object.keys(schema.items.properties);
    
    examples.push(`${fieldName}.${properties[0]}`);
    examples.push(`${fieldName}.0.${properties[0]}`);
    
    if (properties.length > 1) {
      examples.push(`${fieldName}.${properties[1]}`);
      examples.push(`${fieldName}.0.${properties[1]}`);
    }
  }
  
  return examples;
}

function generateBasicExamples(): string {
  return `# Basic Pull Request Queries

## List all open pull requests
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo
\`\`\`

## List all merged pull requests
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo state=MERGED
\`\`\`

## List pull requests by specific author
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo author=jane.doe
\`\`\`

## List pull requests with specific reviewer
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo reviewer=john.smith
\`\`\`

## Filter by state - only open PRs
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo state=OPEN
\`\`\`

## Filter by state - only declined PRs
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo state=DECLINED
\`\`\`

## Limited results with pagination
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo limit=5 start=0
\`\`\`
`;
}

function generateFieldFilteringExamples(): string {
  return `# Field Filtering Examples

Field filtering allows you to specify exactly which fields you want in the response, reducing data transfer and focusing on specific information.

## Basic Field Selection

### Only basic information
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,state
\`\`\`

### Only author and reviewer names
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=author,reviewers.name
\`\`\`

## Dot Notation for Nested Fields

### Get specific reviewer information
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,reviewers.name,reviewers.approved
\`\`\`

### Get specific reviewer by index
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,reviewers.0.name,reviewers.0.approved
\`\`\`

### Author details with timestamps
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=title,author.name,author.email,created_on,updated_on
\`\`\`

## Practical Scenarios

### For dashboards - minimal data
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,state,author.name,reviewers.name
\`\`\`

### For notifications - key status info
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,state,reviewers.approved,updated_on
\`\`\`

### For reporting - comprehensive but focused
\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,author.name,reviewers.name,reviewers.approved,state,created_on,updated_on
\`\`\`

Field filtering can significantly reduce response size and improve performance when you only need specific information.
`;
}

function generateApiReference(): string {
  return `# Pull Request API Reference

## Parameters

### Required Parameters

- **workspace** (string): The workspace key for the repository
- **repository** (string): The repository name

### Optional Parameters

- **fields** (string): Comma-separated list of fields to return. Supports dot notation for nested fields.
- **state** (string): Filter by pull request state. Valid values: OPEN, MERGED, DECLINED
- **author** (string): Filter by author username or email
- **reviewer** (string): Filter by reviewer username or email  
- **limit** (number): Maximum number of results to return (default: 10)
- **start** (number): Starting index for pagination (default: 0)

## Fields

The following fields are available for selection using the \`fields\` parameter:

### Basic Fields
- \`id\` - Pull request ID
- \`title\` - Pull request title
- \`state\` - Current state (OPEN, MERGED, DECLINED)
- \`description\` - Pull request description

### Author Information
- \`author\` - Complete author object
- \`author.name\` - Author display name
- \`author.email\` - Author email address

### Reviewer Information  
- \`reviewers\` - Array of all reviewers
- \`reviewers.name\` - All reviewer names
- \`reviewers.0.name\` - First reviewer's name
- \`reviewers.approved\` - All reviewer approval status
- \`reviewers.0.approved\` - First reviewer's approval status

### Timestamps
- \`created_on\` - When PR was created
- \`updated_on\` - Last update time

### Repository Information
- \`source\` - Source branch information
- \`destination\` - Destination branch information

## Examples

\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo
\`\`\`

\`\`\`
list_pull_requests workspace=my-workspace repository=my-repo fields=id,title,state
\`\`\`

See the examples resources for detailed usage scenarios:
- bitbucket://pull-requests/examples/basic
- bitbucket://pull-requests/examples/fields-filtering
`;
}

function generateServerInfo(): string {
  const baseUrl = process.env.BITBUCKET_BASE_URL || 'https://api.bitbucket.org/2.0';
  const isCloud = baseUrl.includes('api.bitbucket.org');
  
  return `Server Type: ${isCloud ? 'Cloud' : 'Server'}
Base URL: ${baseUrl}
Version: 1.0.11
Authentication: ${process.env.BITBUCKET_USERNAME ? 'Configured' : 'Not configured'}
`;
}

function generateServerCapabilities(): string {
  const baseUrl = process.env.BITBUCKET_BASE_URL || 'https://api.bitbucket.org/2.0';
  const isCloud = baseUrl.includes('api.bitbucket.org');
  
  return `Supported Features:
✓ Pull Requests
✓ Field Filtering  
✓ Branches
✓ File Operations
${isCloud ? '✗' : '✓'} Search (Server only)
✓ Comments and Reviews

Note: Some features may have different capabilities between Bitbucket Cloud and Server.
`;
}