import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from '../_shared/edgeLogger.ts';
import { createCosmoError } from '../_shared/cosmo/errors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenRouterModel {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('sync-openrouter-models');
  logger.start();
  const startTime = Date.now();

  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!OPENROUTER_API_KEY) {
      throw createCosmoError('CONFIG_MISSING', 'OPENROUTER_API_KEY not configured');
    }

    logger.info('Fetching models from OpenRouter API');

    // Fetch models from OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw createCosmoError('FUNCTION_FAILED', `OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const { data: openRouterModels } = await response.json() as { data: OpenRouterModel[] };
    logger.info('Fetched models from OpenRouter', { count: openRouterModels.length });

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch existing models from database - ONLY update these, never insert new ones
    const { data: existingModels } = await supabase
      .from('ai_models')
      .select('model_id, pricing_prompt, pricing_completion')
      .eq('provider', 'OpenRouter');

    const existingModelIds = new Set(existingModels?.map(m => m.model_id) || []);
    logger.info('Found existing models in whitelist', { count: existingModelIds.size });

    let updatedModelsCount = 0;
    let skippedCount = 0;

    // Process each OpenRouter model - ONLY UPDATE existing models
    for (const orModel of openRouterModels) {
      // Strip :free and :beta suffixes for matching
      const modelId = orModel.id.replace(/:free$/, '').replace(/:beta$/, '');
      
      // CRITICAL: Skip models not in our curated whitelist - never insert new models
      if (!existingModelIds.has(modelId)) {
        skippedCount++;
        continue;
      }

      const pricingPrompt = parseFloat(orModel.pricing?.prompt || '0') * 1000000; // Convert to per million tokens
      const pricingCompletion = parseFloat(orModel.pricing?.completion || '0') * 1000000;

      // Update pricing and metadata for existing models only
      const { error } = await supabase
        .from('ai_models')
        .update({
          pricing_prompt: pricingPrompt,
          pricing_completion: pricingCompletion,
          context_length: orModel.context_length || 128000,
          max_completion_tokens: orModel.top_provider?.max_completion_tokens || 4096,
          description: orModel.description || undefined, // Only update if OpenRouter has description
          updated_at: new Date().toISOString(),
        })
        .eq('model_id', modelId);

      if (error) {
        logger.warn('Error updating model', { modelId, error: error.message });
      } else {
        updatedModelsCount++;
      }
    }

    const result = {
      success: true,
      total_fetched: openRouterModels.length,
      updated_models: updatedModelsCount,
      skipped_not_in_whitelist: skippedCount,
      whitelist_size: existingModelIds.size,
      timestamp: new Date().toISOString(),
    };

    logger.complete(Date.now() - startTime, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
