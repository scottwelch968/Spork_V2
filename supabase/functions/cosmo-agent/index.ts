/**
 * Cosmo Agent Edge Function
 * Thin wrapper for AI agent autonomous actions - delegates to COSMO orchestrator
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { orchestrate, corsHeaders } from "../_shared/cosmo/index.ts";
import type { CosmoRequest } from "../_shared/cosmo/types.ts";
import { createLogger } from "../_shared/edgeLogger.ts";

serve(async (req) => {
  const logger = createLogger('cosmo-agent');
  const startTime = Date.now();
  logger.start({ method: req.method });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    logger.info('Processing agent action', { 
      agentId: body.agentId, 
      goal: body.goal?.substring(0, 100) 
    });
    
    // Build Cosmo request for agent action
    const cosmoRequest: CosmoRequest = {
      content: body.goal || body.action || 'agent_action',
      messages: body.conversationHistory || [],
      requestType: 'agent_action',
      source: {
        type: 'agent',
        id: body.agentId,
        name: body.agentName,
        metadata: {
          capabilities: body.capabilities,
          constraints: body.constraints,
        },
      },
      responseMode: body.stream ? 'stream' : 'batch',
      agentId: body.agentId,
      agentGoal: body.goal,
      agentContext: {
        previousActions: body.previousActions,
        environmentState: body.environmentState,
        availableTools: body.availableTools,
        ...body.context,
      },
    };

    // Orchestrate
    const result = await orchestrate(cosmoRequest);
    
    // For streaming mode, return the stream directly
    if (body.stream) {
      logger.complete(Date.now() - startTime, { mode: 'stream' });
      return new Response(result.stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }
    
    // For batch mode, read the stream and return as JSON
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

    logger.complete(Date.now() - startTime, { mode: 'batch' });
    return new Response(responseBody, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ 
        success: false,
        goalAchieved: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
