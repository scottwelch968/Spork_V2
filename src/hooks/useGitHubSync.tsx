import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SporkProject } from '@/types/sporkProject';
import { useRef, useCallback } from 'react';

export interface GitHubFile {
  path: string;
  sha: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
  isDefault: boolean;
}

export interface TokenValidation {
  valid: boolean;
  tokenType: string;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  } | null;
  user: string | null;
  error: string | null;
}

export interface RateLimitStatus {
  remaining: number;
  limit: number;
  resetTime: Date;
  isLow: boolean; // < 100 remaining
}

function isGitHubConnected(project: SporkProject | null): boolean {
  return !!(project?.github_repo_url && project?.github_token);
}

async function callGitHubSync(action: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('github-sync', {
    body: { action, ...params }
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

// Cache for file contents to avoid refetching unchanged files
const fileContentCache = new Map<string, { content: string; sha: string }>();

export function useGitHubSync(project: SporkProject | null) {
  const queryClient = useQueryClient();
  const isConnected = isGitHubConnected(project);
  const branch = project?.current_branch || project?.github_branch || 'main';
  
  // Rate limit tracking
  const rateLimitRef = useRef<RateLimitStatus | null>(null);

  // Generate cache key for a file
  const getCacheKey = useCallback((path: string) => {
    return `${project?.id}:${branch}:${path}`;
  }, [project?.id, branch]);

  // Fetch file tree from GitHub - aggressive caching
  const { data: files, isLoading: isLoadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['github-files', project?.id, branch],
    queryFn: async (): Promise<GitHubFile[]> => {
      if (!project?.github_repo_url || !project?.github_token) return [];
      
      // Check rate limit before making request
      if (rateLimitRef.current?.isLow) {
        console.warn('Rate limit low, using cached data if available');
      }
      
      return callGitHubSync('list-files', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch
      });
    },
    enabled: isConnected,
    staleTime: 5 * 60 * 1000, // 5 minutes - aggressive caching
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  // Fetch single file content with caching
  const fetchFileContent = useMutation({
    mutationFn: async ({ path }: { path: string }): Promise<{ content: string; sha: string }> => {
      if (!project?.github_repo_url || !project?.github_token) {
        throw new Error('GitHub not connected');
      }

      // Check cache first
      const cacheKey = getCacheKey(path);
      const cached = fileContentCache.get(cacheKey);
      
      // Find file in current file list to check SHA
      const fileInfo = files?.find(f => f.path === path);
      if (cached && fileInfo && cached.sha === fileInfo.sha) {
        console.log(`Cache hit for ${path}`);
        return cached;
      }

      const result = await callGitHubSync('get-file', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch,
        path
      });

      // Update cache
      fileContentCache.set(cacheKey, result);
      return result;
    }
  });

  // Batch fetch multiple files - uses GraphQL API (1 request instead of N)
  const fetchFilesBatch = useMutation({
    mutationFn: async ({ paths }: { paths: string[] }): Promise<{ path: string; content: string; sha: string }[]> => {
      if (!project?.github_repo_url || !project?.github_token) {
        throw new Error('GitHub not connected');
      }

      if (paths.length === 0) return [];

      // Check which files are already cached and still valid
      const uncachedPaths: string[] = [];
      const cachedResults: { path: string; content: string; sha: string }[] = [];

      for (const path of paths) {
        const cacheKey = getCacheKey(path);
        const cached = fileContentCache.get(cacheKey);
        const fileInfo = files?.find(f => f.path === path);
        
        if (cached && fileInfo && cached.sha === fileInfo.sha) {
          cachedResults.push({ path, content: cached.content, sha: cached.sha });
        } else {
          uncachedPaths.push(path);
        }
      }

      console.log(`Batch fetch: ${cachedResults.length} cached, ${uncachedPaths.length} to fetch`);

      if (uncachedPaths.length === 0) {
        return cachedResults;
      }

      // Batch fetch uncached files using GraphQL API
      const results = await callGitHubSync('get-files-batch', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch,
        paths: uncachedPaths
      });

      // Update cache with new results
      for (const file of results) {
        const cacheKey = getCacheKey(file.path);
        fileContentCache.set(cacheKey, { content: file.content, sha: file.sha });
      }

      return [...cachedResults, ...results];
    }
  });

  // Commit changes to GitHub
  const commitChanges = useMutation({
    mutationFn: async ({ 
      changes, 
      message 
    }: { 
      changes: FileChange[]; 
      message: string;
    }): Promise<{ commitSha: string; message: string }> => {
      if (!project?.github_repo_url || !project?.github_token) {
        throw new Error('GitHub not connected');
      }

      return callGitHubSync('commit', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch,
        changes,
        message
      });
    },
    onSuccess: () => {
      // Clear file content cache on commit since SHAs will change
      fileContentCache.clear();
      queryClient.invalidateQueries({ queryKey: ['github-files', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['github-history', project?.id] });
      toast.success('Changes committed to GitHub');
    },
    onError: (error) => {
      toast.error('Failed to commit: ' + error.message);
    }
  });

  // Get commit history - aggressive caching
  const { data: history, isLoading: isLoadingHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['github-history', project?.id, branch],
    queryFn: async (): Promise<CommitInfo[]> => {
      if (!project?.github_repo_url || !project?.github_token) return [];

      return callGitHubSync('history', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch,
        limit: 50
      });
    },
    enabled: isConnected,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  // Get file-specific history
  const getFileHistory = useMutation({
    mutationFn: async ({ path }: { path: string }): Promise<CommitInfo[]> => {
      if (!project?.github_repo_url || !project?.github_token) {
        throw new Error('GitHub not connected');
      }

      return callGitHubSync('history', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branch,
        path,
        limit: 30
      });
    }
  });

  // List branches - aggressive caching
  const { data: branches, isLoading: isLoadingBranches, refetch: refetchBranches } = useQuery({
    queryKey: ['github-branches', project?.id],
    queryFn: async (): Promise<GitHubBranch[]> => {
      if (!project?.github_repo_url || !project?.github_token) return [];

      return callGitHubSync('list-branches', {
        repoUrl: project.github_repo_url,
        token: project.github_token
      });
    },
    enabled: isConnected,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });

  // Create new branch
  const createBranch = useMutation({
    mutationFn: async ({ 
      branchName, 
      fromBranch 
    }: { 
      branchName: string; 
      fromBranch?: string;
    }): Promise<{ name: string; sha: string }> => {
      if (!project?.github_repo_url || !project?.github_token) {
        throw new Error('GitHub not connected');
      }

      return callGitHubSync('create-branch', {
        repoUrl: project.github_repo_url,
        token: project.github_token,
        branchName,
        fromBranch: fromBranch || branch
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-branches', project?.id] });
      toast.success('Branch created');
    },
    onError: (error) => {
      toast.error('Failed to create branch: ' + error.message);
    }
  });

  // Create new repository
  const createRepo = useMutation({
    mutationFn: async ({ 
      repoName, 
      description, 
      isPrivate = true 
    }: { 
      repoName: string; 
      description?: string;
      isPrivate?: boolean;
    }): Promise<{ url: string; defaultBranch: string }> => {
      if (!project?.github_token) {
        throw new Error('GitHub token not configured');
      }

      return callGitHubSync('create-repo', {
        token: project.github_token,
        repoName,
        description,
        isPrivate
      });
    },
    onSuccess: () => {
      toast.success('Repository created');
    },
    onError: (error) => {
      toast.error('Failed to create repository: ' + error.message);
    }
  });

  // Validate token and check rate limits
  const validateToken = useMutation({
    mutationFn: async (): Promise<TokenValidation> => {
      if (!project?.github_token) {
        throw new Error('GitHub token not configured');
      }

      const result = await callGitHubSync('validate-token', {
        token: project.github_token
      });

      // Update rate limit status
      if (result.rateLimit) {
        rateLimitRef.current = {
          remaining: result.rateLimit.remaining,
          limit: result.rateLimit.limit,
          resetTime: new Date(result.rateLimit.reset * 1000),
          isLow: result.rateLimit.remaining < 100
        };
      }

      return result;
    }
  });

  // Pull latest (refresh files)
  const pullLatest = async () => {
    // Clear cache before pulling
    fileContentCache.clear();
    await refetchFiles();
    await refetchHistory();
    toast.success('Pulled latest changes');
  };

  // Clear cache utility
  const clearCache = useCallback(() => {
    fileContentCache.clear();
    console.log('File content cache cleared');
  }, []);

  return {
    // Connection status
    isConnected,
    currentBranch: branch,

    // Files
    files: files || [],
    isLoadingFiles,
    refetchFiles,
    fetchFileContent,
    fetchFilesBatch, // New batch fetch

    // Commits
    commitChanges,
    history: history || [],
    isLoadingHistory,
    refetchHistory,
    getFileHistory,

    // Branches
    branches: branches || [],
    isLoadingBranches,
    refetchBranches,
    createBranch,

    // Repository
    createRepo,

    // Token validation & rate limiting
    validateToken,
    rateLimitStatus: rateLimitRef.current,

    // Utilities
    pullLatest,
    clearCache,
  };
}
