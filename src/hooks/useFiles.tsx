import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSpace } from '@/hooks/useSpace';
import { toast } from 'sonner';
import { logActivity } from '@/utils/logActivity';

export interface UserFile {
  id: string;
  user_id: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceFile {
  id: string;
  workspace_id: string;
  uploaded_by: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface NormalizedFile {
  id: string;
  user_id?: string;
  workspace_id?: string;
  uploaded_by?: string;
  folder_id: string | null;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  thumbnail_path: string | null;
  metadata: Record<string, any>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileFolder {
  id: string;
  user_id: string;
  workspace_id: string | null;
  parent_id: string | null;
  name: string;
  color: string | null;
  owner_type: 'user' | 'workspace';
  is_system_folder: boolean;
  folder_type: 'my_chats' | 'workspace_root' | 'knowledge_base' | 'custom' | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceFolder {
  id: string;
  workspace_id: string;
  workspace_name: string;
  owner_id: string;
  is_owner: boolean;
  member_count?: number;
}

export function useFiles(workspaceId?: string) {
  const { user } = useAuth();
  const { currentSpace } = useSpace();
  const [files, setFiles] = useState<NormalizedFile[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [workspaceFolders, setWorkspaceFolders] = useState<WorkspaceFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isWorkspaceMode = !!workspaceId;
  const activeWorkspaceId = workspaceId || currentSpace?.id;

  const fetchFiles = async (folderId?: string | null) => {
    if (!user) return;

    try {
      if (isWorkspaceMode && activeWorkspaceId) {
        const { data, error } = await supabase.functions.invoke('file-operations', {
          body: { action: 'get_workspace_files', workspaceId: activeWorkspaceId },
        });

        if (error) throw error;
        
        const normalizedFiles = ((data.data || []) as WorkspaceFile[]).map(f => ({
          ...f,
          user_id: f.uploaded_by,
        })) as NormalizedFile[];
        
        setFiles(normalizedFiles);
      } else {
        const { data, error } = await supabase.functions.invoke('file-operations', {
          body: { action: 'get_user_files', folderId },
        });

        if (error) throw error;
        setFiles((data.data || []) as NormalizedFile[]);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    }
  };

  const fetchFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('file-operations', {
        body: { 
          action: 'get_folders', 
          ownerType: isWorkspaceMode ? 'workspace' : 'user',
          workspaceId: isWorkspaceMode ? activeWorkspaceId : null,
        },
      });

      if (error) throw error;
      
      const sortedFolders = (data.data || []).sort((a: FileFolder, b: FileFolder) => {
        if (a.folder_type === 'my_chats') return -1;
        if (b.folder_type === 'my_chats') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setFolders(sortedFolders as FileFolder[]);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to fetch folders');
    }
  };

  const fetchWorkspaceFolders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'get_workspace_folders' },
      });

      if (error) throw error;
      setWorkspaceFolders(data.data || []);
    } catch (error) {
      console.error('Error fetching workspace folders:', error);
    }
  };

  const uploadFile = async (file: File, folderId?: string | null) => {
    if (!user) {
      toast.error('User not authenticated');
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';
      const fileData = isWorkspaceMode && activeWorkspaceId
        ? {
            workspace_id: activeWorkspaceId,
            uploaded_by: user.id,
            folder_id: folderId || null,
            file_name: fileName,
            original_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            storage_path: filePath,
            metadata: {},
          }
        : {
            user_id: user.id,
            folder_id: folderId || null,
            file_name: fileName,
            original_name: file.name,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            storage_path: filePath,
            metadata: {},
          };

      const { data, error: dbError } = await supabase.functions.invoke('file-operations', {
        body: { action: 'create_file_record', tableName, fileData },
      });

      if (dbError) throw dbError;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'uploaded',
        resourceType: 'file',
        resourceId: data.data.id,
        resourceName: file.name,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
        details: { file_type: file.type, file_size: file.size }
      });

      await fetchFiles();
      toast.success('File uploaded successfully');
      return data.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    }
  };

  const uploadFiles = async (fileList: File[], folderId?: string | null) => {
    const results = await Promise.all(
      Array.from(fileList).map(file => uploadFile(file, folderId))
    );
    return results.filter(Boolean);
  };

  const deleteFile = async (fileId: string) => {
    if (!user) return;
    
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';

      const { error: dbError } = await supabase.functions.invoke('file-operations', {
        body: { action: 'delete_file', tableName, fileId },
      });

      if (dbError) throw dbError;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'deleted',
        resourceType: 'file',
        resourceId: fileId,
        resourceName: file.original_name,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
      });

      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([file.storage_path]);

      if (storageError) {
        console.warn('Storage file deletion failed (may already be deleted):', storageError);
      }

      await fetchFiles();
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const moveFile = async (fileId: string, folderId: string | null) => {
    if (!user) return;
    
    try {
      const file = files.find(f => f.id === fileId);
      const folder = folders.find(f => f.id === folderId);
      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';

      const { error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'move_file', tableName, fileId, folderId },
      });

      if (error) throw error;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'moved',
        resourceType: 'file',
        resourceId: fileId,
        resourceName: file?.original_name,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
        details: { folder_id: folderId, folder_name: folder?.name || 'Root' }
      });

      await fetchFiles();
      toast.success('File moved successfully');
    } catch (error) {
      console.error('Error moving file:', error);
      toast.error('Failed to move file');
    }
  };

  const renameFile = async (fileId: string, newName: string) => {
    if (!user) return;
    
    try {
      const file = files.find(f => f.id === fileId);
      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';

      const { error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'rename_file', tableName, fileId, newName },
      });

      if (error) throw error;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'renamed',
        resourceType: 'file',
        resourceId: fileId,
        resourceName: newName,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
        details: { old_name: file?.original_name }
      });

      await fetchFiles();
      toast.success('File renamed successfully');
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename file');
    }
  };

  const toggleFavorite = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';

      const { error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'toggle_favorite', tableName, fileId, isFavorite: file.is_favorite },
      });

      if (error) throw error;

      await fetchFiles();
      toast.success(file.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  const createFolder = async (name: string, parentId?: string | null) => {
    if (!user) {
      toast.error('User not authenticated');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('file-operations', {
        body: { 
          action: 'create_folder', 
          name,
          parentId: parentId || null,
          ownerType: isWorkspaceMode ? 'workspace' : 'user',
          workspaceId: isWorkspaceMode ? activeWorkspaceId : null,
        },
      });

      if (error) throw error;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'created',
        resourceType: 'folder',
        resourceId: data.data.id,
        resourceName: name,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
      });

      await fetchFolders();
      toast.success('Folder created successfully');
      return data.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
      return null;
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!user) return;
    
    try {
      const folder = folders.find(f => f.id === folderId);
      
      if (folder?.is_system_folder) {
        toast.error('Cannot delete system folder');
        return;
      }

      const tableName = isWorkspaceMode ? 'workspace_files' : 'user_files';

      const { error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'delete_folder', folderId, tableName },
      });

      if (error) throw error;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'deleted',
        resourceType: 'folder',
        resourceId: folderId,
        resourceName: folder?.name,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
      });

      await fetchFolders();
      await fetchFiles();
      toast.success('Folder deleted successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!user) return;
    
    try {
      const folder = folders.find(f => f.id === folderId);
      
      if (folder?.is_system_folder) {
        toast.error('Cannot rename system folder');
        return;
      }

      const { error } = await supabase.functions.invoke('file-operations', {
        body: { action: 'rename_folder', folderId, newName },
      });

      if (error) throw error;

      await logActivity({
        appSection: isWorkspaceMode ? 'workspace' : 'files',
        actorId: user.id,
        action: 'renamed',
        resourceType: 'folder',
        resourceId: folderId,
        resourceName: newName,
        workspaceId: isWorkspaceMode ? activeWorkspaceId : undefined,
        details: { old_name: folder?.name }
      });

      await fetchFolders();
      toast.success('Folder renamed successfully');
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error('Failed to rename folder');
    }
  };

  const getDownloadUrl = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');

      const { data, error } = await supabase.storage
        .from('user-files')
        .createSignedUrl(file.storage_path, 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast.error('Failed to get download URL');
      return null;
    }
  };

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('user-files')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  useEffect(() => {
    setIsLoading(true);
    
    Promise.all([
      fetchFiles(),
      fetchFolders(),
      !isWorkspaceMode && fetchWorkspaceFolders(),
    ]).finally(() => setIsLoading(false));
  }, [user, activeWorkspaceId, isWorkspaceMode]);

  return {
    files,
    folders,
    workspaceFolders,
    isLoading,
    uploadFile,
    uploadFiles,
    deleteFile,
    moveFile,
    renameFile,
    toggleFavorite,
    createFolder,
    deleteFolder,
    renameFolder,
    getDownloadUrl,
    getPublicUrl,
    fetchFiles,
    fetchFolders,
    isWorkspaceMode,
  };
}
