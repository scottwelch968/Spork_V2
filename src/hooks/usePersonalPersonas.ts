import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Persona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  is_default: boolean;
}

export function usePersonalPersonas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: personas = [], isLoading } = useQuery({
    queryKey: ['personal-personas', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'get_personal_personas' },
      });

      if (error) throw error;
      return data.data as Persona[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const createPersonaMutation = useMutation({
    mutationFn: async (persona: Omit<Persona, 'id'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'create_personal_persona', persona },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-personas', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create persona',
      });
    },
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Persona> }) => {
      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'update_personal_persona', personaId: id, updates },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-personas', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update persona',
      });
    },
  });

  const deletePersonaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('persona-operations', {
        body: { action: 'delete_personal_persona', personaId: id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-personas', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete persona',
      });
    },
  });

  return {
    personas,
    isLoading,
    createPersona: createPersonaMutation.mutate,
    updatePersona: updatePersonaMutation.mutate,
    deletePersona: deletePersonaMutation.mutate,
  };
}
