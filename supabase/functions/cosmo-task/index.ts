/**
 * Cosmo Task Edge Function
 * Thin wrapper for system tasks and scheduled jobs - delegates to COSMO orchestrator
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { orchestrate, corsHeaders } from "../_shared/cosmo/index.ts";
import type { CosmoRequest } from "../_shared/cosmo/types.ts";
import { createLogger } from "../_shared/edgeLogger.ts";

serve(async (req) => {
  const logger = createLogger('cosmo-task');
  const startTime = Date.now();
  logger.start({ method: req.method });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    logger.info('Processing system task', { 
      taskName: body.taskName, 
      triggeredBy: body.triggeredBy 
    });
    
    // Build Cosmo request for system task
    const cosmoRequest: CosmoRequest = {
      content: body.taskName || 'system_task',
      messages: [],
      requestType: 'system_task',
      source: {
        type: 'system',
        name: body.taskName || 'scheduled_task',
        metadata: {
          triggeredBy: body.triggeredBy || 'scheduler',
          scheduledAt: body.scheduledAt,
        },
      },
      responseMode: 'silent',
      taskName: body.taskName,
      taskConfig: body.config || {},
    };

    // Orchestrate
    const result = await orchestrate(cosmoRequest);
    
    // Read the stream and return as JSON
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const responseBody = new TextDecoder().decode(
      new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[]))
    );

    logger.complete(Date.now() - startTime, { taskName: body.taskName });
    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        taskName: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
