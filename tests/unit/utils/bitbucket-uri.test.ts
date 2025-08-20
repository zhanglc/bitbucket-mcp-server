import { describe, it, expect } from '@jest/globals';
import { BitbucketURI } from '../../../src/utils/bitbucket-uri';

describe('BitbucketURI', () => {
  describe('constructor', () => {
    it('should parse a valid pull request URI', () => {
      const uri = new BitbucketURI('bitbucket://PROJ/my-repo/pr/123');
      
      expect(uri.workspace).toBe('PROJ');
      expect(uri.repo).toBe('my-repo');
      expect(uri.resourceType).toBe('pr');
      expect(uri.resourcePath).toBe('123');
    });

    it('should parse a file URI with path', () => {
      const uri = new BitbucketURI('bitbucket://PROJ/my-repo/file/src/index.ts');
      
      expect(uri.workspace).toBe('PROJ');
      expect(uri.repo).toBe('my-repo');
      expect(uri.resourceType).toBe('file');
      expect(uri.resourcePath).toBe('src/index.ts');
    });

    it('should parse URI with query parameters', () => {
      const uri = new BitbucketURI('bitbucket://PROJ/my-repo/pr/123?fields=id,title&format=minimal');
      
      expect(uri.workspace).toBe('PROJ');
      expect(uri.repo).toBe('my-repo');
      expect(uri.resourceType).toBe('pr');
      expect(uri.resourcePath).toBe('123');
      expect(uri.params.fields).toBe('id,title');
      expect(uri.params.format).toBe('minimal');
    });

    it('should throw error for invalid URI format', () => {
      expect(() => {
        new BitbucketURI('invalid://uri');
      }).toThrow('Invalid URI scheme');
    });
  });

  describe('schema URIs', () => {
    it('should handle schema URIs correctly', () => {
      const uri = new BitbucketURI('bitbucket://schema/index');
      
      expect(uri.workspace).toBeUndefined();
      expect(uri.repo).toBeUndefined();
      expect(uri.resourceType).toBe('schema');
      expect(uri.resourcePath).toBe('index');
    });
  });

  describe('query parameters', () => {
    it('should parse query parameters correctly', () => {
      const uri = new BitbucketURI('bitbucket://PROJ/repo/pr/123?fields=id,title&limit=10');
      
      expect(uri.params.fields).toBe('id,title');
      expect(uri.params.limit).toBe('10');
    });
  });
});