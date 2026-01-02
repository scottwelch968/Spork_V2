/**
 * COSMO Batch Manager
 * 
 * Intelligent request batching system that groups similar queries together,
 * processes them in a single API call, and distributes responses back.
 * 
 * Benefits:
 * - Reduces API calls by batching similar requests
 * - Lowers costs through shared context/system tokens
 * - Improves rate limiting (fewer calls = less likely to hit limits)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { CosmoRequest, CosmoRequestType } from './types.ts';
import { createCosmoError } from './errors.ts';
import { info, warn, error as logError } from './logger.ts';

// ============= Types =============

export type BatchStatus = 'collecting' | 'processing' | 'completed' | 'failed';

export interface BatchedRequest {
  id: string;
  requestPayload: CosmoRequest;
  addedAt: string;
}

export interface BatchTicket {
  batchId: string;
  requestId: string;
  position: number;
  estimatedProcessingAt: string;
}

export interface BatchConfig {
  windowMs: number;
  maxSize: number;
  minSize: number;
  batchableTypes: CosmoRequestType[];
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  requestResults: Map<string, string>;
  tokensSaved: number;
  apiCallsSaved: number;
  processingTimeMs: number;
  error?: string;
}

export interface BatchStats {
  activeBatches: number;
  avgBatchSize: number;
  apiCallsSaved24h: number;
  tokensSaved24h: number;
  successRate: number;
  totalBatched24h: number;
}

export interface RequestBatch {
  id: string;
  similarityHash: string;
  status: BatchStatus;
  requestType: string;
  requestIds: string[];
  combinedPrompt: string | null;
  combinedResponse: string | null;
  responseMap: Record<string, string>;
  modelUsed: string | null;
  tokensSaved: number;
  apiCallsSaved: number;
  createdAt: string;
  processedAt: string | null;
  windowExpiresAt: string;
  errorMessage: string | null;
}

// ============= Configuration =============

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  windowMs: 500,           // 500ms wait time for similar requests
  maxSize: 10,             // Maximum 10 requests per batch
  minSize: 2,              // Minimum 2 requests to trigger batching
  batchableTypes: ['knowledge_query', 'enhance_prompt'],
};

// ============= Similarity Hash =============

/**
 * Compute a similarity hash based on request characteristics
 * Requests with the same hash can be batched together
 */
export function computeSimilarityHash(request: CosmoRequest): string {
  const parts = [
    request.requestType || 'chat',
    request.requestedModel || 'auto',
    request.personaId || 'none',
    request.workspaceId || 'personal',
    // Include first message role to group similar conversation types
    request.messages?.[0]?.role || 'user',
  ];
  
  return parts.join(':');
}

/**
 * Check if a request can be batched
 */
export function isBatchable(
  request: CosmoRequest,
  config: BatchConfig = DEFAULT_BATCH_CONFIG
): boolean {
  // Check if request type is batchable
  const requestType = request.requestType || 'chat';
  if (!config.batchableTypes.includes(requestType)) {
    return false;
  }
  
  // Don't batch streaming requests (user expects real-time)
  if (request.responseMode === 'stream') {
    return false;
  }
  
  // Don't batch critical priority (needs immediate processing)
  if (request.priority === 'critical') {
    return false;
  }
  
  return true;
}

// ============= Batch Operations =============

/**
 * Find an existing collecting batch or create a new one
 */
export async function findOrCreateBatch(
  hash: string,
  requestType: CosmoRequestType,
  supabase: SupabaseClient,
  config: BatchConfig = DEFAULT_BATCH_CONFIG
): Promise<RequestBatch> {
  // First try to find an existing collecting batch with same hash
  const { data: existing, error: findError } = await supabase
    .from('cosmo_request_batches')
    .select('*')
    .eq('similarity_hash', hash)
    .eq('status', 'collecting')
    .gt('window_expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (!findError && existing && existing.request_ids.length < config.maxSize) {
    return mapDbToBatch(existing);
  }
  
  // Create a new batch
  const windowExpiresAt = new Date(Date.now() + config.windowMs).toISOString();
  
  const { data: newBatch, error: createError } = await supabase
    .from('cosmo_request_batches')
    .insert({
      similarity_hash: hash,
      request_type: requestType,
      window_expires_at: windowExpiresAt,
    })
    .select()
    .single();
  
  if (createError) {
    throw createCosmoError('INTERNAL_ERROR', `Failed to create batch: ${createError.message}`);
  }
  
  return mapDbToBatch(newBatch);
}

