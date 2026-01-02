import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BatchStats {
  activeBatches: number;
  avgBatchSize: number;
  apiCallsSaved24h: number;
  tokensSaved24h: number;
  successRate: number;
  totalBatched24h: number;
}

export interface BatchItem {
  id: string;
  similarity_hash: string;
  status: 'collecting' | 'processing' | 'completed' | 'failed';
  request_type: string;
  request_ids: string[];
  model_used: string | null;
  tokens_saved: number;
  api_calls_saved: number;
  created_at: string;
  processed_at: string | null;
  window_expires_at: string;
  error_message: string | null;
}

export function useCosmoBatches() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['cosmo-batch-stats'],
    queryFn: async (): Promise<BatchStats> => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Active batches
      const { count: activeBatches } = await supabase
        .from('cosmo_request_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'collecting');

      // Completed batches in 24h
      const { data: completed24h } = await supabase
        .from('cosmo_request_batches')
        .select('request_ids, tokens_saved, api_calls_saved')
        .eq('status', 'completed')
        .gte('processed_at', dayAgo);

      // Failed batches in 24h
      const { count: failed24h } = await supabase
        .from('cosmo_request_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('processed_at', dayAgo);

      let totalRequests = 0;
      let totalTokensSaved = 0;
      let totalApiCallsSaved = 0;

      if (completed24h) {
        for (const batch of completed24h) {
          totalRequests += batch.request_ids?.length || 0;
          totalTokensSaved += batch.tokens_saved || 0;
          totalApiCallsSaved += batch.api_calls_saved || 0;
        }
      }

      const completedCount = completed24h?.length || 0;
      const avgBatchSize = completedCount > 0 ? totalRequests / completedCount : 0;
      const successRate = completedCount + (failed24h || 0) > 0 
        ? completedCount / (completedCount + (failed24h || 0)) 
        : 1;

      return {
        activeBatches: activeBatches || 0,
        avgBatchSize: Math.round(avgBatchSize * 10) / 10,
        apiCallsSaved24h: totalApiCallsSaved,
        tokensSaved24h: totalTokensSaved,
        successRate: Math.round(successRate * 100),
        totalBatched24h: totalRequests,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentBatches, isLoading: batchesLoading } = useQuery({
    queryKey: ['cosmo-recent-batches'],
    queryFn: async (): Promise<BatchItem[]> => {
      const { data, error } = await supabase
        .from('cosmo_request_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching batches:', error);
        return [];
      }

      return data as BatchItem[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return {
    stats: stats || {
      activeBatches: 0,
      avgBatchSize: 0,
      apiCallsSaved24h: 0,
      tokensSaved24h: 0,
      successRate: 100,
      totalBatched24h: 0,
    },
    recentBatches: recentBatches || [],
    isLoading: statsLoading || batchesLoading,
  };
}
