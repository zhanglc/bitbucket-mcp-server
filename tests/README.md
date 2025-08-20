# Test Documentation

This directory contains the test suite for the Bitbucket MCP Server.

## Test Structure

```
tests/
├── fixtures/          # Mock data and test fixtures
├── integration/        # Integration tests (API client, handlers)
├── unit/              # Unit tests (utilities, formatters)
├── setup.ts           # Global test setup
└── README.md          # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)
Test individual functions and utilities in isolation:
- `utils/formatters.test.ts` - Response formatting functions
- `tools/definitions.test.ts` - Tool schema validation

### Integration Tests (`tests/integration/`)
Test interactions between components:
- `api-client.test.ts` - API client configuration and URL building

### Fixtures (`tests/fixtures/`)
Mock data for consistent testing:
- `mockData.ts` - Sample Bitbucket API responses

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Test Environment

- **Framework**: Jest with TypeScript support
- **Environment**: Node.js test environment
- **Mocking**: Automatic mocking of external dependencies (axios, etc.)
- **Coverage**: Configured to collect coverage from `src/` directory

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '../../../src/utils/module.js';

describe('Module Name', () => {
  it('should do something specific', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example
```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ClassToTest } from '../../src/class.js';

jest.mock('external-dependency');

describe('Class Integration', () => {
  let instance: ClassToTest;

  beforeEach(() => {
    jest.clearAllMocks();
    instance = new ClassToTest();
  });

  it('should integrate with dependencies', () => {
    // Test implementation
  });
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Focus on testing:
1. Critical business logic
2. Error handling paths
3. API integration points
4. Data transformation functions

## Continuous Integration

Tests are designed to run in CI environments with:
- No external dependencies required
- Consistent mock data
- Deterministic test outcomes
- Fast execution times