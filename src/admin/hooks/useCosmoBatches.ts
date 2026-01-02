import { useQuery } from '@tanstack/react-query';

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
  // Stub for V2: Batching feature not fully exposed yet
  return {
    stats: {
      activeBatches: 0,
      avgBatchSize: 0,
      apiCallsSaved24h: 0,
      tokensSaved24h: 0,
      successRate: 100,
      totalBatched24h: 0,
    } as BatchStats,
    recentBatches: [] as BatchItem[],
    isLoading: false,
  };
}
