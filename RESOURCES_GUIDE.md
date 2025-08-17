# Bitbucket MCP Server - Resources Guide

This guide explains how to use the new MCP resources feature alongside existing tools in the Bitbucket MCP Server.

## What are Resources?

Resources provide a URI-based way to access Bitbucket data that's more intuitive than tools. Instead of calling a tool with parameters, you can reference data using URIs like `bitbucket://workspace/repo/file/path/to/file.js`.

## Available Resources

### File Resources

#### Single File Content
```
URI: bitbucket://{workspace}/{repo}/file/{path}
Parameters:
  - ref: Branch or commit (optional, defaults to main/master)
  - start_line: Starting line number for partial content (optional)  
  - line_count: Number of lines to retrieve (optional)
  - full_content: Force retrieval of large files (optional)

Example: bitbucket://myworkspace/myrepo/file/src/components/Button.tsx?ref=feature-branch&start_line=10&line_count=20
```

#### Directory Listing
```
URI: bitbucket://{workspace}/{repo}/dir/{path}
Parameters:
  - ref: Branch or commit (optional, defaults to main/master)
  - path: Directory path (optional, omit for root directory)

Example: bitbucket://myworkspace/myrepo/dir/src/components?ref=main
Example: bitbucket://myworkspace/myrepo/dir (root directory)
```

### Pull Request Resources

#### Pull Request Details
```
URI: bitbucket://{workspace}/{repo}/pr/{id}
Parameters:
  - include_comments: Include PR comments in response (optional)
  - include_commits: Include commit list in response (optional)

Example: bitbucket://myworkspace/myrepo/pr/123?include_comments=true
```

#### Pull Request List
```
URI: bitbucket://{workspace}/{repo}/prs
Parameters:
  - state: Filter by PR state (OPEN|MERGED|DECLINED|ALL, default: OPEN)
  - author: Filter by author username/email (optional)
  - reviewer: Filter by reviewer username/email (optional) 
  - limit: Maximum number of PRs to return (optional, default 25)
  - start: Start index for pagination (optional, default 0)
  - sort: Sort order (updated|created|activity, optional)

Example: bitbucket://myworkspace/myrepo/prs?state=OPEN&author=john.smith&limit=10
Example: bitbucket://myworkspace/myrepo/prs?state=MERGED&reviewer=code.reviewer&start=20&limit=10
```

#### Pull Request Diff
```
URI: bitbucket://{workspace}/{repo}/pr/{id}/diff
Parameters:
  - context: Context lines (default 3)
  - include: Comma-separated glob patterns to include (future)
  - exclude: Comma-separated glob patterns to exclude (future)
  - mode: Diff output format (structured|patch|raw)

Example: bitbucket://myworkspace/myrepo/pr/123/diff?context=5&mode=structured
```

#### Single File Diff
```
URI: bitbucket://{workspace}/{repo}/pr/{id}/diff/{filePath}
Parameters:
  - context: Number of context lines around changes
  - mode: Diff output format (structured|patch|raw)

Example: bitbucket://myworkspace/myrepo/pr/123/diff/src/components/Button.tsx?context=3
```

#### Pull Request Commits
```
URI: bitbucket://{workspace}/{repo}/pr/{id}/commits
Parameters:
  - start: Pagination start offset (optional)
  - limit: Maximum number of commits to return (optional)
  - include_changes: Include file changes for each commit (optional)

Example: bitbucket://myworkspace/myrepo/pr/123/commits?limit=10
```

### Branch Resources

#### List All Branches
```
URI: bitbucket://{workspace}/{repo}/branches
Parameters:
  - filter: Filter branches by name pattern (optional)
  - limit: Maximum number of branches to return (optional)
  - start: Pagination start offset (optional)

Example: bitbucket://myworkspace/myrepo/branches?filter=feature*&limit=20
```

#### Single Branch Details
```
URI: bitbucket://{workspace}/{repo}/branch/{name}
Parameters:
  - include_commits: Include recent commits (optional)
  - commit_limit: Limit for recent commits (optional, default 10)

Example: bitbucket://myworkspace/myrepo/branch/feature-new-ui?include_commits=true
```

### Search Resources

#### Code Search
```
URI: bitbucket://{workspace}/{repo}/search
Parameters:
  - query: Search query string (required)
  - file_extensions: Comma-separated file extensions to search (optional)
  - include_paths: Comma-separated path patterns to include (optional)
  - exclude_paths: Comma-separated path patterns to exclude (optional)
  - limit: Maximum number of results (optional, default 25)

Example: bitbucket://myworkspace/myrepo/search?query=function%20parseUrl&file_extensions=ts,js&limit=10
```

## Resource vs Tools Comparison

### Using Tools (Traditional Approach)
```json
{
  "tool": "get_file_content",
  "arguments": {
    "workspace": "myworkspace",
    "repository": "myrepo", 
    "file_path": "src/components/Button.tsx",
    "branch": "main"
  }
}
```

### Using Resources (New Approach)
```
URI: bitbucket://myworkspace/myrepo/file/src/components/Button.tsx?ref=main
```

## Benefits of Resources

1. **Intuitive URIs**: More natural way to reference Bitbucket data
2. **Parameterized Access**: Use query parameters for filtering and options
3. **Cacheable**: Resources can be cached by MCP clients
4. **Discoverable**: Resource templates make available data discoverable
5. **Backwards Compatible**: Tools are still available alongside resources

## Migration Guide

### For AI Agents
- Start using resource URIs instead of tool calls where possible
- Resources are especially useful for:
  - Reading file content
  - Getting directory listings  
  - Accessing PR diffs and metadata
  - Searching code

### For Developers
- Current tools remain available and fully functional
- Resources provide an alternative access pattern
- Mix and match resources and tools as needed
- Resources are read-only; use tools for write operations (create PR, add comments, etc.)

## Limitations

1. **Read-Only**: Resources are for data retrieval only. Use tools for write operations.
2. **URI Complexity**: Complex filters may be better suited for tools with structured parameters.
3. **Error Handling**: Resources return error responses rather than throwing exceptions.

## Examples in Practice

### Reading a Configuration File
```
Resource: bitbucket://myteam/backend-api/file/config/database.yml?ref=production
Tool Equivalent: get_file_content with workspace=myteam, repository=backend-api, file_path=config/database.yml, branch=production
```

### Getting PR Diff for Review
```
Resource: bitbucket://myteam/frontend/pr/456/diff?mode=structured&context=5
Tool Equivalent: get_pull_request_diff with workspace=myteam, repository=frontend, pull_request_id=456, mode=structured, context=5
```

### Listing Open Pull Requests
```
Resource: bitbucket://myteam/backend-api/prs?state=OPEN&reviewer=senior.dev&limit=20
Tool Equivalent: list_pull_requests with workspace=myteam, repository=backend-api, state=OPEN, reviewer=senior.dev, limit=20
```

### Getting Merged PRs by Author
```
Resource: bitbucket://myteam/frontend/prs?state=MERGED&author=john.smith&start=0&limit=50
Tool Equivalent: list_pull_requests with workspace=myteam, repository=frontend, state=MERGED, author=john.smith, start=0, limit=50
```

### Searching for Security Issues
```
Resource: bitbucket://myteam/api/search?query=password%20hardcoded&file_extensions=js,ts,py&exclude_paths=test/*
Tool Equivalent: search_code with workspace=myteam, repository=api, search_query="password hardcoded", file_extensions="js,ts,py", exclude_paths="test/*"
```
