import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PersonaTemplate {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  use_count: number | null;
}

export function usePersonaActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Save persona from template to user's personal library
  const savePersonaMutation = useMutation({
    mutationFn: async (template: PersonaTemplate) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: {
          action: 'create_personal_persona',
          persona: {
            name: template.name,
            description: template.description,
            system_prompt: template.system_prompt,
            is_default: false,
          },
        },
      });

      if (error) throw error;

      // Increment use count via template operations
      await supabase.functions.invoke('template-operations', {
        body: { action: 'increment_persona_template_use', templateId: template.id },
      });

      return template;
    },
    onSuccess: (template) => {
      toast({
        title: 'Persona Saved',
        description: `"${template.name}" has been added to your personas.`,
      });
      queryClient.invalidateQueries({ queryKey: ['personal-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save persona',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Import persona template to workspace
  const importPersonaToWorkspaceMutation = useMutation({
    mutationFn: async ({ template, workspaceId }: { template: PersonaTemplate; workspaceId: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('persona-operations', {
        body: {
          action: 'create_space_persona',
          spaceId: workspaceId,
          persona: {
            name: template.name,
            description: template.description,
            system_prompt: template.system_prompt,
            icon: template.icon,
            is_default: false,
          },
        },
      });

      if (error) throw error;

      // Increment use count
      await supabase.functions.invoke('template-operations', {
        body: { action: 'increment_persona_template_use', templateId: template.id },
      });

      return template;
    },
    onSuccess: (template) => {
      toast({
        title: 'Persona imported',
        description: `${template.name} has been added to your library`,
      });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['space-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to import persona',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    savePersona: savePersonaMutation.mutate,
    isSaving: savePersonaMutation.isPending,
    importPersonaToWorkspace: importPersonaToWorkspaceMutation.mutate,
    isImporting: importPersonaToWorkspaceMutation.isPending,
  };
}
