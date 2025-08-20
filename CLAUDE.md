# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

- `npm run build` - Compile TypeScript to JavaScript and make the built index.js executable
- `npm run dev` - Watch mode for development (TypeScript compilation with --watch)
- `npm start` - Run the built server from `build/index.js`
- `npm install` - Install dependencies

## Testing Commands

- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run only unit tests (tests/unit/)
- `npm run test:integration` - Run only integration tests (tests/integration/)

## Architecture Overview

This is a **Model Context Protocol (MCP) server** that provides tools and resources for interacting with Bitbucket APIs. It supports both **Bitbucket Cloud** and **Bitbucket Server** (on-premise).

### Core Components

**Main Server (`src/index.ts`)**
- Entry point that initializes the MCP server
- Sets up API client based on environment variables
- Routes tool calls to appropriate handlers
- Implements resource system with URI-based access

**Handler Architecture (`src/handlers/`)**
- `PullRequestHandlers` - PR lifecycle (create, update, merge, comments)
- `BranchHandlers` - Branch management and commit listing  
- `ReviewHandlers` - Code review actions (approve, request changes, diffs)
- `FileHandlers` - File and directory operations
- `SearchHandlers` - Code search across repositories

**API Client (`src/utils/api-client.ts`)**
- Unified client that handles both Bitbucket Cloud and Server APIs
- Automatic authentication (App Password for Cloud, HTTP Token for Server)
- Base URL detection for server mode vs cloud mode

**Resources System (`src/resources/`)**
- Schema-based resource discovery via URI patterns
- Field filtering capabilities for responses
- Template-based resource definitions

### Authentication Modes

**Bitbucket Cloud:**
- `BITBUCKET_USERNAME` - Bitbucket username
- `BITBUCKET_APP_PASSWORD` - App password with Repositories and Pull requests permissions
- `BITBUCKET_BASE_URL` defaults to `https://api.bitbucket.org/2.0`

**Bitbucket Server:**
- `BITBUCKET_USERNAME` - Full email address (e.g., user@company.com)
- `BITBUCKET_TOKEN` - HTTP Access Token
- `BITBUCKET_BASE_URL` - Server URL (e.g., https://bitbucket.company.com)

### Tool Categories

1. **Pull Request Tools** - Complete PR lifecycle management
2. **Branch Tools** - Branch operations and commit history
3. **Review Tools** - Code review workflow (diffs, approvals)
4. **File Tools** - Repository file and directory access
5. **Search Tools** - Code search (Server only currently)

### Resource URIs

The server provides URI-based resource access:
- `bitbucket://{workspace}/{repo}/file/{path}` - File content
- `bitbucket://{workspace}/{repo}/pr/{id}` - Pull request details
- `bitbucket://{workspace}/{repo}/branches` - Branch listing
- `bitbucket://schema/index` - Resource type discovery

### Key Features

- **Smart Comment System** - Supports code snippet-based line detection for PR comments
- **Field Filtering** - All resources support `?fields=` parameter for response filtering  
- **Diff Filtering** - PR diffs support include/exclude patterns via glob matching
- **File Truncation** - Large files automatically truncated with configurable limits
- **Dual API Support** - Single codebase handles both Cloud and Server API differences

## Testing Framework

**Framework**: Jest with TypeScript support via ts-jest
**Structure**: 
- `tests/unit/` - Unit tests for utilities and individual functions
- `tests/integration/` - Integration tests for handlers and API client
- `tests/fixtures/` - Mock data and test fixtures
- `jest.config.js` - Jest configuration with ES modules support

**Key Test Files**:
- `tests/unit/utils/formatters.test.ts` - Response formatting functions
- `tests/unit/utils/bitbucket-uri.test.ts` - URI parsing and validation  
- `tests/unit/tools/definitions.test.ts` - Tool schema validation
- `tests/integration/api-client.test.ts` - API client configuration

## Development Notes

- TypeScript compilation outputs to `build/` directory
- Uses ES modules with Node16 module resolution
- Handler classes are instantiated once and reused for all requests
- Environment variables determine API mode and authentication method
- Test framework configured with Jest, TypeScript support, and automatic mocking
- Mock environment variables are set in `tests/setup.ts` for consistent testing