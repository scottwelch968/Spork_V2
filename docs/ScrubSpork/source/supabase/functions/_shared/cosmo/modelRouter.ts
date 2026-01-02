/**
 * Cosmo Model Router
 * Intelligent model selection based on intent, cost-performance weight, and availability
 */

import type { 
  IntentAnalysis, 
  ModelCandidate, 
  CosmoRoutingConfig, 
  ModelSelection 
} from './types.ts';
import { createCosmoError } from './errors.ts';
import { info, warn } from './logger.ts';

/**
 * Get cost tier based on weight (0-100)
 */
export function getCostTier(weight: number): 'low' | 'balanced' | 'premium' {
  if (weight <= 33) return 'low';
  if (weight <= 66) return 'balanced';
  return 'premium';
}

/**
 * Get display label for cost tier
 */
export function getCostTierLabel(weight: number): string {
  if (weight <= 33) return 'Lowest Cost';
  if (weight <= 66) return 'Balanced';
  return 'Best Quality';
}

/**
 * Calculate total cost per 1M tokens for a model
 */
function getModelCost(model: ModelCandidate): number {
  if (model.is_free) return 0;
  return (model.pricing_prompt || 0) + (model.pricing_completion || 0);
}

/**
 * Filter models by category
 */
function filterByCategory(
  models: ModelCandidate[],
  category: string
): ModelCandidate[] {
  const filtered = models.filter(m => 
    m.best_for?.toLowerCase() === category.toLowerCase()
  );
  
  // If no models match category, return all
  return filtered.length > 0 ? filtered : models;
}

/**
 * Select model based on cost-performance weight from candidates
 */
export function selectModelByWeight(
  models: ModelCandidate[],
  weight: number
): ModelCandidate | null {
  if (models.length === 0) return null;
  if (models.length === 1) return models[0];

  // Sort by cost ascending
  const sortedByCost = [...models].sort((a, b) => getModelCost(a) - getModelCost(b));
  const totalModels = sortedByCost.length;
  const costTier = getCostTier(weight);

  let targetIndex: number;

  if (costTier === 'low') {
    // Select from cheapest 1/3
    const tierSize = Math.max(1, Math.ceil(totalModels / 3));
    targetIndex = Math.min(Math.floor(weight / 33 * tierSize), tierSize - 1);
  } else if (costTier === 'balanced') {
    // Select from middle 1/3
    const tierStart = Math.floor(totalModels / 3);
    const tierEnd = Math.floor(2 * totalModels / 3);
    const tierSize = Math.max(1, tierEnd - tierStart);
    const normalizedWeight = (weight - 33) / 33;
    targetIndex = tierStart + Math.min(Math.floor(normalizedWeight * tierSize), tierSize - 1);
  } else {
    // Select from most expensive 1/3 (premium)
    const tierStart = Math.floor(2 * totalModels / 3);
    const tierSize = Math.max(1, totalModels - tierStart);
    const normalizedWeight = (weight - 66) / 34;
    targetIndex = tierStart + Math.min(Math.floor(normalizedWeight * tierSize), tierSize - 1);
  }

  // Ensure bounds
  targetIndex = Math.max(0, Math.min(targetIndex, totalModels - 1));
  return sortedByCost[targetIndex];
}

/**
 * Fetch available models from database
 */
export async function getAvailableModels(
  supabase: any,
  provider: string = 'OpenRouter'
): Promise<ModelCandidate[]> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('model_id, name, provider, best_for, pricing_prompt, pricing_completion, is_free, context_length')
    .eq('provider', provider)
    .eq('is_active', true);

  if (error) {
    warn('Error fetching models from database', { provider, error: error.message });
    return [];
  }

  return data || [];
}

/**
 * Get fallback model configuration
 */
export async function getFallbackModel(
  supabase: any
): Promise<{ model_id: string; provider: string } | null> {
  // Try admin-configured fallback first
  const { data: settings } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'fallback_model')
    .single();

  if (settings?.setting_value?.enabled && settings.setting_value.model_id) {
    const { data: fallbackModel } = await supabase
      .from('fallback_models')
      .select('model_id, provider')
      .eq('model_id', settings.setting_value.model_id)
      .eq('is_active', true)
      .single();

    if (fallbackModel) {
      return fallbackModel;
    }
  }

  // Try default fallback
  const { data: defaultFallback } = await supabase
    .from('fallback_models')
    .select('model_id, provider')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (defaultFallback) {
    return defaultFallback;
  }

  // Any active fallback
  const { data: anyFallback } = await supabase
    .from('fallback_models')
    .select('model_id, provider')
    .eq('is_active', true)
    .limit(1)
    .single();

  // Return null if no fallback configured - let caller handle
  return anyFallback || null;
}

