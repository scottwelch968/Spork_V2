import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, isCosmoError, type CosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubFile {
  path: string;
  sha: string;
  type: 'blob' | 'tree';
  size?: number;
}

interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

async function githubRequest(
  endpoint: string,
  token: string,
  method: string = 'GET',
  body?: unknown
): Promise<Response> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Spork-Editor'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return response;
}

// Check rate limit and token validity
async function checkRateLimit(token: string): Promise<{
  valid: boolean;
  tokenType: string;
  rateLimit: RateLimitInfo | null;
  user: string | null;
  error: string | null;
}> {
  try {
    const response = await githubRequest('/rate_limit', token);
    
    if (!response.ok) {
      if (response.status === 401) {
        return {
          valid: false,
          tokenType: 'invalid',
          rateLimit: null,
          user: null,
          error: 'Invalid or expired token. Please generate a new Personal Access Token.'
        };
      }
      return {
        valid: false,
        tokenType: 'unknown',
        rateLimit: null,
        user: null,
        error: `GitHub API error: ${response.status}`
      };
    }

    const data = await response.json();
    const coreLimit = data.resources.core;
    
    // Determine token type based on rate limit
    let tokenType = 'unknown';
    if (coreLimit.limit === 60) {
      tokenType = 'unauthenticated';
    } else if (coreLimit.limit === 5000) {
      tokenType = 'authenticated';
    } else if (coreLimit.limit > 5000) {
      tokenType = 'github-app';
    }

    // Get user info
    let user = null;
    if (tokenType !== 'unauthenticated') {
      const userResponse = await githubRequest('/user', token);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        user = userData.login;
      }
    }

    return {
      valid: tokenType !== 'unauthenticated',
      tokenType,
      rateLimit: {
        limit: coreLimit.limit,
        remaining: coreLimit.remaining,
        reset: coreLimit.reset,
        used: coreLimit.used
      },
      user,
      error: tokenType === 'unauthenticated' 
        ? 'Token is being treated as unauthenticated (60 req/hr). Check token scopes - needs "repo" for private repos.'
        : null
    };
  } catch (error) {
    return {
      valid: false,
      tokenType: 'error',
      rateLimit: null,
      user: null,
      error: error instanceof Error ? error.message : 'Failed to validate token'
    };
  }
}

function parseRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  // Handle formats: https://github.com/owner/repo or owner/repo
  const match = repoUrl.match(/(?:github\.com\/)?([^\/]+)\/([^\/\.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace('.git', '') };
}

async function listFiles(
  repoUrl: string,
  token: string,
  branch: string = 'main'
): Promise<GitHubFile[]> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/trees/${branch}?recursive=1`,
    token
  );

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to list files: ${error}`);
  }

  const data = await response.json();
  return data.tree
    .filter((item: { type: string }) => item.type === 'blob')
    .map((item: { path: string; sha: string; type: string; size: number }) => ({
      path: item.path,
      sha: item.sha,
      type: item.type,
      size: item.size
    }));
}

async function getFileContent(
  repoUrl: string,
  token: string,
  path: string,
  branch: string = 'main'
): Promise<{ content: string; sha: string }> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/contents/${path}?ref=${branch}`,
    token
  );

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to get file: ${error}`);
  }

  const data = await response.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

// Batch fetch multiple files using GraphQL API (much more efficient - 1 request vs N requests)
async function getFilesBatch(
  repoUrl: string,
  token: string,
  paths: string[],
  branch: string = 'main',
  logger: ReturnType<typeof createLogger>
): Promise<{ path: string; content: string; sha: string }[]> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  if (paths.length === 0) return [];

  // Build GraphQL query to fetch multiple files at once
  const fileQueries = paths.map((path, index) => {
    const alias = `file${index}`;
    return `${alias}: object(expression: "${branch}:${path}") {
      ... on Blob {
        text
        oid
      }
    }`;
  }).join('\n');

  const query = `
    query {
      repository(owner: "${repo.owner}", name: "${repo.repo}") {
        ${fileQueries}
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Spork-Editor'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `GraphQL request failed: ${error}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    logger.warn('GraphQL errors', { errors: data.errors });
    throw createCosmoError('FUNCTION_FAILED', `GraphQL errors: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  const results: { path: string; content: string; sha: string }[] = [];
  const repoData = data.data?.repository;
  
  if (repoData) {
    paths.forEach((path, index) => {
      const fileData = repoData[`file${index}`];
      if (fileData?.text !== undefined && fileData?.oid) {
        results.push({
          path,
          content: fileData.text,
          sha: fileData.oid
        });
      }
    });
  }

  return results;
}

async function commitChanges(
  repoUrl: string,
  token: string,
  changes: FileChange[],
  message: string,
  branch: string = 'main'
): Promise<{ commitSha: string; message: string }> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  // 1. Get the latest commit SHA for the branch
  const refResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/ref/heads/${branch}`,
    token
  );
  
  if (!refResponse.ok) {
    throw createCosmoError('FUNCTION_FAILED', 'Failed to get branch reference');
  }
  
  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  // 2. Get the tree SHA from the latest commit
  const commitResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/commits/${latestCommitSha}`,
    token
  );
  
  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // 3. Create blobs for each file change
  const treeItems = await Promise.all(
    changes.map(async (change) => {
      if (change.action === 'delete') {
        return {
          path: change.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: null
        };
      }

      const blobResponse = await githubRequest(
        `/repos/${repo.owner}/${repo.repo}/git/blobs`,
        token,
        'POST',
        { content: change.content, encoding: 'utf-8' }
      );
      
      const blobData = await blobResponse.json();
      return {
        path: change.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha
      };
    })
  );

  // 4. Create a new tree
  const treeResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/trees`,
    token,
    'POST',
    { base_tree: baseTreeSha, tree: treeItems }
  );
  
  const treeData = await treeResponse.json();

  // 5. Create a new commit
  const newCommitResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/commits`,
    token,
    'POST',
    {
      message,
      tree: treeData.sha,
      parents: [latestCommitSha]
    }
  );
  
  const newCommitData = await newCommitResponse.json();

  // 6. Update the branch reference
  await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/refs/heads/${branch}`,
    token,
    'PATCH',
    { sha: newCommitData.sha }
  );

  return { commitSha: newCommitData.sha, message };
}

