import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/logActivity';

export interface SpacePrompt {
  id: string;
  space_id: string;
  title: string;
  content: string;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  last_used_at: string | null;
}

export function useSpacePrompts(spaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['space-prompts', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'get_space_prompts', space_id: spaceId },
      });

      if (error) throw error;
      return (data.data || []) as SpacePrompt[];
    },
    enabled: !!spaceId,
  });

  const createPromptMutation = useMutation({
    mutationFn: async (prompt: Omit<SpacePrompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'space_id' | 'is_default' | 'last_used_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('space-operations', {
        body: { 
          action: 'create_space_prompt',
          space_id: spaceId,
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
        },
      });

      if (error) throw error;
      return { prompt: data.data as SpacePrompt, userId: user.id };
    },
    onSuccess: async ({ prompt, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-prompts', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'created',
        resourceType: 'prompt',
        resourceId: prompt.id,
        resourceName: prompt.title,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Prompt created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create prompt', description: error.message, variant: 'destructive' });
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ promptId, updates }: { promptId: string; updates: Partial<SpacePrompt> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const prompt = prompts.find(p => p.id === promptId);

      const { error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'update_space_prompt', prompt_id: promptId, ...updates },
      });

      if (error) throw error;
      return { promptId, promptTitle: prompt?.title, userId: user.id, updates };
    },
    onSuccess: async ({ promptId, promptTitle, userId, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['space-prompts', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'updated',
        resourceType: 'prompt',
        resourceId: promptId,
        resourceName: promptTitle,
        workspaceId: spaceId,
        details: { updated_fields: Object.keys(updates) }
      });
      
      toast({ title: 'Prompt updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update prompt', description: error.message, variant: 'destructive' });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const prompt = prompts.find(p => p.id === promptId);

      const { data, error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'delete_space_prompt', prompt_id: promptId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return { promptId, promptTitle: prompt?.title, userId: user.id };
    },
    onSuccess: async ({ promptId, promptTitle, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-prompts', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'deleted',
        resourceType: 'prompt',
        resourceId: promptId,
        resourceName: promptTitle,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Prompt deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete prompt', description: error.message, variant: 'destructive' });
    },
  });

  const trackUsageMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const { error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'track_prompt_usage', prompt_id: promptId },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-prompts', spaceId] });
    },
    onError: (error: Error) => {
      console.error('Error tracking prompt usage:', error);
    },
  });

  return {
    prompts,
    isLoading,
    createPrompt: createPromptMutation.mutate,
    updatePrompt: updatePromptMutation.mutate,
    deletePrompt: deletePromptMutation.mutate,
    trackUsage: trackUsageMutation.mutate,
    isCreating: createPromptMutation.isPending,
    isUpdating: updatePromptMutation.isPending,
    isDeleting: deletePromptMutation.isPending,
  };
}
