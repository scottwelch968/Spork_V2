import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleImageGenerationRequest } from "../_shared/cosmo/index.ts";

/**
 * Generate Image Edge Function
 * 
 * Thin wrapper that delegates to COSMO orchestrator.
 * All model selection, routing, fallback, and storage handled by COSMO.
 */
serve(handleImageGenerationRequest);
