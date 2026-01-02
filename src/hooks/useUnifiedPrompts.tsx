import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ChatContext } from '@/presentation/types';

export interface UnifiedPrompt {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

export function useUnifiedPrompts(context: ChatContext) {
  const { user } = useAuth();
  
  const isPersonal = context.type === 'personal';
  const workspaceId = context.type === 'workspace' ? context.workspaceId : null;

  return useQuery({
    queryKey: isPersonal ? ['prompts', user?.id] : ['space-prompts', workspaceId],
    queryFn: async () => {
      if (isPersonal) {
        if (!user?.id) return [];
        
        const { data, error } = await supabase
          .from('prompts')
          .select('id, title, content, category')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as UnifiedPrompt[];
      } else {
        if (!workspaceId) return [];
        
        const { data, error } = await supabase
          .from('space_prompts')
          .select('id, title, content, category')
          .eq('space_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as UnifiedPrompt[];
      }
    },
    enabled: isPersonal ? !!user?.id : !!workspaceId,
  });
}