/**
 * Main model routing function - Cosmo selects the best model
 */
export async function routeToModel(
  intent: IntentAnalysis,
  routingConfig: CosmoRoutingConfig,
  supabase: any,
  requestedModel?: string
): Promise<ModelSelection> {
  info('Model routing started', { category: intent.category, requestedModel });

  // If specific model requested (not auto), use it directly
  if (requestedModel && requestedModel !== 'auto') {
    info('Using explicitly requested model', { model: requestedModel });
    return {
      selectedModelId: requestedModel,
      selectedCategory: intent.category,
      provider: 'OpenRouter',
      costTier: 'balanced',
      reasoning: 'Model explicitly requested by user',
      modelsConsidered: 1,
    };
  }

  // If auto-routing disabled, use default
  if (!routingConfig.enabled) {
    const { data: defaultSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'default_model')
      .single();

    const defaultModelId = defaultSetting?.setting_value?.model_id;
    if (!defaultModelId) {
      throw createCosmoError('CONFIG_MISSING', 'No default model configured in system settings');
    }
    info('Cosmo routing disabled, using default', { model: defaultModelId });
    
    return {
      selectedModelId: defaultModelId,
      selectedCategory: intent.category,
      provider: 'OpenRouter',
      costTier: 'balanced',
      reasoning: 'Cosmo routing disabled, using system default',
      modelsConsidered: 1,
    };
  }

  // Get available models
  const availableModels = await getAvailableModels(supabase);
  info('Available models fetched', { count: availableModels.length });

  if (availableModels.length === 0) {
    const fallback = await getFallbackModel(supabase);
    if (!fallback) {
      throw createCosmoError('ALL_MODELS_FAILED', 'No models available and no fallback configured');
    }
    warn('No models available, using fallback', { fallback: fallback.model_id });
    return {
      selectedModelId: fallback.model_id,
      selectedCategory: intent.category,
      provider: fallback.provider,
      costTier: 'balanced',
      reasoning: 'No models available, using fallback',
      modelsConsidered: 0,
    };
  }

  // Filter by detected category
  const categoryModels = filterByCategory(availableModels, intent.category);
  info('Models filtered by category', { category: intent.category, count: categoryModels.length });

  // Select based on cost-performance weight
  const weight = routingConfig.cost_performance_weight ?? 50;
  const selectedModel = selectModelByWeight(categoryModels, weight);

  if (!selectedModel) {
    const fallback = await getFallbackModel(supabase);
    if (!fallback) {
      throw createCosmoError('ALL_MODELS_FAILED', 'No suitable model found and no fallback configured');
    }
    warn('No suitable model found, using fallback', { fallback: fallback.model_id });
    return {
      selectedModelId: fallback.model_id,
      selectedCategory: intent.category,
      provider: fallback.provider,
      costTier: getCostTier(weight),
      reasoning: 'No suitable model found, using fallback',
      modelsConsidered: categoryModels.length,
    };
  }

  const costTier = getCostTier(weight);
  info('Model selected', { model: selectedModel.model_id, costTier, weight });

  return {
    selectedModelId: selectedModel.model_id,
    selectedCategory: intent.category,
    provider: selectedModel.provider,
    costTier,
    reasoning: `Selected ${selectedModel.name} for ${intent.category} task with ${getCostTierLabel(weight)} preference`,
    modelsConsidered: categoryModels.length,
  };
}

/**
 * Get similar model as fallback (same category, different model)
 */
export async function getSimilarModel(
  supabase: any,
  excludeModelId: string,
  category: string
): Promise<ModelCandidate | null> {
  const { data } = await supabase
    .from('ai_models')
    .select('model_id, name, provider, best_for, pricing_prompt, pricing_completion, is_free, context_length')
    .eq('provider', 'OpenRouter')
    .eq('best_for', category)
    .neq('model_id', excludeModelId)
    .eq('is_active', true)
    .limit(1)
    .single();

  return data || null;
}
