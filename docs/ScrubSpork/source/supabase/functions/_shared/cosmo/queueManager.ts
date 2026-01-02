/**
 * COSMO Queue Manager
 * 
 * Handles request queuing with priority levels for high-traffic scenarios.
 * Critical requests are processed first using a priority score system.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CosmoRequest, CosmoRequestType, CosmoPriority } from './types.ts';
import { createCosmoError } from './errors.ts';
import { info, warn, error as logError } from './logger.ts';

// ============= Types =============

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface QueuedRequest {
  id: string;
  priority: CosmoPriority;
  priorityScore: number;
  requestType: CosmoRequestType;
  requestPayload: CosmoRequest;
  userId?: string;
  workspaceId?: string;
  status: QueueStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  resultPayload?: unknown;
  errorMessage?: string;
  callbackUrl?: string;
  expiresAt: string;
  retryCount: number;
  maxRetries: number;
  processingNode?: string;
  estimatedWaitMs?: number;
}

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

export interface EnqueueOptions {
  priority?: CosmoPriority;
  callbackUrl?: string;
  expiresInMs?: number;
  maxRetries?: number;
}

// ============= Priority Score Calculation =============

const PRIORITY_BASE_SCORES: Record<CosmoPriority, number> = {
  critical: 100,
  high: 80,
  normal: 50,
  low: 20,
};

const REQUEST_TYPE_BONUS: Record<CosmoRequestType, number> = {
  webhook: 15,
  chat: 10,
  agent_action: 8,
  api_call: 5,
  system_task: 5,
  enhance_prompt: 3,
  image_generation: 2,
  knowledge_query: 2,
};

/**
 * Calculate priority score based on multiple factors
 */
export function calculatePriorityScore(
  priority: CosmoPriority,
  requestType: CosmoRequestType,
  ageMs: number = 0,
  workspaceTier?: string
): number {
  let score = PRIORITY_BASE_SCORES[priority] || 50;
  
  // Request type bonus
  score += REQUEST_TYPE_BONUS[requestType] || 0;
  
  // Age bonus (prevents starvation) - +1 per 10 seconds waiting, max +20
  const ageBonus = Math.min(Math.floor(ageMs / 10000), 20);
  score += ageBonus;
  
  // Workspace tier bonus
  if (workspaceTier === 'team' || workspaceTier === 'enterprise') {
    score += 10;
  } else if (workspaceTier === 'solo') {
    score += 5;
  }
  
  return score;
}

// ============= Queue Operations =============

/**
 * Add a request to the queue
 */
export async function enqueueRequest(
  request: CosmoRequest,
  supabase: SupabaseClient,
  options: EnqueueOptions = {}
): Promise<QueuedRequest> {
  const priority = options.priority || request.priority || 'normal';
  const requestType = request.requestType || 'chat';
  
  // Get workspace tier for priority calculation
  let workspaceTier: string | undefined;
  if (request.workspaceId) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('subscription_tier')
      .eq('id', request.workspaceId)
      .single();
    workspaceTier = workspace?.subscription_tier;
  }
  
  const priorityScore = calculatePriorityScore(priority, requestType, 0, workspaceTier);
  const expiresAt = new Date(Date.now() + (options.expiresInMs || 3600000)).toISOString(); // Default 1 hour
  
  const { data, error } = await supabase
    .from('cosmo_request_queue')
    .insert({
      priority,
      priority_score: priorityScore,
      request_type: requestType,
      request_payload: request,
      user_id: request.userId,
      workspace_id: request.workspaceId,
      callback_url: options.callbackUrl || request.callbackUrl,
      expires_at: expiresAt,
      max_retries: options.maxRetries || 3,
    })
    .select()
    .single();
  
  if (error) {
    logError('Failed to enqueue request', { error: error.message });
    throw createCosmoError('INTERNAL_ERROR', `Failed to enqueue request: ${error.message}`);
  }
  
  // Estimate wait time based on queue position
  const estimatedWaitMs = await estimateWaitTime(supabase, priorityScore);
  
  return {
    id: data.id,
    priority: data.priority,
    priorityScore: data.priority_score,
    requestType: data.request_type,
    requestPayload: data.request_payload,
    userId: data.user_id,
    workspaceId: data.workspace_id,
    status: data.status,
    createdAt: data.created_at,
    callbackUrl: data.callback_url,
    expiresAt: data.expires_at,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
    estimatedWaitMs,
  };
}

/**
 * Dequeue the next highest priority request (with row locking)
 */
