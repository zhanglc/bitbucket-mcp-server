# Resource Field Filtering Guide

This guide demonstrates how to use field-level filtering with Bitbucket MCP Server resources to return only specific fields in responses.

## Overview

All Bitbucket MCP Server resources support field-level filtering through URI query parameters:

- `fields`: Comma-separated list of fields to include
- `exclude`: Comma-separated list of fields to exclude  
- `format`: Predefined response format (full, minimal, summary, metadata)

## Parameter Details

### `fields` Parameter
Specify exactly which fields to include in the response using dot notation for nested fields and wildcards for arrays.

Examples:
- `fields=id,title,state` - Include only basic fields
- `fields=author.display_name,source.branch.name` - Include nested fields
- `fields=reviewers.*.display_name` - Include specific field from all array elements
- `fields=reviewers.0.display_name` - Include field from specific array element

### `exclude` Parameter  
Specify which fields to remove from the response.

Examples:
- `exclude=description,comments` - Remove these top-level fields
- `exclude=author.uuid,reviewers.*.uuid` - Remove nested and array fields

### `format` Parameter
Use predefined response formats:

- `full` (default): Complete response with all fields
- `minimal`: Only essential identifying fields
- `summary`: Core fields without verbose details
- `metadata`: Only metadata fields (timestamps, IDs, etc.)

## Usage Examples

### Basic Field Selection
```
bitbucket://workspace/repo/pr/123?fields=id,title,state,author.display_name
```
Returns only PR ID, title, state, and author name.

### Minimal Pull Request Info
```
bitbucket://workspace/repo/pr/123?format=minimal
```
Returns: pull_request_id, id, title, state, author.display_name, created_on, updated_on

### Summary with Custom Fields
```
bitbucket://workspace/repo/pr/123?format=summary&exclude=description
```
Returns summary format but excludes the description field.

### Reviewer Information Only
```
bitbucket://workspace/repo/pr/123?fields=reviewers.*.display_name,reviewers.*.approved
```
Returns only reviewer names and approval status.

### File Listing with Size Info
```
bitbucket://workspace/repo/dir/src?fields=path,total_items,contents.*.name,contents.*.size
```
Returns directory path, item count, and name/size for each file.

### Branch Information
```
bitbucket://workspace/repo/branches?fields=name,target.hash&format=minimal
```
Returns branch names and commit hashes only.

## Resource-Specific Examples

### Pull Request Resources

#### Full PR with Comments Excluded
```
bitbucket://workspace/repo/pr/123?exclude=comments,activity
```

#### PR Metadata Only
```
bitbucket://workspace/repo/pr/123?format=metadata
```

#### PR Diff with File Names Only
```
bitbucket://workspace/repo/pr/123/diff?fields=files.*.path,stats
```

### File Resources

#### File Content with Metadata
```
bitbucket://workspace/repo/file/src/index.js?fields=path,content,size,mimeType
```

#### Directory Listing (Names Only)
```
bitbucket://workspace/repo/dir/?fields=contents.*.name,contents.*.type
```

### Search Resources

#### Search Results (Paths Only)
```
bitbucket://workspace/repo/search?query=function&fields=results.*.path,results.*.line
```

### Branch Resources

#### Branch List (Names Only)
```
bitbucket://workspace/repo/branches?fields=name
```

#### Specific Branch with Commit Info
```
bitbucket://workspace/repo/branch/main?fields=name,target.hash,target.message
```

## Combining Parameters

You can combine multiple filtering parameters:

```
bitbucket://workspace/repo/prs?state=OPEN&format=summary&exclude=description&fields=id,title,author.display_name,reviewers.*.display_name
```

This returns:
1. Only open PRs (`state=OPEN`)
2. In summary format (`format=summary`) 
3. Without description field (`exclude=description`)
4. With only specified fields (`fields=...`)

## Advanced Patterns

### Array Index Targeting
```
fields=reviewers.0.display_name,reviewers.1.display_name
```
Gets display names of first two reviewers.

### Mixed Field Selection
```
fields=id,title,reviewers.*.display_name,source.branch.name
```
Combines scalar fields, array wildcards, and nested fields.

### Nested Object Filtering
```
fields=author.display_name,author.links.avatar.href
```
Extracts deeply nested fields while preserving structure.

## Format Behaviors

### Minimal Format Fields by Resource Type

- **Pull Requests**: pull_request_id, id, title, state, author.display_name, created_on, updated_on
- **Files**: path, name, type, size, total_items  
- **Branches**: name, target.hash, type, heads
- **Commits**: hash, message, author.display_name, date

### Summary Format Fields by Resource Type

- **Pull Requests**: + description, reviewers, source.branch.name, destination.branch.name
- **Files**: + branch, contents, mimeType
- **Branches**: + target, heads
- **Commits**: + author, parents

### Metadata Format Fields

Includes: id, name, title, description, state, status, type, created_on, updated_on, author.display_name, author.uuid, size, mimeType, branch, hash, pull_request_id

## Performance Benefits

Field filtering reduces:
- Response payload size
- Network transfer time  
- Client-side processing overhead
- Memory usage

Use minimal fields when you only need specific data for UI display or processing.
