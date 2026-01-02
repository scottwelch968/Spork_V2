import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import type { CosmoPriority } from '@/cosmo/contracts';
import type { QueuedRequest, QueueStats, TimeSeriesPoint } from '@/presentation/types';

const SESSION_KEY = 'system_session_token';

// Helper to get session token
function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

// Helper to call admin-data edge function
async function callAdminData(sessionToken: string, action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: sessionToken, ...params }
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useCosmoQueue() {
  const queryClient = useQueryClient();
  const { user } = useSystemAuth();
  const [isConnected, setIsConnected] = useState(true);

  // Fetch queue items via admin-data edge function (service role)
  const { data: queueItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['cosmo-queue-items'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return [];
      
      const result = await callAdminData(sessionToken, 'cosmo_get_queue_items', { limit: 100 });
      return (result.data || []) as QueuedRequest[];
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Calculate stats from queue items
  const stats: QueueStats = {
    pending: { low: 0, normal: 0, high: 0, critical: 0, total: 0 },
    processing: 0,
    completed24h: 0,
    failed24h: 0,
    avgWaitTimeMs: 0,
    avgProcessingTimeMs: 0,
    throughputPerMinute: 0,
    oldestPendingAge: 0,
  };

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const minuteAgo = now - 60 * 1000;

  let totalWaitTime = 0;
  let totalProcessingTime = 0;
  let completedWithTiming = 0;
  let completedInMinute = 0;

  queueItems.forEach((item) => {
    if (item.status === 'pending') {
      stats.pending[item.priority]++;
      stats.pending.total++;
      const age = now - new Date(item.created_at).getTime();
      if (age > stats.oldestPendingAge) {
        stats.oldestPendingAge = age;
      }
    } else if (item.status === 'processing') {
      stats.processing++;
    } else if (item.status === 'completed') {
      const completedAt = new Date(item.completed_at || '').getTime();
      if (completedAt > dayAgo) {
        stats.completed24h++;
      }
      if (completedAt > minuteAgo) {
        completedInMinute++;
      }
      if (item.started_at && item.completed_at) {
        const startedAt = new Date(item.started_at).getTime();
        const createdAt = new Date(item.created_at).getTime();
        totalWaitTime += startedAt - createdAt;
        totalProcessingTime += completedAt - startedAt;
        completedWithTiming++;
      }
    } else if (item.status === 'failed') {
      const completedAt = new Date(item.completed_at || '').getTime();
      if (completedAt > dayAgo) {
        stats.failed24h++;
      }
    }
  });

  if (completedWithTiming > 0) {
    stats.avgWaitTimeMs = totalWaitTime / completedWithTiming;
    stats.avgProcessingTimeMs = totalProcessingTime / completedWithTiming;
  }
  stats.throughputPerMinute = completedInMinute;

  // Generate time series data (last 24 hours, hourly buckets)
  const timeSeries: TimeSeriesPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now - i * 60 * 60 * 1000);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    
    const hourData: TimeSeriesPoint = {
      hour: hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    queueItems.forEach((item) => {
      const createdAt = new Date(item.created_at).getTime();
      const completedAt = item.completed_at ? new Date(item.completed_at).getTime() : null;
      
      if (item.status === 'completed' && completedAt && completedAt >= hourStart.getTime() && completedAt < hourEnd.getTime()) {
        hourData.completed++;
      } else if (item.status === 'failed' && completedAt && completedAt >= hourStart.getTime() && completedAt < hourEnd.getTime()) {
        hourData.failed++;
      } else if (item.status === 'pending' && createdAt >= hourStart.getTime() && createdAt < hourEnd.getTime()) {
        hourData.pending++;
      } else if (item.status === 'processing' && createdAt >= hourStart.getTime() && createdAt < hourEnd.getTime()) {
        hourData.processing++;
      }
    });

    timeSeries.push(hourData);
  }

  // Cancel request mutation - routed through admin-data edge function
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_cancel_request', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-queue-items'] });
      toast.success('Request cancelled');
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  // Reprioritize mutation - routed through admin-data edge function
  const reprioritizeMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: CosmoPriority }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_reprioritize_request', { id, priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-queue-items'] });
      toast.success('Priority updated');
    },
    onError: (error) => {
      toast.error(`Failed to reprioritize: ${error.message}`);
    },
  });

  // Trigger processor manually
  const triggerProcessorMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cosmo-queue-processor');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-queue-items'] });
      toast.success(`Processed ${data?.processed || 0} requests`);
    },
    onError: (error) => {
      toast.error(`Processor failed: ${error.message}`);
    },
  });

  // Set up realtime subscription (read-only - just for UI updates)
  useEffect(() => {
    const channel = supabase
      .channel('cosmo-queue-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cosmo_request_queue',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cosmo-queue-items'] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    queueItems,
    stats,
    timeSeries,
    isLoading: itemsLoading,
    isConnected,
    refetch: refetchItems,
    cancelRequest: cancelMutation.mutate,
    reprioritize: reprioritizeMutation.mutate,
    triggerProcessor: triggerProcessorMutation.mutate,
    isProcessing: triggerProcessorMutation.isPending,
  };
}
