import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleKnowledgeQueryRequest } from "../_shared/cosmo/index.ts";

/**
 * Query Knowledge Base Edge Function
 * 
 * Thin wrapper that delegates to COSMO orchestrator.
 * All document retrieval, model routing, and fallback handled by COSMO.
 */
serve(handleKnowledgeQueryRequest);