/**
 * Add a request to a batch
 */
export async function addToBatch(
  requestId: string,
  request: CosmoRequest,
  supabase: SupabaseClient,
  config: BatchConfig = DEFAULT_BATCH_CONFIG
): Promise<BatchTicket | null> {
  if (!isBatchable(request, config)) {
    return null;
  }
  
  const hash = computeSimilarityHash(request);
  const requestType = request.requestType || 'chat';
  
  try {
    const batch = await findOrCreateBatch(hash, requestType, supabase, config);
    
    // Add request ID to batch
    const newRequestIds = [...batch.requestIds, requestId];
    
    const { error } = await supabase
      .from('cosmo_request_batches')
      .update({ request_ids: newRequestIds })
      .eq('id', batch.id)
      .eq('status', 'collecting');
    
    if (error) {
      logError('Failed to add to batch', { error: error.message, batchId: batch.id });
      return null;
    }
    
    // Update queue item with batch reference
    await supabase
      .from('cosmo_request_queue')
      .update({ batch_id: batch.id })
      .eq('id', requestId);
    
    return {
      batchId: batch.id,
      requestId,
      position: newRequestIds.length,
      estimatedProcessingAt: batch.windowExpiresAt,
    };
  } catch (err) {
    logError('Error adding to batch', { error: err instanceof Error ? err.message : 'Unknown error' });
    return null;
  }
}

/**
 * Get ready batches (window expired or full)
 */
export async function getReadyBatches(
  supabase: SupabaseClient,
  config: BatchConfig = DEFAULT_BATCH_CONFIG
): Promise<RequestBatch[]> {
  const now = new Date().toISOString();
  
  // Get batches where window expired OR batch is full
  const { data, error } = await supabase
    .from('cosmo_request_batches')
    .select('*')
    .eq('status', 'collecting')
    .or(`window_expires_at.lt.${now}`)
    .order('created_at', { ascending: true })
    .limit(20);
  
  if (error) {
    logError('Failed to get ready batches', { error: error.message });
    return [];
  }
  
  // Filter to only batches meeting minimum size OR maxed out
  return (data || [])
    .map(mapDbToBatch)
    .filter(batch => 
      batch.requestIds.length >= config.minSize || 
      batch.requestIds.length >= config.maxSize
    );
}

/**
 * Build combined prompt for a batch
 */
export function buildCombinedPrompt(requests: Array<{ id: string; content: string }>): string {
  const header = `You will answer multiple questions. Provide each answer in the format:

[ANSWER N]
(answer to question N)
[/ANSWER N]

Where N is the question number. Be thorough and complete for each answer.

Questions:`;

  const questions = requests
    .map((r, i) => `Q${i + 1}: ${r.content}`)
    .join('\n\n');

  return `${header}\n${questions}`;
}

/**
 * Extract individual responses from combined response
 */
export function extractResponses(
  combinedResponse: string,
  requestCount: number
): Map<number, string> {
  const responses = new Map<number, string>();
  
  for (let i = 1; i <= requestCount; i++) {
    const pattern = new RegExp(`\\[ANSWER ${i}\\]([\\s\\S]*?)\\[\\/ANSWER ${i}\\]`, 'i');
    const match = combinedResponse.match(pattern);
    
    if (match && match[1]) {
      responses.set(i, match[1].trim());
    }
  }
  
  return responses;
}

/**
 * Process a batch - combine requests, call AI, split responses
 */
