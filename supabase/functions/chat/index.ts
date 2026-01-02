/**
 * Chat Edge Function
 * Thin wrapper that delegates all logic to Cosmo orchestrator
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleChatRequest, corsHeaders } from "../_shared/cosmo/index.ts";
import { createLogger } from "../_shared/edgeLogger.ts";

serve(async (req) => {
  const logger = createLogger('chat');
  logger.start({ method: req.method });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Delegate everything to Cosmo orchestrator
  return handleChatRequest(req);
});
