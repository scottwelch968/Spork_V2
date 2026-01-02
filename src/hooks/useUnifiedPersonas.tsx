import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ChatContext } from '@/presentation/types';

export interface UnifiedPersona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  is_default: boolean;
}

export function useUnifiedPersonas(context: ChatContext) {
  const { user } = useAuth();
  
  const isPersonal = context.type === 'personal';
  const workspaceId = context.type === 'workspace' ? context.workspaceId : null;

  return useQuery({
    queryKey: isPersonal ? ['personas', user?.id] : ['space-personas', workspaceId],
    queryFn: async () => {
      if (isPersonal) {
        if (!user?.id) return [];
        
        const { data, error } = await supabase
          .from('personas')
          .select('id, name, description, system_prompt, icon, is_default')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as UnifiedPersona[];
      } else {
        if (!workspaceId) return [];
        
        const { data, error } = await supabase
          .from('space_personas')
          .select('id, name, description, system_prompt, icon, is_default')
          .eq('space_id', workspaceId)
          .order('is_default', { ascending: false })
          .order('name', { ascending: true });

        if (error) throw error;
        return data as UnifiedPersona[];
      }
    },
    enabled: isPersonal ? !!user?.id : !!workspaceId,
  });
}
