import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleEnhancePromptRequest } from "../_shared/cosmo/index.ts";

/**
 * Enhance Prompt Edge Function
 * 
 * Thin wrapper that delegates to COSMO orchestrator.
 * All routing, fallback, and debug logging handled by COSMO.
 */
serve(handleEnhancePromptRequest);
