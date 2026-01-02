import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/logActivity';

export interface SpacePersona {
  id: string;
  space_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  created_by: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useSpacePersonas(spaceId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: personas = [], isLoading } = useQuery({
    queryKey: ['space-personas', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'get_space_personas', spaceId },
      });

      if (error) throw error;
      return data.data as SpacePersona[];
    },
    enabled: !!spaceId,
  });

  const createPersonaMutation = useMutation({
    mutationFn: async (persona: Omit<SpacePersona, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'space_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'create_space_persona', spaceId, persona },
      });

      if (error) throw error;
      return { persona: data.data as SpacePersona, userId: user.id };
    },
    onSuccess: async ({ persona, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-personas', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'created',
        resourceType: 'persona',
        resourceId: persona.id,
        resourceName: persona.name,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Persona created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create persona', description: error.message, variant: 'destructive' });
    },
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async ({ personaId, updates }: { personaId: string; updates: Partial<SpacePersona> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const persona = personas.find(p => p.id === personaId);

      const { error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'update_space_persona', personaId, updates },
      });

      if (error) throw error;
      return { personaId, personaName: persona?.name, userId: user.id, updates };
    },
    onSuccess: async ({ personaId, personaName, userId, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['space-personas', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'updated',
        resourceType: 'persona',
        resourceId: personaId,
        resourceName: personaName,
        workspaceId: spaceId,
        details: { updated_fields: Object.keys(updates) }
      });
      
      toast({ title: 'Persona updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update persona', description: error.message, variant: 'destructive' });
    },
  });

  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const persona = personas.find(p => p.id === personaId);

      if (persona?.is_default) {
        throw new Error('Cannot delete the default persona');
      }

      const { error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'delete_space_persona', personaId },
      });

      if (error) throw error;
      return { personaId, personaName: persona?.name, userId: user.id };
    },
    onSuccess: async ({ personaId, personaName, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-personas', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'deleted',
        resourceType: 'persona',
        resourceId: personaId,
        resourceName: personaName,
        workspaceId: spaceId,
      });
      
      toast({ title: 'Persona deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete persona', description: error.message, variant: 'destructive' });
    },
  });

  const setDefaultPersonaMutation = useMutation({
    mutationFn: async (personaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const persona = personas.find(p => p.id === personaId);

      const { error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'set_default_space_persona', spaceId, personaId },
      });

      if (error) throw error;
      return { personaId, personaName: persona?.name, userId: user.id };
    },
    onSuccess: async ({ personaId, personaName, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-personas', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'updated',
        resourceType: 'persona',
        resourceId: personaId,
        resourceName: personaName,
        workspaceId: spaceId,
        details: { change: 'set_as_default' }
      });
      
      toast({ title: 'Default persona updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to set default', description: error.message, variant: 'destructive' });
    },
  });

  return {
    personas,
    isLoading,
    createPersona: createPersonaMutation.mutate,
    updatePersona: updatePersonaMutation.mutate,
    deletePersona: deletePersonaMutation.mutate,
    setDefaultPersona: setDefaultPersonaMutation.mutate,
    isCreating: createPersonaMutation.isPending,
    isUpdating: updatePersonaMutation.isPending,
    isDeleting: deletePersonaMutation.isPending,
  };
}
