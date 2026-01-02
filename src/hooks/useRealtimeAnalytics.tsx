import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveStats {
  activeUsers: number;
  requestsThisMinute: number;
  tokensThisHour: number;
  costToday: number;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  model: string;
  tokens: number;
  cost: number;
}

export interface RealtimeAnalyticsState {
  liveStats: LiveStats;
  activityFeed: ActivityLogEntry[];
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  lastUpdated: Date | null;
}

export const useRealtimeAnalytics = (onDataChange?: () => void) => {
  const [state, setState] = useState<RealtimeAnalyticsState>({
    liveStats: {
      activeUsers: 0,
      requestsThisMinute: 0,
      tokensThisHour: 0,
      costToday: 0,
    },
    activityFeed: [],
    connectionStatus: 'disconnected',
    lastUpdated: null,
  });

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel('usage_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_logs',
        },
        async (payload) => {
          console.log('Real-time usage log received:', payload);
          
          // Fetch user email for the new log
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', payload.new.user_id)
            .single();

          const newEntry: ActivityLogEntry = {
            id: payload.new.id,
            timestamp: payload.new.created_at,
            userEmail: profile?.email || 'Unknown',
            model: payload.new.model || 'Unknown',
            tokens: payload.new.tokens_used || 0,
            cost: payload.new.cost || 0,
          };

          setState((prev) => ({
            ...prev,
            activityFeed: [newEntry, ...prev.activityFeed].slice(0, 50),
            lastUpdated: new Date(),
          }));

          // Refresh live stats
          await refreshLiveStats();

          // Trigger parent refresh callback
          if (onDataChange) {
            onDataChange();
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setState((prev) => ({ ...prev, connectionStatus: 'connected' }));
        } else if (status === 'CHANNEL_ERROR') {
          setState((prev) => ({ ...prev, connectionStatus: 'disconnected' }));
        } else if (status === 'TIMED_OUT') {
          setState((prev) => ({ ...prev, connectionStatus: 'reconnecting' }));
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onDataChange]);

  const loadInitialData = async () => {
    await Promise.all([refreshLiveStats(), loadActivityFeed()]);
  };

  const refreshLiveStats = async () => {
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    const hourAgo = new Date(now.getTime() - 3600000);
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const [requestsResult, tokensResult, costResult, activeUsersResult] = await Promise.all([
      supabase
        .from('usage_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', minuteAgo.toISOString()),
      
      supabase
        .from('usage_logs')
        .select('tokens_used')
        .gte('created_at', hourAgo.toISOString()),
      
      supabase
        .from('usage_logs')
        .select('cost')
        .gte('created_at', todayStart.toISOString()),
      
      supabase
        .from('usage_logs')
        .select('user_id')
        .gte('created_at', minuteAgo.toISOString()),
    ]);

    const tokensThisHour = tokensResult.data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
    const costToday = costResult.data?.reduce((sum, log) => sum + (log.cost || 0), 0) || 0;
    const uniqueUsers = new Set(activeUsersResult.data?.map(log => log.user_id) || []).size;

    setState((prev) => ({
      ...prev,
      liveStats: {
        activeUsers: uniqueUsers,
        requestsThisMinute: requestsResult.count || 0,
        tokensThisHour,
        costToday,
      },
      lastUpdated: new Date(),
    }));
  };

  const loadActivityFeed = async () => {
    const { data: logs } = await supabase
      .from('usage_logs')
      .select(`
        id,
        created_at,
        user_id,
        model,
        tokens_used,
        cost,
        profiles (email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) {
      const feed: ActivityLogEntry[] = logs.map((log: any) => ({
        id: log.id,
        timestamp: log.created_at,
        userEmail: log.profiles?.email || 'Unknown',
        model: log.model || 'Unknown',
        tokens: log.tokens_used || 0,
        cost: log.cost || 0,
      }));

      setState((prev) => ({
        ...prev,
        activityFeed: feed,
      }));
    }
  };

  const reconnect = () => {
    setState((prev) => ({ ...prev, connectionStatus: 'reconnecting' }));
    loadInitialData();
  };

  return {
    ...state,
    reconnect,
    refresh: loadInitialData,
  };
};