export async function processBatch(
  batchId: string,
  supabase: SupabaseClient,
  aiCallFn: (prompt: string, model?: string) => Promise<{ content: string; tokensUsed: number; model: string }>
): Promise<BatchResult> {
  const startTime = Date.now();
  
  try {
    // Mark batch as processing
    const { data: batch, error: fetchError } = await supabase
      .from('cosmo_request_batches')
      .update({ status: 'processing' })
      .eq('id', batchId)
      .eq('status', 'collecting')
      .select()
      .single();
    
    if (fetchError || !batch) {
      throw createCosmoError('INTERNAL_ERROR', 'Failed to claim batch for processing');
    }
    
    // Fetch all request payloads
    const { data: queueItems, error: queueError } = await supabase
      .from('cosmo_request_queue')
      .select('id, request_payload')
      .in('id', batch.request_ids);
    
    if (queueError || !queueItems || queueItems.length === 0) {
      throw createCosmoError('INTERNAL_ERROR', 'Failed to fetch batch requests');
    }
    
    // Build combined prompt
    const requests = queueItems.map(item => ({
      id: item.id,
      content: (item.request_payload as CosmoRequest).content,
    }));
    
    const combinedPrompt = buildCombinedPrompt(requests);
    
    // Make single AI call
    const aiResult = await aiCallFn(combinedPrompt);
    
    // Extract individual responses
    const responsesByIndex = extractResponses(aiResult.content, requests.length);
    
    // Map responses back to request IDs
    const responseMap: Record<string, string> = {};
    const requestResults = new Map<string, string>();
    
    requests.forEach((req, index) => {
      const response = responsesByIndex.get(index + 1) || 'No response generated';
      responseMap[req.id] = response;
      requestResults.set(req.id, response);
    });
    
    // Calculate savings
    // Estimate: each individual call would use ~100 tokens for system prompt overhead
    const systemPromptOverhead = 100;
    const tokensSaved = (requests.length - 1) * systemPromptOverhead;
    const apiCallsSaved = requests.length - 1;
    
    // Update batch as completed
    await supabase
      .from('cosmo_request_batches')
      .update({
        status: 'completed',
        combined_prompt: combinedPrompt,
        combined_response: aiResult.content,
        response_map: responseMap,
        model_used: aiResult.model,
        tokens_saved: tokensSaved,
        api_calls_saved: apiCallsSaved,
        processed_at: new Date().toISOString(),
      })
      .eq('id', batchId);
    
    // Update individual queue items
    for (const [requestId, response] of requestResults) {
      await supabase
        .from('cosmo_request_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result_payload: { content: response, batchedResponse: true },
        })
        .eq('id', requestId);
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    info('Batch completed', { batchId, requestCount: requests.length, apiCallsSaved, tokensSaved });
    
    return {
      batchId,
      success: true,
      requestResults,
      tokensSaved,
      apiCallsSaved,
      processingTimeMs,
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    // Mark batch as failed
    await supabase
      .from('cosmo_request_batches')
      .update({
        status: 'failed',
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq('id', batchId);
    
    logError('Batch failed', { batchId, error: errorMessage });
    
    return {
      batchId,
      success: false,
      requestResults: new Map(),
      tokensSaved: 0,
      apiCallsSaved: 0,
      processingTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

/**
 * Cancel batches with fewer than minimum requests when window expires
 */
export async function cleanupStaleBatches(
  supabase: SupabaseClient,
  config: BatchConfig = DEFAULT_BATCH_CONFIG
): Promise<number> {
  const now = new Date().toISOString();
  
  // Find expired collecting batches with insufficient requests
  const { data: staleBatches, error } = await supabase
    .from('cosmo_request_batches')
    .select('id, request_ids')
    .eq('status', 'collecting')
    .lt('window_expires_at', now);
  
  if (error || !staleBatches) {
    return 0;
  }
  
  let unbatchedCount = 0;
  
  for (const batch of staleBatches) {
    if (batch.request_ids.length < config.minSize) {
      // Remove batch reference from queue items (process individually)
      await supabase
        .from('cosmo_request_queue')
        .update({ batch_id: null })
        .in('id', batch.request_ids);
      
      // Delete the incomplete batch
      await supabase
        .from('cosmo_request_batches')
        .delete()
        .eq('id', batch.id);
      
      unbatchedCount += batch.request_ids.length;
    }
  }
  
  return unbatchedCount;
}

// ============= Statistics =============

/**
 * Get batch statistics
 */
export async function getBatchStats(supabase: SupabaseClient): Promise<BatchStats> {
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
}

// ============= Helpers =============

function mapDbToBatch(row: Record<string, unknown>): RequestBatch {
  return {
    id: row.id as string,
    similarityHash: row.similarity_hash as string,
    status: row.status as BatchStatus,
    requestType: row.request_type as string,
    requestIds: (row.request_ids as string[]) || [],
    combinedPrompt: row.combined_prompt as string | null,
    combinedResponse: row.combined_response as string | null,
    responseMap: (row.response_map as Record<string, string>) || {},
    modelUsed: row.model_used as string | null,
    tokensSaved: (row.tokens_saved as number) || 0,
    apiCallsSaved: (row.api_calls_saved as number) || 0,
    createdAt: row.created_at as string,
    processedAt: row.processed_at as string | null,
    windowExpiresAt: row.window_expires_at as string,
    errorMessage: row.error_message as string | null,
  };
}
