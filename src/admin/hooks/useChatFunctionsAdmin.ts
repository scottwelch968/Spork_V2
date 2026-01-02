import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cosmo2 } from '@/cosmo2/client';
import { toast } from 'sonner';
import { clearRegistryCache } from '@/lib/chatFunctions/registry';
import type { ChatFunction, ChatActor, ChatContainer } from '@/lib/chatFunctions/registry';

// ============ FUNCTIONS HOOKS ============

export function useChatFunctions() {
  return useQuery({
    queryKey: ['admin', 'chat-functions'],
    queryFn: async () => {
      const tools = await cosmo2.getTools();
      // Map V2 Tools to ChatFunction interface
      return tools.map(t => ({
        id: t.id,
        function_key: t.function_key,
        name: t.name,
        description: t.description || '',
        category: t.category || 'feature',
        code_path: t.source || '',
        events_emitted: t.eventsEmitted || [],
        depends_on: t.dependencies || [],
        tags: t.tags || [],
        input_schema: t.inputSchema || {},
        output_schema: t.outputSchema || {},
        is_core: t.is_core || false,
        is_enabled: t.is_enabled ?? true,
        display_order: t.display_order || 0,
        created_at: t.updated_at || new Date().toISOString(),
        updated_at: t.updated_at || new Date().toISOString(),
      })) as ChatFunction[];
    },
    staleTime: 30000,
  });
}

export function useCreateChatFunction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ChatFunction>) => {
      // Map ChatFunction data to ToolUpdateRequest
      const toolData = {
        name: data.name || '',
        function_key: data.function_key || '',
        description: data.description,
        category: data.category,
        is_enabled: data.is_enabled,
        is_core: data.is_core,
        source: data.code_path,
        inputSchema: data.input_schema as any,
        outputSchema: data.output_schema as any,
        tags: data.tags,
        eventsEmitted: data.events_emitted,
        dependencies: data.depends_on,
        display_order: data.display_order,
      };
      return cosmo2.createTool(toolData);
    },
    onSuccess: () => {
      toast.success('Function created successfully (V2)');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      clearRegistryCache();
    },
    onError: (err: Error) => toast.error(`Failed to create function: ${err.message}`),
  });
}

export function useUpdateChatFunction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ChatFunction> }) => {
      // Map updates to ToolUpdateRequest
      const toolUpdates = {
        name: updates.name,
        // function_key is usually immutable or handled carefully
        description: updates.description,
        category: updates.category,
        is_enabled: updates.is_enabled,
        is_core: updates.is_core,
        source: updates.code_path,
        inputSchema: updates.input_schema as any,
        outputSchema: updates.output_schema as any,
        tags: updates.tags,
        eventsEmitted: updates.events_emitted,
        dependencies: updates.depends_on,
        display_order: updates.display_order,
      };
      // ID from ChatFunction might be the UUID if mapped correctly, or key if legacy.
      // useChatFunctions maps t.id -> id, so 'id' here should be the Tool UUID.
      return cosmo2.updateTool(id, toolUpdates);
    },
    onSuccess: () => {
      toast.success('Function updated successfully (V2)');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      clearRegistryCache();
    },
    onError: (err: Error) => toast.error(`Failed to update function: ${err.message}`),
  });
}

export function useDeleteChatFunction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return cosmo2.deleteTool(id);
    },
    onSuccess: () => {
      toast.success('Function deleted successfully (V2)');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-functions'] });
      clearRegistryCache();
    },
    onError: (err: Error) => toast.error(`Failed to delete function: ${err.message}`),
  });
}

// ============ ACTORS HOOKS ============

export function useChatActors() {
  // Actors not exposed in V2 yet
  return useQuery({
    queryKey: ['admin', 'chat-actors'],
    queryFn: async () => [] as ChatActor[],
    staleTime: 30000,
  });
}

export function useCreateChatActor() {
  return useMutation({ mutationFn: async (data: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}

export function useUpdateChatActor() {
  return useMutation({ mutationFn: async (id: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}

export function useDeleteChatActor() {
  return useMutation({ mutationFn: async (id: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}

// ============ CONTAINERS HOOKS ============

export function useChatContainers() {
  // Containers not exposed in V2 yet
  return useQuery({
    queryKey: ['admin', 'chat-containers'],
    queryFn: async () => [] as ChatContainer[],
    staleTime: 30000,
  });
}

export function useCreateChatContainer() {
  return useMutation({ mutationFn: async (data: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}

export function useUpdateChatContainer() {
  return useMutation({ mutationFn: async (id: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}

export function useDeleteChatContainer() {
  return useMutation({ mutationFn: async (id: any) => { }, onSuccess: () => toast.info('Not supported in V2') });
}
