/**
 * Admin hooks for managing chat functions, actors, and containers
 * Routes all mutations through admin-data edge function for RLS bypass
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { toast } from 'sonner';
import { clearRegistryCache } from '@/lib/chatFunctions/registry';
import type { ChatFunction, ChatActor, ChatContainer } from '@/lib/chatFunctions/registry';
import type { Database } from '@/integrations/supabase/types';

type ChatFunctionUpdate = Database['public']['Tables']['chat_functions']['Update'];
type ChatActorInsert = Database['public']['Tables']['chat_actors']['Insert'];
type ChatActorUpdate = Database['public']['Tables']['chat_actors']['Update'];
type ChatContainerUpdate = Database['public']['Tables']['chat_containers']['Update'];
type ChatFunctionInsert = Database['public']['Tables']['chat_functions']['Insert'];
type ChatContainerInsert = Database['public']['Tables']['chat_containers']['Insert'];

// Helper to get session token
function getSessionToken(): string | null {
  return localStorage.getItem('spork_admin_session');
}

// Helper to call admin-data edge function
async function callAdminData(action: string, params: Record<string, unknown> = {}) {
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    throw new Error('No admin session');
  }

  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: sessionToken, ...params }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// ============ FUNCTIONS HOOKS ============

export function useChatFunctions() {
  const { user } = useSystemAuth();

  return useQuery({
    queryKey: ['admin', 'chat-functions'],
    queryFn: async () => {
      const result = await callAdminData('chat_functions_get');
      return (result.data || []) as ChatFunction[];
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useCreateChatFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatFunctionInsert) => {
      await callAdminData('chat_functions_create', { function_data: data });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      toast.success('Function created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateChatFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ChatFunctionUpdate }) => {
      await callAdminData('chat_functions_update', { id, updates });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      toast.success('Function updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteChatFunction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await callAdminData('chat_functions_delete', { id });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      toast.success('Function deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============ ACTORS HOOKS ============

export function useChatActors() {
  const { user } = useSystemAuth();

  return useQuery({
    queryKey: ['admin', 'chat-actors'],
    queryFn: async () => {
      const result = await callAdminData('chat_actors_get');
      // Map database rows to ChatActor interface
      return ((result.data || []) as any[]).map((row) => ({
        ...row,
        function_sequence: (row.function_sequence as unknown as ChatActor['function_sequence']) || [],
        context_defaults: (row.context_defaults as unknown as Record<string, unknown>) || {},
        default_display_mode: row.default_display_mode as 'ui' | 'minimal' | 'silent',
      })) as ChatActor[];
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useCreateChatActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatActorInsert) => {
      await callAdminData('chat_actors_create', { actor_data: data });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-actors'] });
      toast.success('Actor created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateChatActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ChatActorUpdate }) => {
      await callAdminData('chat_actors_update', { id, updates });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-actors'] });
      toast.success('Actor updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteChatActor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await callAdminData('chat_actors_delete', { id });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-actors'] });
      toast.success('Actor deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============ CONTAINERS HOOKS ============

export function useChatContainers() {
  const { user } = useSystemAuth();

  return useQuery({
    queryKey: ['admin', 'chat-containers'],
    queryFn: async () => {
      const result = await callAdminData('chat_containers_get');
      return (result.data || []) as ChatContainer[];
    },
    enabled: !!user,
    staleTime: 30000,
  });
}

export function useCreateChatContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChatContainerInsert) => {
      await callAdminData('chat_containers_create', { container_data: data });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-containers'] });
      toast.success('Container created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateChatContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ChatContainerUpdate }) => {
      await callAdminData('chat_containers_update', { id, updates });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-containers'] });
      toast.success('Container updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteChatContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await callAdminData('chat_containers_delete', { id });
    },
    onSuccess: () => {
      clearRegistryCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-containers'] });
      toast.success('Container deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
