import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/logActivity';
import type { SpaceChat, SpaceChatMessage } from '@/presentation/types';

export type { SpaceChat, SpaceChatMessage };

export function useSpaceChats(spaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['space-chats', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('chat-messages', {
        body: { action: 'get_space_chats', space_id: spaceId },
      });

      if (error) throw error;
      return (data.data || []) as SpaceChat[];
    },
    enabled: !!spaceId,
  });

  const createChatMutation = useMutation({
    mutationFn: async ({ title, model, personaId }: { title?: string; model?: string; personaId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('chat-messages', {
        body: { 
          action: 'create_space_chat',
          space_id: spaceId,
          title: title || 'New Chat',
          model: model || null,
          persona_id: personaId || null,
        },
      });

      if (error) throw error;
      return { chat: data.data as SpaceChat, userId: user.id };
    },
    onSuccess: async ({ chat, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-chats', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'created',
        resourceType: 'chat',
        resourceId: chat.id,
        resourceName: chat.title,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Chat created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create chat', description: error.message, variant: 'destructive' });
    },
  });

  const updateChatMutation = useMutation({
    mutationFn: async ({ chatId, updates }: { chatId: string; updates: Partial<SpaceChat> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const chat = chats.find(c => c.id === chatId);

      const { error } = await supabase.functions.invoke('chat-messages', {
        body: { action: 'update_space_chat', chat_id: chatId, title: updates.title },
      });

      if (error) throw error;
      return { chatId, chatTitle: chat?.title, userId: user.id, updates };
    },
    onSuccess: async ({ chatId, chatTitle, userId, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['space-chats', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'updated',
        resourceType: 'chat',
        resourceId: chatId,
        resourceName: chatTitle,
        workspaceId: spaceId,
        details: { updated_fields: Object.keys(updates) }
      });
      
      toast({ title: 'Chat updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update chat', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const chat = chats.find(c => c.id === chatId);

      const { error } = await supabase.functions.invoke('chat-messages', {
        body: { action: 'delete_space_chat', chat_id: chatId },
      });

      if (error) throw error;
      return { chatId, chatTitle: chat?.title, userId: user.id };
    },
    onSuccess: async ({ chatId, chatTitle, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-chats', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'deleted',
        resourceType: 'chat',
        resourceId: chatId,
        resourceName: chatTitle,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Chat deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete chat', description: error.message, variant: 'destructive' });
    },
  });

  return {
    chats,
    isLoading,
    createChat: createChatMutation.mutateAsync,
    updateChat: updateChatMutation.mutate,
    deleteChat: deleteChatMutation.mutate,
    isCreating: createChatMutation.isPending,
    isUpdating: updateChatMutation.isPending,
    isDeleting: deleteChatMutation.isPending,
  };
}

export function useSpaceChatMessages(chatId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['space-chat-messages', chatId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('chat-messages', {
        body: { action: 'get_space_chat_messages', chat_id: chatId },
      });

      if (error) throw error;
      return (data.data || []) as SpaceChatMessage[];
    },
    enabled: !!chatId,
  });

  const addMessageMutation = useMutation({
    mutationFn: async ({ role, content, tokensUsed }: { role: string; content: string; tokensUsed?: number }) => {
      const { data, error } = await supabase.functions.invoke('chat-messages', {
        body: { 
          action: 'add_space_message',
          chat_id: chatId,
          role,
          content,
        },
      });

      if (error) throw error;
      return data.data as SpaceChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-chat-messages', chatId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    },
  });

  return {
    messages,
    isLoading,
    addMessage: addMessageMutation.mutate,
    isAdding: addMessageMutation.isPending,
  };
}
