import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BitbucketApiClient } from '../../src/utils/api-client';

// Mock axios
jest.mock('axios');

describe('BitbucketApiClient Integration', () => {
  let apiClient: BitbucketApiClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create API client for testing
    apiClient = new BitbucketApiClient(
      'https://api.bitbucket.org/2.0',
      'test-user',
      'test-password'
    );
  });

  describe('initialization', () => {
    it('should initialize with Cloud settings', () => {
      const cloudClient = new BitbucketApiClient(
        'https://api.bitbucket.org/2.0',
        'test-user',
        'test-password'
      );
      
      expect(cloudClient.getIsServer()).toBe(false);
    });

    it('should initialize with Server settings', () => {
      const serverClient = new BitbucketApiClient(
        'https://bitbucket.company.com',
        'test@company.com',
        undefined,
        'server-token'
      );
      
      expect(serverClient.getIsServer()).toBe(true);
    });
  });

  describe('API client properties', () => {
    it('should be an instance of BitbucketApiClient', () => {
      expect(apiClient).toBeInstanceOf(BitbucketApiClient);
    });

    it('should have the correct server detection', () => {
      const cloudClient = new BitbucketApiClient(
        'https://api.bitbucket.org/2.0',
        'test-user',
        'test-password'
      );
      expect(cloudClient.getIsServer()).toBe(false);

      const serverClient = new BitbucketApiClient(
        'https://bitbucket.company.com',
        'test@company.com',
        undefined,
        'server-token'
      );
      expect(serverClient.getIsServer()).toBe(true);
    });
  });

  describe('authentication configuration', () => {
    it('should require either password or token', () => {
      // This should work with password
      expect(() => {
        new BitbucketApiClient(
          'https://api.bitbucket.org/2.0',
          'test-user',
          'test-password'
        );
      }).not.toThrow();

      // This should work with token
      expect(() => {
        new BitbucketApiClient(
          'https://bitbucket.company.com',
          'test@company.com',
          undefined,
          'server-token'
        );
      }).not.toThrow();
    });
  });
});