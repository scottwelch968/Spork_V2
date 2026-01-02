import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSpace } from './useSpace';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  name: string;
  color?: string;
  workspace_id: string;
  created_by?: string;
  created_at: string;
}

// Helper to call the folder-operations edge function
async function invokefolderOperations(action: string, params: Record<string, any>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('folder-operations', {
    body: { action, ...params },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentSpace } = useSpace();

  useEffect(() => {
    if (currentSpace) {
      fetchFolders();
    }
  }, [currentSpace]);

  const fetchFolders = useCallback(async () => {
    if (!currentSpace) return;

    setIsLoading(true);
    try {
      const result = await invokefolderOperations('list_folders', {
        workspace_id: currentSpace.id,
      });
      setFolders(result.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace]);

  const createFolder = async (name: string, color?: string) => {
    if (!currentSpace) {
      toast.error('No space selected');
      return;
    }

    try {
      const result = await invokefolderOperations('create_folder', {
        workspace_id: currentSpace.id,
        name,
        color,
      });

      toast.success('Folder created successfully');
      await fetchFolders();
      return result.folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const updateFolder = async (folderId: string, name: string, color?: string) => {
    if (!currentSpace) return;

    try {
      await invokefolderOperations('update_folder', {
        workspace_id: currentSpace.id,
        folder_id: folderId,
        name,
        color,
      });

      toast.success('Folder updated successfully');
      await fetchFolders();
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!currentSpace) return;

    try {
      await invokefolderOperations('delete_folder', {
        workspace_id: currentSpace.id,
        folder_id: folderId,
      });

      toast.success('Folder deleted successfully');
      await fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const addChatToFolder = async (chatId: string, folderId: string) => {
    if (!currentSpace) return;

    try {
      await invokefolderOperations('add_chat_to_folder', {
        workspace_id: currentSpace.id,
        chat_id: chatId,
        folder_id: folderId,
      });

      toast.success('Chat moved to folder');
    } catch (error) {
      console.error('Error adding chat to folder:', error);
      toast.error('Failed to move chat');
    }
  };

  const removeChatFromFolder = async (chatId: string) => {
    if (!currentSpace) return;

    try {
      await invokefolderOperations('remove_chat_from_folder', {
        workspace_id: currentSpace.id,
        chat_id: chatId,
      });

      toast.success('Chat removed from folder');
    } catch (error) {
      console.error('Error removing chat from folder:', error);
      toast.error('Failed to remove chat');
    }
  };

  const getChatFolder = async (chatId: string): Promise<string | null> => {
    if (!currentSpace) return null;

    try {
      const result = await invokefolderOperations('get_chat_folder', {
        workspace_id: currentSpace.id,
        chat_id: chatId,
      });
      return result.folder_id || null;
    } catch (error) {
      console.error('Error getting chat folder:', error);
      return null;
    }
  };

  const getFolderChats = async (folderId: string): Promise<string[]> => {
    if (!currentSpace) return [];

    try {
      const result = await invokefolderOperations('get_folder_chats', {
        workspace_id: currentSpace.id,
        folder_id: folderId,
      });
      return result.chat_ids || [];
    } catch (error) {
      console.error('Error getting folder chats:', error);
      return [];
    }
  };

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    addChatToFolder,
    removeChatFromFolder,
    getChatFolder,
    getFolderChats,
    fetchFolders,
  };
};
