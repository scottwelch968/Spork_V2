import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/utils/logActivity';
const CURRENT_SPACE_KEY = 'current_space_id';

// Helper to invoke space-content edge function
async function invokeSpaceContent(action: string, params: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('space-content', {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

export function useSpace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(
    () => localStorage.getItem(CURRENT_SPACE_KEY)
  );

  const { data: spaces, isLoading } = useQuery({
    queryKey: ['spaces', user?.id],
    enabled: !authLoading && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetch
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    queryFn: async () => {
      if (!user) return [];

      // Fetch owned + member spaces in parallel
      const [ownedResult, memberResult] = await Promise.all([
        supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('workspace_members')
          .select('workspace_id')
          .eq('user_id', user.id)
      ]);
      
      if (ownedResult.error) throw ownedResult.error;
      if (memberResult.error) throw memberResult.error;

      const ownedSpaces = ownedResult.data || [];
      const memberSpaceIds = memberResult.data || [];

      // Get member spaces in one query if needed
      let memberSpaces: any[] = [];
      if (memberSpaceIds.length > 0) {
        const memberIds = memberSpaceIds.map(m => m.workspace_id);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', memberIds);
        
        if (error) throw error;
        memberSpaces = data || [];
      }

      // Combine and dedupe
      const allSpaces = [...ownedSpaces];
      memberSpaces.forEach(space => {
        if (!allSpaces.find(w => w.id === space.id)) {
          allSpaces.push(space);
        }
      });

      // Sort: default first, then by created_at
      allSpaces.sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return allSpaces;
    },
  });

  // Set initial space if none selected
  useEffect(() => {
    if (spaces && spaces.length > 0 && !currentSpaceId) {
      const firstSpace = spaces[0];
      setCurrentSpaceId(firstSpace.id);
      localStorage.setItem(CURRENT_SPACE_KEY, firstSpace.id);
    }
  }, [spaces, currentSpaceId]);

  const currentSpace = spaces?.find(w => w.id === currentSpaceId) || spaces?.[0];

  // Computed flag indicating workspace is ready for use
  const isSpaceReady = !isLoading && !authLoading && !!currentSpace;

  const switchSpace = (spaceId: string) => {
    setCurrentSpaceId(spaceId);
    localStorage.setItem(CURRENT_SPACE_KEY, spaceId);
    toast({
      title: 'Space switched',
      description: 'You are now working in a different space',
    });
  };

  const createSpaceMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string; 
      color_code?: string;
      templateId?: string;
      ai_model?: string;
      ai_instructions?: string;
      compliance_rule?: string;
      file_quota_mb?: number;
      default_personas?: any;
      default_prompts?: any;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Create workspace via edge function
      const result = await invokeSpaceContent('create_workspace', {
        name: data.name,
        description: data.description || null,
        color_code: data.color_code || null,
        ai_model: data.ai_model || null,
        ai_instructions: data.ai_instructions || null,
        compliance_rule: data.compliance_rule || null,
        file_quota_mb: data.file_quota_mb || 1000,
      });

      if (!result?.data) throw new Error('Failed to create workspace');
      const workspace = result.data;

      // Create personas from template if provided, otherwise use default
      if (data.default_personas && Array.isArray(data.default_personas) && data.default_personas.length > 0) {
        await invokeSpaceContent('bulk_create_personas', {
          personas: data.default_personas.map(p => ({
            space_id: workspace.id,
            name: p.name,
            description: p.description,
            system_prompt: p.system_prompt,
            is_default: p.is_default || false,
          })),
        });
      } else {
        // Fetch default persona template for new spaces
        const { data: defaultPersona } = await supabase
          .from('persona_templates')
          .select('*')
          .eq('is_default_for_spaces', true)
          .eq('is_active', true)
          .single();

        // Use template or fallback to General Assistant
        const personaData = defaultPersona || {
          name: 'General Assistant',
          description: 'Helpful AI assistant for everyday tasks',
          system_prompt: 'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.',
          icon: null,
        };

        // Create default persona for workspace's Space AI Config
        await invokeSpaceContent('create_persona', {
          space_id: workspace.id,
          name: personaData.name,
          description: personaData.description,
          system_prompt: personaData.system_prompt,
          is_default: true,
        });

        // Increment use count if template was used
        if (defaultPersona?.id) {
          await invokeSpaceContent('increment_template_use', {
            template_type: 'persona',
            template_id: defaultPersona.id,
          });
        }
      }

      // Create prompts from template if provided, otherwise use default
      if (data.default_prompts && Array.isArray(data.default_prompts) && data.default_prompts.length > 0) {
        await invokeSpaceContent('bulk_create_prompts', {
          prompts: data.default_prompts.map(p => ({
            space_id: workspace.id,
            title: p.title,
            content: p.content,
            category: p.category,
            is_default: p.is_default || false,
          })),
        });
      } else {
        // Fetch default prompt template for new spaces
        const { data: defaultPrompt } = await supabase
          .from('prompt_templates')
          .select('*')
          .eq('is_default_for_spaces', true)
          .eq('is_active', true)
          .single();

        // Use template or fallback to General Prompt
        const promptData = defaultPrompt || {
          title: 'General Prompt',
          content: `You are a helpful Ai assistant. When responding:

1. **Clarify**: If my request is unclear, ask one brief question before proceeding
2. **Structure**: Organize responses with headings, bullets, or numbered steps when appropriate
3. **Concise**: Be thorough but avoid unnecessary filler—get to the point
4. **Adapt**: Match my tone—casual for quick questions, professional for business tasks
5. **Next Steps**: End with a suggestion or question to keep momentum going

Ready to help with anything!`,
        };

        // Create default prompt for workspace
        await invokeSpaceContent('create_prompt', {
          space_id: workspace.id,
          title: promptData.title,
          content: promptData.content,
          is_default: true,
        });

        // Increment use count if template was used
        if (defaultPrompt?.id) {
          await invokeSpaceContent('increment_template_use', {
            template_type: 'prompt',
            template_id: defaultPrompt.id,
          });
        }
      }

      return workspace;
    },
    onSuccess: async (newSpace) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space-assignments'] });
      switchSpace(newSpace.id);
      
      // Log activity
      if (user) {
        await logActivity({
          appSection: 'workspace',
          actorId: user.id,
          action: 'created',
          resourceType: 'space',
          resourceId: newSpace.id,
          resourceName: newSpace.name,
          workspaceId: newSpace.id,
        });
      }
      
      toast({
        title: 'Space created',
        description: `${newSpace.name} has been created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string; 
      description?: string; 
      color_code?: string; 
      is_archived?: boolean;
      ai_model?: string;
      ai_instructions?: string;
      compliance_rule?: string;
    }) => {
      const { error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'update_workspace', workspace_id: id, ...updates },
      });

      if (error) throw error;
      
      // Return the updates to check in onSuccess
      return { id, updates };
    },
    onSuccess: async ({ id, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      
      // Log appropriate activity based on what changed
      if (user) {
        await logActivity({
          appSection: 'workspace',
          actorId: user.id,
          action: 'updated',
          resourceType: updates.ai_model !== undefined || updates.ai_instructions !== undefined ? 'settings' : 'space',
          resourceId: id,
          workspaceId: id,
          details: { updated_fields: Object.keys(updates) }
        });
      }
      
      // Only show toast if not just updating color_code
      const isOnlyColorChange = Object.keys(updates).length === 1 && 'color_code' in updates;
      if (!isOnlyColorChange) {
        toast({
          title: 'Space updated',
          description: 'Space has been updated successfully',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'delete_workspace', workspace_id: id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({
        title: 'Space deleted',
        description: 'Space has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ spaceId, isPinned }: { spaceId: string; isPinned: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'toggle_pin', workspace_id: spaceId, is_pinned: isPinned },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-assignments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ spaceId, isArchived }: { spaceId: string; isArchived: boolean }) => {
      const { data, error } = await supabase.functions.invoke('space-operations', {
        body: { action: 'toggle_archive', workspace_id: spaceId, is_archived: isArchived },
      });

      if (error) throw error;
      return { spaceId, newArchivedState: data.newArchivedState };
    },
    onSuccess: async ({ spaceId, newArchivedState }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      
      // Log activity
      if (user) {
        await logActivity({
          appSection: 'workspace',
          actorId: user.id,
          action: newArchivedState ? 'archived' : 'unarchived',
          resourceType: 'space',
          resourceId: spaceId,
          workspaceId: spaceId,
        });
      }
      
      toast({
        title: 'Space updated',
        description: 'Space archive status has been updated',
      });
    },
  });

  const remixSpaceMutation = useMutation({
    mutationFn: async (data: {
      sourceSpaceId: string;
      name: string;
      copyFiles: boolean;
      copyChats: boolean;
      copyTasks: boolean;
      copyKnowledgeBase: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch source space details
      const { data: sourceSpace, error: sourceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', data.sourceSpaceId)
        .single();

      if (sourceError) throw sourceError;

      // 2. Create new workspace via edge function
      const workspaceResult = await invokeSpaceContent('create_workspace', {
        name: data.name,
        description: sourceSpace.description,
        color_code: sourceSpace.color_code,
        ai_model: sourceSpace.ai_model,
        ai_instructions: sourceSpace.ai_instructions,
        compliance_rule: sourceSpace.compliance_rule,
        file_quota_mb: sourceSpace.file_quota_mb || 1000,
      });

      if (!workspaceResult?.data) throw new Error('Failed to create workspace');
      const newWorkspace = workspaceResult.data;

      // 3. Copy space_personas via edge function
      const { data: personas } = await supabase
        .from('space_personas')
        .select('*')
        .eq('space_id', data.sourceSpaceId);

      if (personas && personas.length > 0) {
        await invokeSpaceContent('bulk_create_personas', {
          personas: personas.map(p => ({
            space_id: newWorkspace.id,
            name: p.name,
            description: p.description,
            system_prompt: p.system_prompt,
            is_default: p.is_default,
          })),
        });
      }

      // 4. Copy space_prompts via edge function
      const { data: prompts } = await supabase
        .from('space_prompts')
        .select('*')
        .eq('space_id', data.sourceSpaceId);

      if (prompts && prompts.length > 0) {
        await invokeSpaceContent('bulk_create_prompts', {
          prompts: prompts.map(p => ({
            space_id: newWorkspace.id,
            title: p.title,
            content: p.content,
            category: p.category,
          })),
        });
      }

      // 5. Copy additional content via edge function (files, chats, tasks, knowledge base)
      if (data.copyFiles || data.copyChats || data.copyTasks || data.copyKnowledgeBase) {
        await invokeSpaceContent('copy_space_content', {
          source_space_id: data.sourceSpaceId,
          target_space_id: newWorkspace.id,
          copy_files: data.copyFiles,
          copy_chats: data.copyChats,
          copy_tasks: data.copyTasks,
          copy_knowledge_base: data.copyKnowledgeBase,
        });
      }

      return newWorkspace;
    },
    onSuccess: async (newSpace) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space-assignments'] });
      
      // Log activity
      if (user) {
        await logActivity({
          appSection: 'workspace',
          actorId: user.id,
          action: 'created',
          resourceType: 'space',
          resourceId: newSpace.id,
          resourceName: newSpace.name,
          workspaceId: newSpace.id,
          details: { remix: true }
        });
      }
      
      toast({
        title: 'Space remixed successfully!',
        description: `${newSpace.name} has been created`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to update workspace's selected persona
  const updateSelectedPersonaMutation = useMutation({
    mutationFn: async ({ workspaceId, personaId }: { workspaceId: string; personaId: string }) => {
      const { error } = await supabase
        .from('workspaces')
        .update({ selected_persona_id: personaId })
        .eq('id', workspaceId);
      if (error) throw error;
      return { workspaceId, personaId };
    },
    onSuccess: ({ workspaceId, personaId }) => {
      // Update cache directly instead of invalidating to prevent refetch cascade
      queryClient.setQueryData(['spaces', user?.id], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(space => 
          space.id === workspaceId 
            ? { ...space, selected_persona_id: personaId }
            : space
        );
      });
    },
  });

  return {
    spaces,
    currentSpace,
    isLoading,
    isSpaceReady,
    switchSpace,
    createSpace: createSpaceMutation.mutate,
    updateSpace: updateSpaceMutation.mutate,
    deleteSpace: deleteSpaceMutation.mutate,
    togglePin: togglePinMutation.mutate,
    toggleArchive: toggleArchiveMutation.mutate,
    remixSpace: remixSpaceMutation.mutateAsync,
    updateSelectedPersona: updateSelectedPersonaMutation.mutateAsync,
    isCreatingSpace: createSpaceMutation.isPending,
    isUpdatingSpace: updateSpaceMutation.isPending,
    isDeletingSpace: deleteSpaceMutation.isPending,
    isRemixingSpace: remixSpaceMutation.isPending,
  };
}