async function getHistory(
  repoUrl: string,
  token: string,
  branch: string = 'main',
  path?: string,
  limit: number = 30
): Promise<CommitInfo[]> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  let endpoint = `/repos/${repo.owner}/${repo.repo}/commits?sha=${branch}&per_page=${limit}`;
  if (path) {
    endpoint += `&path=${encodeURIComponent(path)}`;
  }

  const response = await githubRequest(endpoint, token);

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to get history: ${error}`);
  }

  const data = await response.json();
  return data.map((commit: {
    sha: string;
    commit: { message: string; author: { name: string; date: string } };
    html_url: string;
  }) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author.name,
    date: commit.commit.author.date,
    url: commit.html_url
  }));
}

async function listBranches(
  repoUrl: string,
  token: string
): Promise<{ name: string; sha: string; isDefault: boolean }[]> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  // Get default branch
  const repoResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}`,
    token
  );
  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch;

  // Get all branches
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/branches`,
    token
  );

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to list branches: ${error}`);
  }

  const data = await response.json();
  return data.map((branch: { name: string; commit: { sha: string } }) => ({
    name: branch.name,
    sha: branch.commit.sha,
    isDefault: branch.name === defaultBranch
  }));
}

async function createBranch(
  repoUrl: string,
  token: string,
  branchName: string,
  fromBranch: string = 'main'
): Promise<{ name: string; sha: string }> {
  const repo = parseRepoUrl(repoUrl);
  if (!repo) throw createCosmoError('INVALID_PAYLOAD', 'Invalid repository URL');

  // Get SHA of source branch
  const refResponse = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/ref/heads/${fromBranch}`,
    token
  );
  const refData = await refResponse.json();

  // Create new branch
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/git/refs`,
    token,
    'POST',
    {
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to create branch: ${error}`);
  }

  const data = await response.json();
  return { name: branchName, sha: data.object.sha };
}

async function createRepo(
  token: string,
  name: string,
  description: string = '',
  isPrivate: boolean = true
): Promise<{ url: string; defaultBranch: string }> {
  const response = await githubRequest(
    '/user/repos',
    token,
    'POST',
    {
      name,
      description,
      private: isPrivate,
      auto_init: true
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw createCosmoError('FUNCTION_FAILED', `Failed to create repository: ${error}`);
  }

  const data = await response.json();
  return { 
    url: data.html_url, 
    defaultBranch: data.default_branch 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('github-sync');
  logger.start();
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { action, repoUrl, token, branch, path, paths, changes, message, branchName, fromBranch, repoName, description, isPrivate, limit } = body;

    logger.info('Processing GitHub action', { action, repoUrl, branch, pathsCount: paths?.length });

    let result;

    switch (action) {
      case 'validate-token':
        result = await checkRateLimit(token);
        break;

      case 'list-files':
        result = await listFiles(repoUrl, token, branch);
        break;

      case 'get-file':
        result = await getFileContent(repoUrl, token, path, branch);
        break;

      case 'get-files-batch':
        result = await getFilesBatch(repoUrl, token, paths || [], branch, logger);
        break;

      case 'commit':
        result = await commitChanges(repoUrl, token, changes, message, branch);
        break;

      case 'history':
        result = await getHistory(repoUrl, token, branch, path, limit);
        break;

      case 'list-branches':
        result = await listBranches(repoUrl, token);
        break;

      case 'create-branch':
        result = await createBranch(repoUrl, token, branchName, fromBranch);
        break;

      case 'create-repo':
        result = await createRepo(token, repoName, description, isPrivate);
        break;

      default:
        throw createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    }

    logger.complete(Date.now() - startTime, { action });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
