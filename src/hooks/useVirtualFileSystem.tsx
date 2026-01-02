import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGitHubSync, FileChange } from './useGitHubSync';
import { SporkProject } from '@/types/sporkProject';
import { createExternalSupabaseClient, hasExternalSupabase } from './useExternalSupabase';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type StorageMode = 'github' | 'database';

// Build folder tree structure from flat file list
export function buildFileTree(filePaths: string[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  
  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let currentLevel = root;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      
      let existing = currentLevel.find(n => n.name === part);
      
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }
      
      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }
  
  // Sort: folders first, then alphabetically
  const sortTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: node.children ? sortTree(node.children) : undefined,
    }));
  };
  
  return sortTree(root);
}

// Entry file patterns to auto-load for preview (priority order)
const ENTRY_FILE_PATTERNS = [
  // React entry points
  'src/main.tsx', 'src/main.ts', 'src/main.jsx', 'src/main.js',
  'main.tsx', 'main.ts', 'main.jsx', 'main.js',
  'src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js',
  'index.tsx', 'index.ts', 'index.jsx', 'index.js',
  
  // App component
  'src/App.tsx', 'src/App.ts', 'src/App.jsx', 'src/App.js',
  'App.tsx', 'App.ts', 'App.jsx', 'App.js',
  
  // HTML template
  'index.html', 'public/index.html',
  
  // Config files needed for bundling
  'package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts',
  
  // CSS entry
  'src/index.css', 'src/App.css', 'index.css',
];

