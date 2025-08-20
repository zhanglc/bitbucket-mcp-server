// Global test setup
import { jest } from '@jest/globals';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.BITBUCKET_USERNAME = 'test-user';
process.env.BITBUCKET_APP_PASSWORD = 'test-password';
process.env.BITBUCKET_BASE_URL = 'https://api.bitbucket.org/2.0';

// Global timeout for all tests
jest.setTimeout(10000);

// Mock console.error to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};