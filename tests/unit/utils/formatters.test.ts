import { describe, it, expect } from '@jest/globals';
import { formatServerResponse, formatCloudResponse } from '../../../src/utils/formatters';

describe('Formatters Utils', () => {
  describe('formatCloudResponse', () => {
    it('should export formatCloudResponse function', () => {
      expect(typeof formatCloudResponse).toBe('function');
    });
  });

  describe('formatServerResponse', () => {
    it('should export formatServerResponse function', () => {
      expect(typeof formatServerResponse).toBe('function');
    });
  });
});