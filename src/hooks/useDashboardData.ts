import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardActivity {
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

export interface DashboardChat {
  id: string;
  title: string;
  model: string;
  updated_at: string;
  user_id: string;
}

export function useDashboardData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get user's profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  // Recent Activity (Top 10) from unified activity_log
  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError || !activityData || activityData.length === 0) {
        return [];
      }

      const actorIds = Array.from(
        new Set(activityData.map((a: any) => a.actor_id).filter(Boolean))
      );
      const workspaceIds = Array.from(
        new Set(activityData.map((a: any) => a.workspace_id).filter(Boolean))
      );

      const [profilesResult, workspacesResult] = await Promise.all([
        actorIds.length > 0 
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', actorIds as string[])
          : Promise.resolve({ data: [], error: null }),
        workspaceIds.length > 0
          ? supabase.from('workspaces').select('id, name').in('id', workspaceIds as string[])
          : Promise.resolve({ data: [], error: null })
      ]);

      const profileMap = new Map(
        (profilesResult.data || []).map((p: any) => [p.id, p])
      );
      const workspaceMap = new Map(
        (workspacesResult.data || []).map((w: any) => [w.id, w])
      );

      return activityData.map((activity: any) => ({
        ...activity,
        profiles: profileMap.get(activity.actor_id) || null,
        workspace: workspaceMap.get(activity.workspace_id) || null,
      })) as DashboardActivity[];
    },
  });

  // Recent Chats (Top 5)
  const { data: recentChats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ['dashboard-chats', user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      return (data || []) as DashboardChat[];
    },
  });

  // Delete chat mutation - routes through edge function for server-authoritative access
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { data, error } = await supabase.functions.invoke('chat-messages', {
        body: { action: 'delete_chat', chat_id: chatId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-chats'] });
    },
  });

  const deleteChat = (chatId: string) => {
    deleteChatMutation.mutate(chatId);
  };

  const invalidateActivity = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
  };

  return {
    profile,
    recentActivity,
    recentChats,
    deleteChat,
    invalidateActivity,
    isLoading: profileLoading || activityLoading || chatsLoading,
  };
}
