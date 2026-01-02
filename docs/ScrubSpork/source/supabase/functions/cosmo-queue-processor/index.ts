/**
 * COSMO Queue Processor
 * 
 * Background worker that processes queued requests in priority order.
 * Now includes batch processing for similar queries.
 * Runs as a scheduled job or can be triggered manually.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  dequeueNext, 
  updateQueueStatus, 
  retryRequest,
  cleanupExpired,
  getReadyBatches,
  processBatch,
  cleanupStaleBatches,
  getBatchStats,
  type QueuedRequest,
  type RequestBatch,
} from '../_shared/cosmo/index.ts';
import { orchestrate, corsHeaders } from '../_shared/cosmo/index.ts';
import { createLogger } from '../_shared/edgeLogger.ts';
import type { CosmoRequest } from '../_shared/cosmo/types.ts';

const MAX_CONCURRENT = 10;
const PROCESSING_NODE = `processor_${Date.now()}`;

Deno.serve(async (req) => {
  const logger = createLogger('cosmo-queue-processor');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  logger.start();

  try {
    // First, cleanup expired requests
    const expiredCount = await cleanupExpired(supabase);
    if (expiredCount > 0) {
      logger.info('Cleaned up expired requests', { count: expiredCount });
    }

    // Cleanup stale batches (window expired but not enough requests)
    const unbatchedCount = await cleanupStaleBatches(supabase);
    if (unbatchedCount > 0) {
      logger.info('Unbatched requests from stale batches', { count: unbatchedCount });
    }

    // Process ready batches first
    const batchResults = await processBatches(supabase);
    logger.info('Processed batches', { count: batchResults.length });

    // Process up to MAX_CONCURRENT individual requests
    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < MAX_CONCURRENT; i++) {
      const queuedRequest = await dequeueNext(supabase, PROCESSING_NODE);
      
      if (!queuedRequest) {
        logger.debug('No more pending requests', { dequeuedSoFar: i });
        break;
      }

      // Skip batched requests (they were already processed)
      if ((queuedRequest as unknown as { batch_id?: string }).batch_id) {
        logger.debug('Skipping batched request', { requestId: queuedRequest.id });
        continue;
      }

      logger.info('Processing request', { 
        requestId: queuedRequest.id, 
        priority: queuedRequest.priority, 
        score: queuedRequest.priorityScore 
      });

      // Process request asynchronously
      const processPromise = processQueuedRequest(queuedRequest, supabase)
        .then((result) => {
          results.push(result);
        })
        .catch((error) => {
          results.push({ 
            id: queuedRequest.id, 
            success: false, 
            error: error.message 
          });
        });

      promises.push(processPromise);
    }

    // Wait for all processing to complete
    await Promise.all(promises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Get batch stats for response
    const batchStats = await getBatchStats(supabase);

    logger.complete(Date.now() - Date.now(), { succeeded: successCount, failed: failCount, batchesProcessed: batchResults.length });

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: successCount,
        failed: failCount,
        expiredCleaned: expiredCount,
        batchesProcessed: batchResults.length,
        batchStats,
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Process all ready batches
 */
async function processBatches(
  supabase: SupabaseClient
): Promise<Array<{ batchId: string; success: boolean }>> {
  const readyBatches = await getReadyBatches(supabase);
  const results: Array<{ batchId: string; success: boolean }> = [];

  for (const batch of readyBatches) {
    // Process batch with request count
    
    const result = await processBatch(
      batch.id,
      supabase,
      async (prompt: string) => {
        // Use COSMO orchestrator for the batched request
        const batchRequest: CosmoRequest = {
          content: prompt,
          messages: [{ role: 'user', content: prompt }],
          requestType: batch.requestType as CosmoRequest['requestType'],
          responseMode: 'batch',
        };

        const response = await orchestrate(batchRequest);
        
        // Read the stream to get full content
        const reader = response.stream.getReader();
        let fullContent = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    fullContent += parsed.choices[0].delta.content;
                  }
                } catch {
                  fullContent += data;
                }
              }
            }
          }
        }

        return {
          content: fullContent,
          tokensUsed: response.metadata.processingTimeMs, // Approximate
          model: response.metadata.actualModelUsed,
        };
      }
    );

    results.push({ batchId: batch.id, success: result.success });
  }

  return results;
}

/**
 * Process a single queued request
 */
async function processQueuedRequest(
  queuedRequest: QueuedRequest,
  supabase: SupabaseClient
): Promise<{ id: string; success: boolean; error?: string }> {
  const startTime = Date.now();
  
  try {
    // Reconstruct the CosmoRequest
    const request = queuedRequest.requestPayload as CosmoRequest;
    
    // Execute through COSMO orchestrator
    const response = await orchestrate(request);
    
    // Read the stream to get the result
    const reader = response.stream.getReader();
    let fullContent = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      // Extract content from SSE format
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
              }
            } catch {
              // Not JSON, might be plain content
              fullContent += data;
            }
          }
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    // Request completed successfully
    
    // Update status to completed
    await updateQueueStatus(
      queuedRequest.id,
      'completed',
      supabase,
      {
        content: fullContent,
        metadata: response.metadata,
        processingTimeMs: processingTime,
      }
    );
    
    // Send callback if configured
    if (queuedRequest.callbackUrl) {
      await sendCallback(queuedRequest.callbackUrl, {
        requestId: queuedRequest.id,
        success: true,
        content: fullContent,
        metadata: response.metadata,
        processingTimeMs: processingTime,
      });
    }
    
    return { id: queuedRequest.id, success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Request failed
    
    // Check if we should retry
    const shouldRetry = queuedRequest.retryCount < queuedRequest.maxRetries;
    
    if (shouldRetry) {
      // Retrying request
      await retryRequest(queuedRequest.id, supabase);
    } else {
      await updateQueueStatus(
        queuedRequest.id,
        'failed',
        supabase,
        undefined,
        errorMessage
      );
      
      // Send failure callback
      if (queuedRequest.callbackUrl) {
        await sendCallback(queuedRequest.callbackUrl, {
          requestId: queuedRequest.id,
          success: false,
          error: errorMessage,
        });
      }
    }
    
    return { id: queuedRequest.id, success: false, error: errorMessage };
  }
}

/**
 * Send callback notification
 */
async function sendCallback(url: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      // Callback failed - no console logging here, handled by caller
    }
  } catch (error) {
    // Callback error - no console logging here, handled by caller
  }
}
