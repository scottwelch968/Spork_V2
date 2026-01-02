import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bot } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChatContext } from '@/presentation/types';

interface Persona {
  id: string;
  name: string;
  icon: string | null;
}

interface PersonaSelectorProps {
  value?: string;
  onChange: (personaId: string) => void;
  context?: ChatContext;
}

export function PersonaSelector({ value, onChange, context }: PersonaSelectorProps) {
  const { user } = useAuth();

  const isWorkspace = context?.type === 'workspace';
  const workspaceId = isWorkspace ? context.workspaceId : null;

  const { data: personas = [], isLoading } = useQuery({
    queryKey: isWorkspace 
      ? ['space-personas', workspaceId] 
      : ['personas', user?.id],
    queryFn: async () => {
      if (isWorkspace && workspaceId) {
        const { data, error } = await supabase
          .from('space_personas')
          .select('id, name, icon')
          .eq('space_id', workspaceId)
          .order('is_default', { ascending: false })
          .order('name', { ascending: true });

        if (error) throw error;
        return (data || []) as Persona[];
      } else if (user?.id) {
        const { data, error } = await supabase
          .from('personas')
          .select('id, name, icon')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Persona[];
      }
      return [] as Persona[];
    },
    enabled: isWorkspace ? !!workspaceId : !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent frequent refetches
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Show skeleton while loading to reserve space and prevent pop-in
  if (isLoading) {
    return (
      <div className="w-[200px] h-10 rounded-full border border-border bg-muted/50 animate-pulse" />
    );
  }

  // Don't show selector if no personas available
  if (personas.length === 0) {
    return null;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] rounded-full">
        <SelectValue placeholder="Select persona" />
      </SelectTrigger>
      <SelectContent>
        {personas.map((persona) => (
          <SelectItem key={persona.id} value={persona.id}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>{persona.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
