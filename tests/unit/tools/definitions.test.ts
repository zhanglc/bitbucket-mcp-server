import { describe, it, expect } from '@jest/globals';
import { toolDefinitions } from '../../../src/tools/definitions';

describe('Tool Definitions', () => {
  it('should have all required tools defined', () => {
    const toolNames = toolDefinitions.map(tool => tool.name);
    
    const expectedTools = [
      'get_pull_request',
      'list_pull_requests',
      'create_pull_request',
      'update_pull_request',
      'add_comment',
      'merge_pull_request',
      'list_branches',
      'delete_branch',
      'get_pull_request_diff',
      'approve_pull_request',
      'unapprove_pull_request',
      'request_changes',
      'remove_requested_changes',
      'get_branch',
      'list_directory_content',
      'get_file_content',
      'list_branch_commits',
      'list_pr_commits',
      'search_code',
    ];

    expectedTools.forEach(toolName => {
      expect(toolNames).toContain(toolName);
    });
  });

  it('should have valid input schemas for all tools', () => {
    toolDefinitions.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
      expect(tool.inputSchema.required).toBeDefined();
      expect(Array.isArray(tool.inputSchema.required)).toBe(true);
    });
  });

  it('should have workspace and repository as required fields for repository tools', () => {
    const repositoryTools = toolDefinitions.filter(tool => 
      !tool.name.startsWith('search_') || tool.name === 'search_code'
    );

    repositoryTools.forEach(tool => {
      if (tool.name !== 'search_code') { // search_code has different requirements
        expect(tool.inputSchema.required).toContain('workspace');
        expect(tool.inputSchema.required).toContain('repository');
      }
    });
  });

  it('should have proper enum values for state parameters', () => {
    const listPRTool = toolDefinitions.find(tool => tool.name === 'list_pull_requests');
    expect(listPRTool?.inputSchema.properties.state).toBeDefined();
    expect((listPRTool?.inputSchema.properties.state as any).enum).toEqual(['OPEN', 'MERGED', 'DECLINED', 'ALL']);
  });

  it('should have proper enum values for merge strategy', () => {
    const mergeTool = toolDefinitions.find(tool => tool.name === 'merge_pull_request');
    expect(mergeTool?.inputSchema.properties.merge_strategy).toBeDefined();
    expect((mergeTool?.inputSchema.properties.merge_strategy as any).enum).toEqual(['merge-commit', 'squash', 'fast-forward']);
  });
});