export async function dequeueNext(
  supabase: SupabaseClient,
  processingNode: string = 'default'
): Promise<QueuedRequest | null> {
  // Use a transaction-like pattern with FOR UPDATE SKIP LOCKED
  // First, find and claim the next request atomically
  const { data, error } = await supabase
    .rpc('dequeue_cosmo_request', { p_processing_node: processingNode });
  
  if (error) {
    // If RPC doesn't exist, fall back to regular query
    if (error.code === '42883') {
      return await dequeueNextFallback(supabase, processingNode);
    }
    logError('Failed to dequeue request', { error: error.message });
    return null;
  }
  
  if (!data || data.length === 0) {
    return null;
  }
  
  const row = data[0];
  return {
    id: row.id,
    priority: row.priority,
    priorityScore: row.priority_score,
    requestType: row.request_type,
    requestPayload: row.request_payload,
    userId: row.user_id,
    workspaceId: row.workspace_id,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    callbackUrl: row.callback_url,
    expiresAt: row.expires_at,
    retryCount: row.retry_count,
    maxRetries: row.max_retries,
    processingNode: row.processing_node,
  };
}

/**
 * Fallback dequeue without RPC (less atomic but functional)
 */
async function dequeueNextFallback(
  supabase: SupabaseClient,
  processingNode: string
): Promise<QueuedRequest | null> {
  // Update priority scores for age bonus
  await updatePriorityScores(supabase);
  
  // Get next pending request
  const { data: pendingData, error: fetchError } = await supabase
    .from('cosmo_request_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('expires_at', new Date(Date.now() + 3600000).toISOString()) // Not expired
    .order('priority_score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (fetchError || !pendingData) {
    return null;
  }
  
  // Claim it
  const { data, error } = await supabase
    .from('cosmo_request_queue')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      processing_node: processingNode,
    })
    .eq('id', pendingData.id)
    .eq('status', 'pending') // Ensure still pending
    .select()
    .single();
  
  if (error || !data) {
    // Someone else claimed it, try again
    return null;
  }
  
  return {
    id: data.id,
    priority: data.priority,
    priorityScore: data.priority_score,
    requestType: data.request_type,
    requestPayload: data.request_payload,
    userId: data.user_id,
    workspaceId: data.workspace_id,
    status: data.status,
    createdAt: data.created_at,
    startedAt: data.started_at,
    callbackUrl: data.callback_url,
    expiresAt: data.expires_at,
    retryCount: data.retry_count,
    maxRetries: data.max_retries,
    processingNode: data.processing_node,
  };
}

/**
 * Update request status
 */
export async function updateQueueStatus(
  id: string,
  status: QueueStatus,
  supabase: SupabaseClient,
  result?: unknown,
  errorMessage?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  
  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }
  
  if (result !== undefined) {
    updates.result_payload = result;
  }
  
  if (errorMessage) {
    updates.error_message = errorMessage;
  }
  
  const { error } = await supabase
    .from('cosmo_request_queue')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    logError('Failed to update queue status', { id, status, error: error.message });
  }
}

/**
 * Increment retry count and reset to pending
 */
export async function retryRequest(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cosmo_request_queue')
    .select('retry_count, max_retries')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  if (data.retry_count >= data.max_retries) {
    await updateQueueStatus(id, 'failed', supabase, undefined, 'Max retries exceeded');
    return false;
  }
  
  const { error: updateError } = await supabase
    .from('cosmo_request_queue')
    .update({
      status: 'pending',
      retry_count: data.retry_count + 1,
      started_at: null,
      processing_node: null,
    })
    .eq('id', id);
  
  return !updateError;
}

/**
 * Cancel a queued request
 */
export async function cancelRequest(
  id: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from('cosmo_request_queue')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .in('status', ['pending', 'processing']);
  
  return !error;
}

/**
 * Update priority scores to include age bonus
 */
async function updatePriorityScores(supabase: SupabaseClient): Promise<void> {
  // This would ideally be an RPC but we'll do it client-side
  const { data: pending } = await supabase
    .from('cosmo_request_queue')
    .select('id, priority, request_type, created_at, priority_score')
    .eq('status', 'pending');
  
  if (!pending || pending.length === 0) return;
  
  const updates = pending.map((item) => {
    const ageMs = Date.now() - new Date(item.created_at).getTime();
    const newScore = calculatePriorityScore(
      item.priority,
      item.request_type,
      ageMs
    );
    return { id: item.id, priority_score: newScore };
  });
  
  // Batch update (simplified - in production use upsert or RPC)
  for (const update of updates) {
    if (update.priority_score !== pending.find(p => p.id === update.id)?.priority_score) {
      await supabase
        .from('cosmo_request_queue')
        .update({ priority_score: update.priority_score })
        .eq('id', update.id);
    }
  }
}

/**
 * Estimate wait time based on queue position
 */
