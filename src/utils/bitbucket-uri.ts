import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

/**
 * Bitbucket URI parser and handler
 * Supports both formats:
 * - bitbucket://workspace/repo/resourceType/...?params
 * - bitbucket:workspace/repo/resourceType/...?params
 */
export class BitbucketURI {
  public readonly original: string;
  public readonly url: URL;
  public readonly scheme: string;
  public readonly workspace?: string;
  public readonly repo?: string;
  public readonly resourceType: string;
  public readonly resourcePath?: string;
  public readonly params: Record<string, string>;

  constructor(uriString: string) {
    this.original = uriString;
    this.url = new URL(uriString);
    this.scheme = this.url.protocol;
    
    // Validate scheme
    if (this.url.protocol !== 'bitbucket:') {
      throw new McpError(ErrorCode.InvalidParams, `Invalid URI scheme: ${this.url.protocol}`);
    }

    const parseResult = this._parseComponents();
    this.workspace = parseResult.workspace;
    this.repo = parseResult.repo;
    this.resourceType = parseResult.resourceType;
    this.resourcePath = parseResult.resourcePath;
    this.params = parseResult.params;
  }

  private _parseComponents() {
    let workspace: string | undefined;
    let repo: string | undefined;
    let resourceType: string;
    let resourcePath: string | undefined;

    if (this.url.hostname) {
      // Format: bitbucket://workspace/repo/resourceType/...
      workspace = this.url.hostname;
      const pathParts = this.url.pathname.split('/').filter(p => p);
      
      // Special handling for schema URIs: bitbucket://schema/...
      if (workspace === 'schema') {
        return {
          workspace: undefined,
          repo: undefined,
          resourceType: 'schema',
          resourcePath: pathParts.join('/'),
          params: Object.fromEntries(this.url.searchParams.entries())
        };
      }
      
      if (pathParts.length < 2) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid URI format: ${this.original}. Expected bitbucket://workspace/repo/resourceType`);
      }
      
      const [repoName, resourceTypeName, ...remainingParts] = pathParts;
      repo = repoName;
      resourceType = resourceTypeName;
      resourcePath = remainingParts.length > 0 ? remainingParts.join('/') : undefined;
    } else {
      // Legacy format: bitbucket:workspace/repo/resourceType/...
      const pathParts = this.url.pathname.split('/').filter(p => p);
      
      // Special handling for schema URIs: bitbucket:schema/...
      if (pathParts.length >= 1 && pathParts[0] === 'schema') {
        return {
          workspace: undefined,
          repo: undefined,
          resourceType: 'schema',
          resourcePath: pathParts.slice(1).join('/'),
          params: Object.fromEntries(this.url.searchParams.entries())
        };
      }
      
      if (pathParts.length < 3) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid URI format: ${this.original}. Expected bitbucket:workspace/repo/resourceType or bitbucket://workspace/repo/resourceType`);
      }

      const [workspaceName, repoName, resourceTypeName, ...remainingParts] = pathParts;
      workspace = workspaceName;
      repo = repoName;
      resourceType = resourceTypeName;
      resourcePath = remainingParts.length > 0 ? remainingParts.join('/') : undefined;
    }

    return {
      workspace,
      repo,
      resourceType,
      resourcePath,
      params: Object.fromEntries(this.url.searchParams.entries())
    };
  }

  /**
   * Check if this is a schema URI
   */
  isSchemaUri(): boolean {
    return this.resourceType === 'schema';
  }

  /**
   * Check if this is a repository resource URI
   */
  isRepositoryUri(): boolean {
    return !this.isSchemaUri() && !!this.workspace && !!this.repo;
  }

  /**
   * Get parameter value by key
   */
  getParam(key: string): string | undefined {
    return this.params[key];
  }

  /**
   * Get parameter value as number
   */
  getParamAsNumber(key: string): number | undefined {
    const value = this.params[key];
    return value ? parseInt(value) : undefined;
  }

  /**
   * Get parameter value as boolean
   */
  getParamAsBoolean(key: string): boolean | undefined {
    const value = this.params[key];
    return value ? value === 'true' : undefined;
  }

  /**
   * Convert to plain object for debugging/logging
   */
  toJSON() {
    return {
      original: this.original,
      scheme: this.scheme,
      workspace: this.workspace,
      repo: this.repo,
      resourceType: this.resourceType,
      resourcePath: this.resourcePath,
      params: this.params
    };
  }

  toString(): string {
    return this.original;
  }
}
