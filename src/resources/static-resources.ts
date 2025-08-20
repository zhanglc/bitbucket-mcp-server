export interface StaticResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * 静态资源列表 - 这些是具体可访问的资源，而非模板
 * 符合 MCP ListResources 规范，提供具体的、可直接访问的资源
 */
export const staticResources: StaticResource[] = [
  {
    uri: 'bitbucket://schema/index',
    name: 'Resource Schema Index',
    description: 'Complete index of all available Bitbucket resource types with field schemas',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/repository',
    name: 'Repository Schema',
    description: 'Field schema for repository resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/pullrequest',
    name: 'Pull Request Schema', 
    description: 'Field schema for pull request resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/commit',
    name: 'Commit Schema',
    description: 'Field schema for commit resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/branch',
    name: 'Branch Schema',
    description: 'Field schema for branch resources', 
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/file',
    name: 'File Schema',
    description: 'Field schema for file resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/diff',
    name: 'Diff Schema',
    description: 'Field schema for diff/patch resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/user',
    name: 'User Schema',
    description: 'Field schema for user/author resources',
    mimeType: 'application/json'
  },
  {
    uri: 'bitbucket://schema/workspace',
    name: 'Workspace Schema',
    description: 'Field schema for workspace/project resources',
    mimeType: 'application/json'
  }
];

/**
 * 检查给定 URI 是否为已定义的静态资源
 */
export function isStaticResource(uri: string): boolean {
  return staticResources.some(resource => resource.uri === uri);
}

/**
 * 获取静态资源定义
 */
export function getStaticResource(uri: string): StaticResource | undefined {
  return staticResources.find(resource => resource.uri === uri);
}