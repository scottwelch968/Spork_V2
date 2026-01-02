import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityLogEntry {
  id: string;
  action: string;
  actor_id: string | null;
  actor_type: string;
  app_section: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  workspace_id: string | null;
  details: any;
  created_at: string;
  profiles: { id: string; first_name: string | null; last_name: string | null } | null;
  workspace: { id: string; name: string } | null;
}

export interface ActivityChat {
  id: string;
  title: string;
  model: string;
  updated_at: string;
  user_id: string;
}

export function useActivityLog() {
  const { user } = useAuth();

  // Fetch all activity from unified activity_log table
  const { data: activityLog = [], isLoading: activityLoading } = useQuery({
    queryKey: ['all-activity', user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data: activityData, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error || !activityData || activityData.length === 0) {
        return [];
      }

      const actorIds = Array.from(new Set(activityData.map((a: any) => a.actor_id).filter(Boolean)));
      const workspaceIds = Array.from(new Set(activityData.map((a: any) => a.workspace_id).filter(Boolean)));

      const [profilesResult, workspacesResult] = await Promise.all([
        actorIds.length > 0 
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', actorIds as string[])
          : Promise.resolve({ data: [], error: null }),
        workspaceIds.length > 0
          ? supabase.from('workspaces').select('id, name').in('id', workspaceIds as string[])
          : Promise.resolve({ data: [], error: null })
      ]);

      const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]));
      const workspaceMap = new Map((workspacesResult.data || []).map((w: any) => [w.id, w]));

      return activityData.map((activity: any) => ({
        ...activity,
        profiles: profileMap.get(activity.actor_id) || null,
        workspace: workspaceMap.get(activity.workspace_id) || null,
      })) as ActivityLogEntry[];
    },
  });

  // Fetch all chats
  const { data: allChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['all-chats', user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(200);
      return (data || []) as ActivityChat[];
    },
  });

  return {
    activityLog,
    allChats,
    isLoading: activityLoading || chatsLoading,
  };
}