async function estimateWaitTime(
  supabase: SupabaseClient,
  priorityScore: number
): Promise<number> {
  // Get count of requests with higher priority
  const { count } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gt('priority_score', priorityScore);
  
  // Get average processing time
  const { data: stats } = await supabase
    .from('cosmo_request_queue')
    .select('started_at, completed_at')
    .eq('status', 'completed')
    .not('started_at', 'is', null)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(100);
  
  let avgProcessingMs = 2000; // Default 2 seconds
  
  if (stats && stats.length > 0) {
    const totalMs = stats.reduce((sum, item) => {
      const start = new Date(item.started_at).getTime();
      const end = new Date(item.completed_at).getTime();
      return sum + (end - start);
    }, 0);
    avgProcessingMs = totalMs / stats.length;
  }
  
  return (count || 0) * avgProcessingMs;
}

// ============= Queue Statistics =============

/**
 * Get comprehensive queue statistics
 */
export async function getQueueStats(supabase: SupabaseClient): Promise<QueueStats> {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const minuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
  
  // Get pending counts by priority
  const pendingCounts = { low: 0, normal: 0, high: 0, critical: 0, total: 0 };
  
  const { data: pending } = await supabase
    .from('cosmo_request_queue')
    .select('priority')
    .eq('status', 'pending');
  
  if (pending) {
    pending.forEach((item) => {
      pendingCounts[item.priority as CosmoPriority]++;
      pendingCounts.total++;
    });
  }
  
  // Get processing count
  const { count: processingCount } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');
  
  // Get completed in last 24h
  const { count: completed24h } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', dayAgo);
  
  // Get failed in last 24h
  const { count: failed24h } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('completed_at', dayAgo);
  
  // Get throughput (completed in last minute)
  const { count: lastMinute } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', minuteAgo);
  
  // Get average wait and processing times
  const { data: timingData } = await supabase
    .from('cosmo_request_queue')
    .select('created_at, started_at, completed_at')
    .eq('status', 'completed')
    .not('started_at', 'is', null)
    .not('completed_at', 'is', null)
    .gte('completed_at', dayAgo)
    .limit(1000);
  
  let avgWaitTimeMs = 0;
  let avgProcessingTimeMs = 0;
  
  if (timingData && timingData.length > 0) {
    const totalWait = timingData.reduce((sum, item) => {
      return sum + (new Date(item.started_at).getTime() - new Date(item.created_at).getTime());
    }, 0);
    const totalProcessing = timingData.reduce((sum, item) => {
      return sum + (new Date(item.completed_at).getTime() - new Date(item.started_at).getTime());
    }, 0);
    avgWaitTimeMs = totalWait / timingData.length;
    avgProcessingTimeMs = totalProcessing / timingData.length;
  }
  
  // Get oldest pending request age
  const { data: oldest } = await supabase
    .from('cosmo_request_queue')
    .select('created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  const oldestPendingAge = oldest 
    ? now.getTime() - new Date(oldest.created_at).getTime()
    : 0;
  
  return {
    pending: pendingCounts,
    processing: processingCount || 0,
    completed24h: completed24h || 0,
    failed24h: failed24h || 0,
    avgWaitTimeMs,
    avgProcessingTimeMs,
    throughputPerMinute: lastMinute || 0,
    oldestPendingAge,
  };
}

// ============= Cleanup =============

/**
 * Clean up expired requests
 */
export async function cleanupExpired(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from('cosmo_request_queue')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', new Date().toISOString())
    .select('id');
  
  if (error) {
    warn('Failed to cleanup expired requests', { error: error.message });
    return 0;
  }
  
  return data?.length || 0;
}

/**
 * Clean up old completed/failed requests (keep last 7 days)
 */
export async function cleanupOld(supabase: SupabaseClient): Promise<number> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('cosmo_request_queue')
    .delete()
    .in('status', ['completed', 'failed', 'cancelled', 'expired'])
    .lt('completed_at', weekAgo)
    .select('id');
  
  if (error) {
    warn('Failed to cleanup old requests', { error: error.message });
    return 0;
  }
  
  return data?.length || 0;
}

// ============= Load Management =============

/**
 * Check if system is under high load
 */
export async function isHighLoad(supabase: SupabaseClient): Promise<boolean> {
  const { count } = await supabase
    .from('cosmo_request_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');
  
  // Consider high load if more than 10 requests processing concurrently
  return (count || 0) > 10;
}

/**
 * Determine if a request should be queued or processed immediately
 */
export async function shouldQueue(
  request: CosmoRequest,
  supabase: SupabaseClient
): Promise<boolean> {
  const priority = request.priority || 'normal';
  
  // Never queue critical requests
  if (priority === 'critical') {
    return false;
  }
  
  // Never queue if no callback URL (can't notify completion)
  if (!request.callbackUrl && request.responseMode !== 'silent') {
    return false;
  }
  
  // High priority only queued under extreme load
  if (priority === 'high') {
    const { count } = await supabase
      .from('cosmo_request_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing');
    return (count || 0) > 20;
  }
  
  // Normal/low priority queued under moderate load
  return await isHighLoad(supabase);
}
