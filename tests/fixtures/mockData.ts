// Mock data for tests
export const mockPullRequest = {
  id: 123,
  title: 'Test Pull Request',
  description: 'Test description',
  state: 'OPEN',
  author: {
    display_name: 'Test User',
    uuid: '{test-uuid}',
    account_id: 'test-account-id',
  },
  source: {
    branch: {
      name: 'feature/test-branch',
    },
    repository: {
      full_name: 'test-workspace/test-repo',
    },
  },
  destination: {
    branch: {
      name: 'main',
    },
    repository: {
      full_name: 'test-workspace/test-repo',
    },
  },
  reviewers: [],
  participants: [],
  links: {
    self: { href: 'https://api.bitbucket.org/2.0/repositories/test/repo/pullrequests/123' },
    html: { href: 'https://bitbucket.org/test/repo/pull-requests/123' },
    diff: { href: 'https://api.bitbucket.org/2.0/repositories/test/repo/pullrequests/123/diff' },
  },
  close_source_branch: false,
  created_on: '2025-01-21T10:00:00Z',
  updated_on: '2025-01-21T10:00:00Z',
};

export const mockBranch = {
  name: 'feature/test-branch',
  target: {
    hash: 'abc123def456',
    author: {
      user: {
        display_name: 'Test User',
      },
    },
    date: '2025-01-21T10:00:00Z',
    message: 'Test commit message',
  },
};

export const mockCommit = {
  hash: 'abc123def456',
  message: 'Test commit message',
  author: {
    user: {
      display_name: 'Test User',
      email_address: 'test@example.com',
    },
  },
  date: '2025-01-21T10:00:00Z',
  parents: [
    {
      hash: 'parent123456',
    },
  ],
};

export const mockFile = {
  path: 'src/test.ts',
  type: 'commit_file',
  size: 1024,
  commit: {
    hash: 'abc123def456',
  },
};