/**
 * Presentation Layer - Queue Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

import type { CosmoPriority } from '@/cosmo/contracts';

/**
 * QueueStatus - Status values for queue item display
 */
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';

/**
 * QueuedRequest - Queue item for admin panel display
 */
export interface QueuedRequest {
  id: string;
  priority: CosmoPriority;
  priority_score: number;
  request_type: string;
  request_payload: Record<string, unknown>;
  user_id: string;
  workspace_id: string;
  status: QueueStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result_payload: Record<string, unknown> | null;
  error_message: string | null;
  callback_url: string | null;
  expires_at: string;
  retry_count: number;
  max_retries: number;
  processing_node: string | null;
}

/**
 * QueueStats - Queue statistics for admin dashboard display
 */
export interface QueueStats {
  pending: { low: number; normal: number; high: number; critical: number; total: number };
  processing: number;
  completed24h: number;
  failed24h: number;
  avgWaitTimeMs: number;
  avgProcessingTimeMs: number;
  throughputPerMinute: number;
  oldestPendingAge: number;
}

/**
 * TimeSeriesPoint - Time series data point for queue activity charts
 */
export interface TimeSeriesPoint {
  hour: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}
