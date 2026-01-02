import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cosmo2 } from '@/cosmo2/client';
import type { CosmoPriority } from '@/cosmo/contracts';
import type { QueuedRequest, QueueStats, TimeSeriesPoint } from '@/presentation/types';

export function useCosmoQueue() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  // Fetch queue stats from V2
  const { data: queueStatus, isLoading } = useQuery({
    queryKey: ['cosmo-queue-status'],
    queryFn: () => cosmo2.getQueueStatus(),
    refetchInterval: 5000,
  });

  // Derived stats
  const stats: QueueStats = {
    pending: {
      low: 0,
      normal: (queueStatus?.depth || 0), // Assessing all as normal if breakdown unseen
      high: 0,
      critical: 0,
      total: (queueStatus?.depth || 0)
    },
    processing: queueStatus?.active || 0,
    completed24h: 0, // V2 doesn't report 24h stats in this endpoint yet
    failed24h: queueStatus?.failed || 0,
    avgWaitTimeMs: 0,
    avgProcessingTimeMs: 0,
    throughputPerMinute: 0,
    oldestPendingAge: queueStatus?.oldestJobTs ? Date.now() - new Date(queueStatus.oldestJobTs).getTime() : 0,
  };

  const queueItems: QueuedRequest[] = []; // Not exposed in V2 yet
  const timeSeries: TimeSeriesPoint[] = []; // Not exposed in V2 yet

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { /* Stub */ },
    onSuccess: () => toast.info('Cancellation not supported in V2 yet'),
  });

  const reprioritizeMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: CosmoPriority }) => { /* Stub */ },
    onSuccess: () => toast.info('Reprioritization not supported in V2 yet'),
  });

  const triggerProcessorMutation = useMutation({
    mutationFn: async () => { /* Stub */ },
    onSuccess: () => toast.info('Queue processing is managed automatically by COSMO OS'),
  });

  return {
    queueItems,
    stats,
    timeSeries,
    isLoading,
    isConnected, // Assume connected if query succeeds
    refetch: () => queryClient.invalidateQueries({ queryKey: ['cosmo-queue-status'] }),
    cancelRequest: cancelMutation.mutate,
    reprioritize: reprioritizeMutation.mutate,
    triggerProcessor: triggerProcessorMutation.mutate,
    isProcessing: triggerProcessorMutation.isPending,
  };
}