export function useVirtualFileSystem(project: SporkProject | null) {
  const queryClient = useQueryClient();
  const projectId = project?.id || null;
  
  // Determine storage mode based on GitHub configuration
  const storageMode: StorageMode = useMemo(() => {
    if (project?.github_repo_url && project?.github_token) {
      return 'github';
    }
    return 'database';
  }, [project?.github_repo_url, project?.github_token]);

  // Get the correct Supabase client for this project (external if configured)
  const projectClient = useMemo(() => {
    if (project && hasExternalSupabase(project)) {
      return createExternalSupabaseClient(project);
    }
    return supabase;
  }, [project?.supabase_url, project?.supabase_anon_key]);

  // Track if using external Supabase for visibility
  const isExternalSupabase = useMemo(() => {
    return hasExternalSupabase(project);
  }, [project?.supabase_url, project?.supabase_anon_key]);
  
  // GitHub sync hook for connected projects
  const gitHub = useGitHubSync(project);
  
  // Track open files and local modifications (before save)
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [localModifications, setLocalModifications] = useState<Map<string, string>>(new Map());
  
  // GitHub content caches (for lazy-loaded files)
  const [fileContentCache, setFileContentCache] = useState<Map<string, string>>(new Map());
  const [fileShaCache, setFileShaCache] = useState<Map<string, string>>(new Map());
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [isLoadingEntryFiles, setIsLoadingEntryFiles] = useState(false);
  const [entryFilesLoaded, setEntryFilesLoaded] = useState(false);

  // Fetch project files from database (only for database mode)
  // Uses external Supabase client if project has external config
  const { data: projectFiles = [], isLoading: isLoadingDb } = useQuery({
    queryKey: ['spork-project-files', projectId, isExternalSupabase],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await projectClient
        .from('spork_project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('file_path');
      
      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!projectId && storageMode === 'database',
  });

  // Reset state when project changes
  useEffect(() => {
    setOpenFiles([]);
    setActiveFile(null);
    setLocalModifications(new Map());
    setFileContentCache(new Map());
    setFileShaCache(new Map());
    setEntryFilesLoaded(false);
  }, [projectId]);

  // Check if entry files are ready for preview
  const entryFilesReady = useMemo(() => {
    if (storageMode !== 'github') {
      // Database mode - files are always loaded with content
      return projectFiles.length > 0;
    }
    
    // GitHub mode - need entry files to be loaded
    if (!entryFilesLoaded) return false;
    
    // Check if we have at least App.tsx or main.tsx with content
    const hasApp = fileContentCache.has('src/App.tsx') || 
                   fileContentCache.has('App.tsx');
    const hasMain = fileContentCache.has('src/main.tsx') || 
                    fileContentCache.has('main.tsx') ||
                    fileContentCache.has('src/index.tsx');
    
    return hasApp || hasMain;
  }, [storageMode, entryFilesLoaded, fileContentCache, projectFiles]);

  // Auto-load entry files when GitHub file list is ready
  useEffect(() => {
    if (storageMode === 'github' && gitHub.files.length > 0 && !entryFilesLoaded && !isLoadingEntryFiles) {
      loadEntryFiles();
    }
  }, [storageMode, gitHub.files.length, entryFilesLoaded, isLoadingEntryFiles]);

  // Create file mutation (database mode) - uses external Supabase if configured
  const createFileMutation = useMutation({
    mutationFn: async ({ path, content = '' }: { path: string; content?: string }) => {
      if (!projectId) throw new Error('No project selected');
      
      const { data, error } = await projectClient
        .from('spork_project_files')
        .insert({
          project_id: projectId,
          file_path: path,
          content,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spork-project-files', projectId, isExternalSupabase] });
    },
  });

  // Update file mutation (database mode) - uses external Supabase if configured
  const updateFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      if (!projectId) throw new Error('No project selected');
      
      const { data, error } = await projectClient
        .from('spork_project_files')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('file_path', path)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spork-project-files', projectId, isExternalSupabase] });
    },
  });

  // Delete file mutation (database mode) - uses external Supabase if configured
  const deleteFileMutation = useMutation({
    mutationFn: async (path: string) => {
      if (!projectId) throw new Error('No project selected');
      
      const { error } = await projectClient
        .from('spork_project_files')
        .delete()
        .eq('project_id', projectId)
        .eq('file_path', path);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spork-project-files', projectId, isExternalSupabase] });
    },
  });

  // Build file tree from appropriate source
  const files = useMemo(() => {
    if (storageMode === 'github' && gitHub.files.length > 0) {
      // Build tree from GitHub file list (filter to blobs only)
      const allPaths = gitHub.files
        .filter(f => f.type === 'blob')
        .map(f => f.path);
      return buildFileTree(allPaths);
    }
    
    // Database mode
    const allPaths = projectFiles.map(f => f.file_path);
    return buildFileTree(allPaths);
  }, [storageMode, gitHub.files, projectFiles]);

  // Get current content of active file (with proper priority)
  const activeFileContent = useMemo(() => {
    if (!activeFile) return '';
    
    // 1. Check local modifications first (unsaved changes)
    if (localModifications.has(activeFile)) {
      return localModifications.get(activeFile) || '';
    }
    
    // 2. For GitHub mode, check content cache
    if (storageMode === 'github') {
      return fileContentCache.get(activeFile) || '';
    }
    
    // 3. Database mode - get from query result
    const file = projectFiles.find(f => f.file_path === activeFile);
    return file?.content || '';
  }, [activeFile, localModifications, storageMode, fileContentCache, projectFiles]);

  // Track which files have unsaved local modifications
  const modifiedFiles = useMemo(() => {
    return new Set(localModifications.keys());
  }, [localModifications]);

  // Open a file (with lazy loading for GitHub mode)
  const openFile = useCallback(async (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles(prev => [...prev, path]);
    }
    setActiveFile(path);
    
    // For GitHub mode, fetch content if not cached
    if (storageMode === 'github' && !fileContentCache.has(path) && !localModifications.has(path)) {
      setLoadingFile(path);
      try {
        const result = await gitHub.fetchFileContent.mutateAsync({ path });
        setFileContentCache(prev => new Map(prev).set(path, result.content));
        setFileShaCache(prev => new Map(prev).set(path, result.sha));
      } catch (error) {
        console.error('Failed to fetch file from GitHub:', error);
        toast.error('Failed to load file from GitHub');
      } finally {
        setLoadingFile(null);
      }
    }
  }, [openFiles, storageMode, fileContentCache, localModifications, gitHub.fetchFileContent]);

  // Close a file
  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.filter(p => p !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(p => p !== path);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
    // Clear local modifications when closing
    setLocalModifications(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  }, [openFiles, activeFile]);

  // Update file content locally (doesn't save yet)
  const updateFileContent = useCallback((path: string, content: string) => {
    // Get original content to compare
    let originalContent = '';
    if (storageMode === 'github') {
      originalContent = fileContentCache.get(path) || '';
    } else {
      const dbFile = projectFiles.find(f => f.file_path === path);
      originalContent = dbFile?.content || '';
    }
    
    if (content === originalContent) {
      // Remove from local modifications if back to original
      setLocalModifications(prev => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
    } else {
      setLocalModifications(prev => {
        const next = new Map(prev);
        next.set(path, content);
        return next;
      });
    }
  }, [storageMode, fileContentCache, projectFiles]);

  // Save file
  const saveFile = useCallback(async (path: string) => {
    const content = localModifications.get(path);
    if (content === undefined) return;
    
    if (storageMode === 'github') {
      // Commit to GitHub
      const change: FileChange = {
        path,
        content,
        action: fileShaCache.has(path) ? 'update' : 'create'
      };
      
      await gitHub.commitChanges.mutateAsync({
        changes: [change],
        message: `Update ${path}`
      });
      
      // Update cache with new content
      setFileContentCache(prev => new Map(prev).set(path, content));
      toast.success('Committed to GitHub');
    } else {
      // Database mode
      const existingFile = projectFiles.find(f => f.file_path === path);
      
      if (existingFile) {
        await updateFileMutation.mutateAsync({ path, content });
      } else {
        await createFileMutation.mutateAsync({ path, content });
      }
      toast.success('File saved');
    }
    
    // Clear local modification after save
    setLocalModifications(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  }, [storageMode, localModifications, gitHub.commitChanges, fileShaCache, projectFiles, updateFileMutation, createFileMutation]);

  // Save all modified files (batch commit for GitHub)
  const saveAllFiles = useCallback(async () => {
    const paths = Array.from(localModifications.keys());
    if (paths.length === 0) return;
    
    if (storageMode === 'github') {
      // Create array of changes for batch commit
      const changes: FileChange[] = paths.map(path => ({
        path,
        content: localModifications.get(path)!,
        action: fileShaCache.has(path) ? 'update' : 'create'
      }));
      
      await gitHub.commitChanges.mutateAsync({
        changes,
        message: `Update ${paths.length} file(s)`
      });
      
      // Update cache
      paths.forEach(path => {
        setFileContentCache(prev => 
          new Map(prev).set(path, localModifications.get(path)!)
        );
      });
      
      // Clear all local modifications
      setLocalModifications(new Map());
      toast.success(`Committed ${paths.length} file(s) to GitHub`);
    } else {
      // Database mode - save one by one
      for (const path of paths) {
        await saveFile(path);
      }
    }
  }, [storageMode, localModifications, gitHub.commitChanges, fileShaCache, saveFile]);

  // Create a new file
  const createFile = useCallback(async (path: string) => {
    // Normalize path
    let normalizedPath = path;
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.slice(1);
    }
    
    if (storageMode === 'github') {
      // For GitHub, add to local modifications - will commit on save
      setLocalModifications(prev => new Map(prev).set(normalizedPath, ''));
      toast.success('File created (save to commit)');
    } else {
      await createFileMutation.mutateAsync({ path: normalizedPath, content: '' });
      toast.success('File created');
    }
    
    // Open the new file
    setOpenFiles(prev => [...prev, normalizedPath]);
    setActiveFile(normalizedPath);
  }, [storageMode, createFileMutation]);

  // Delete a file
  const deleteFile = useCallback(async (path: string) => {
    // Close the file if open
    closeFile(path);
    
    if (storageMode === 'github') {
      await gitHub.commitChanges.mutateAsync({
        changes: [{ path, content: '', action: 'delete' }],
        message: `Delete ${path}`
      });
      
      // Clear from caches
      setFileContentCache(prev => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
      setFileShaCache(prev => {
        const next = new Map(prev);
        next.delete(path);
        return next;
      });
      
      toast.success('Deleted from GitHub');
    } else {
      await deleteFileMutation.mutateAsync(path);
      toast.success('File deleted');
    }
    
    // Clear any local modifications
    setLocalModifications(prev => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  }, [storageMode, closeFile, gitHub.commitChanges, deleteFileMutation]);

  // Get all files as a Map for Sandpack
  const getAllFiles = useCallback(() => {
    const fileMap = new Map<string, string>();
    
    if (storageMode === 'github') {
      // Include cached content and local modifications
      fileContentCache.forEach((content, path) => {
        fileMap.set(path, localModifications.get(path) ?? content);
      });
      // Add any new files that are only in local modifications
      localModifications.forEach((content, path) => {
        if (!fileMap.has(path)) {
          fileMap.set(path, content);
        }
      });
    } else {
      // Database mode
      for (const file of projectFiles) {
        const content = localModifications.get(file.file_path) ?? file.content;
        fileMap.set(file.file_path, content);
      }
      // Add new files from local modifications
      localModifications.forEach((content, path) => {
        if (!fileMap.has(path)) {
          fileMap.set(path, content);
        }
      });
    }
    
    return fileMap;
  }, [storageMode, fileContentCache, projectFiles, localModifications]);

  // Load entry files for preview (auto-load critical files)
  const loadEntryFiles = useCallback(async () => {
    if (storageMode !== 'github' || gitHub.files.length === 0) return;
    
    // Find which entry files exist in the project
    const availablePaths = gitHub.files.filter(f => f.type === 'blob').map(f => f.path);
    const entryFilesToLoad = ENTRY_FILE_PATTERNS.filter(pattern => 
      availablePaths.some(p => p === pattern || p.endsWith('/' + pattern))
    );
    
    // Get the actual paths (in case they're nested)
    const actualPaths = entryFilesToLoad.map(pattern => {
      const match = availablePaths.find(p => p === pattern || p.endsWith('/' + pattern));
      return match || pattern;
    }).filter(Boolean);
    
    // Filter to files that aren't already cached
    const filesToFetch = actualPaths.filter(path => !fileContentCache.has(path));
    
    if (filesToFetch.length === 0) return;
    
    setIsLoadingEntryFiles(true);
    try {
      await Promise.all(filesToFetch.map(async (path) => {
        try {
          const result = await gitHub.fetchFileContent.mutateAsync({ path });
          setFileContentCache(prev => new Map(prev).set(path, result.content));
          setFileShaCache(prev => new Map(prev).set(path, result.sha));
        } catch (err) {
          console.warn(`Failed to load entry file: ${path}`, err);
        }
      }));
    } catch (error) {
      console.error('Failed to load entry files:', error);
    } finally {
      setIsLoadingEntryFiles(false);
      setEntryFilesLoaded(true);
    }
  }, [storageMode, gitHub.files, fileContentCache, gitHub.fetchFileContent]);

  // Pull latest from GitHub (refresh)
  const pullLatest = useCallback(async () => {
    if (storageMode === 'github') {
      // Clear caches to force reload
      setFileContentCache(new Map());
      setFileShaCache(new Map());
      await gitHub.pullLatest();
    }
  }, [storageMode, gitHub]);

  return {
    // File tree
    files,
    
    // Open files management
    openFiles,
    activeFile,
    activeFileContent,
    modifiedFiles,
    
    // Loading states
    isLoading: storageMode === 'github' ? gitHub.isLoadingFiles : isLoadingDb,
    isLoadingFile: loadingFile !== null,
    loadingFile,
    isLoadingEntryFiles,
    isCommitting: gitHub.commitChanges.isPending,
    
    // Storage info
    storageMode,
    entryFilesReady,
    isGitHubConnected: storageMode === 'github',
    isExternalSupabase,
    
    // File operations
    getAllFiles,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    saveAllFiles,
    createFile,
    deleteFile,
    
    // GitHub-specific
    pullLatest,
    loadEntryFiles,
    currentBranch: gitHub.currentBranch,
    branches: gitHub.branches,
    history: gitHub.history,
  };
}
