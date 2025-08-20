// Global test setup
import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables from .env file for tests
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Global timeout for all tests (increased for integration tests)
jest.setTimeout(30000);

// Mock console.error to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};