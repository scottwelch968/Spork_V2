// Cosmo AI Intelligent Model Routing Utility
// This module provides AI-powered model selection with cost-performance weighting

import { getProviderEndpoint, getProviderHeaders, getProviderApiKey } from './cosmo/providerConfig.ts';
import type { CosmoRoutingConfig as BaseCosmoRoutingConfig } from './cosmo/contracts.ts';
import type { ModelCandidate } from './cosmo/types.ts';
import { createCosmoError } from './cosmo/errors.ts';

// Re-export for consumers
export type { ModelCandidate };

// Runtime-required version of CosmoRoutingConfig with all fields required
// The base type has optional fields for database/API flexibility, but runtime usage requires them
export interface CosmoRoutingConfig extends Required<Pick<BaseCosmoRoutingConfig, 
  'enabled' | 'model_id' | 'provider' | 'cost_performance_weight' | 'system_prompt' | 'available_categories' | 'fallback_category'
>> {}

export interface CosmoRoutingResult {
  selectedModelId: string;
  selectedCategory: string;
  provider: string;
  reasoning?: string;
  costTier: 'low' | 'balanced' | 'premium';
  modelsConsidered: number;
}

// Get the cost tier based on weight
export function getCostTier(weight: number): 'low' | 'balanced' | 'premium' {
  if (weight <= 33) return 'low';
  if (weight <= 66) return 'balanced';
  return 'premium';
}

// Get cost tier label for display
export function getCostTierLabel(weight: number): string {
  if (weight <= 33) return 'Lowest Cost';
  if (weight <= 66) return 'Balanced';
  return 'Best Quality';
}

// Calculate total cost per 1M tokens for a model
function getModelCost(model: ModelCandidate): number {
  if (model.is_free) return 0;
  const promptCost = model.pricing_prompt || 0;
  const completionCost = model.pricing_completion || 0;
  return promptCost + completionCost;
}

// Select model based on cost-performance weight from a list of candidates
export function selectModelByWeight(
  models: ModelCandidate[],
  weight: number
): ModelCandidate | null {
  if (models.length === 0) return null;
  if (models.length === 1) return models[0];

  // Sort by cost (ascending)
  const sortedByCost = [...models].sort((a, b) => getModelCost(a) - getModelCost(b));

  // Determine which tier to select from based on weight
  const costTier = getCostTier(weight);
  const totalModels = sortedByCost.length;

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
    const normalizedWeight = (weight - 33) / 33; // 0 to 1 within balanced tier
    targetIndex = tierStart + Math.min(Math.floor(normalizedWeight * tierSize), tierSize - 1);
  } else {
    // Select from most expensive 1/3
    const tierStart = Math.floor(2 * totalModels / 3);
    const tierSize = Math.max(1, totalModels - tierStart);
    const normalizedWeight = (weight - 66) / 34; // 0 to 1 within premium tier
    targetIndex = tierStart + Math.min(Math.floor(normalizedWeight * tierSize), tierSize - 1);
  }

  // Ensure we don't go out of bounds
  targetIndex = Math.max(0, Math.min(targetIndex, totalModels - 1));

  return sortedByCost[targetIndex];
}

// Analyze prompt and determine category using Cosmo's brain
export async function analyzePromptCategory(
  prompt: string,
  routingConfig: CosmoRoutingConfig,
  openRouterApiKey: string
): Promise<string> {
  try {
    console.log(`Cosmo analyzing prompt with model: ${routingConfig.model_id}`);

    const endpoint = getProviderEndpoint(routingConfig.provider);
    const apiKey = getProviderApiKey(routingConfig.provider) || openRouterApiKey;
    const headers = getProviderHeaders(routingConfig.provider, apiKey!);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: routingConfig.model_id,
        messages: [
          { role: 'system', content: routingConfig.system_prompt },
          { role: 'user', content: `Analyze this prompt and respond with ONLY the category name:\n\n"${prompt}"` }
        ],
        max_tokens: 50,
        temperature: 0.1, // Low temperature for consistent categorization
      }),
    });

    if (!response.ok) {
      console.log(`Cosmo category analysis failed with status ${response.status}`);
      return routingConfig.fallback_category;
    }

    const data = await response.json();
    const rawCategory = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    // Validate the category
    const validCategories = routingConfig.available_categories.map(c => c.toLowerCase());
    if (validCategories.includes(rawCategory)) {
      console.log(`Cosmo detected category: ${rawCategory}`);
      return rawCategory;
    }

    // Try to extract category if response contains extra text
    for (const cat of validCategories) {
      if (rawCategory?.includes(cat)) {
        console.log(`Cosmo extracted category: ${cat}`);
        return cat;
      }
    }

    console.log(`Cosmo couldn't determine category, using fallback: ${routingConfig.fallback_category}`);
    return routingConfig.fallback_category;
  } catch (error) {
    console.error('Cosmo category analysis error:', error);
    return routingConfig.fallback_category;
  }
}

// Main Cosmo routing function
export async function cosmoSelectModel(
  prompt: string,
  routingConfig: CosmoRoutingConfig,
  availableModels: ModelCandidate[],
  openRouterApiKey: string
): Promise<CosmoRoutingResult> {
  console.log('=== COSMO AI: Intelligent Model Routing ===');
  console.log(`Weight: ${routingConfig.cost_performance_weight}, Tier: ${getCostTierLabel(routingConfig.cost_performance_weight)}`);

  // Step 1: Analyze prompt to determine category
  const detectedCategory = await analyzePromptCategory(prompt, routingConfig, openRouterApiKey);

  // Step 2: Filter models by category
  let candidateModels = availableModels.filter(m => 
    m.best_for?.toLowerCase() === detectedCategory.toLowerCase() &&
    m.provider === 'OpenRouter'
  );

  // If no models match category, fall back to all active OpenRouter models
  if (candidateModels.length === 0) {
    console.log(`No models found for category ${detectedCategory}, using all active models`);
    candidateModels = availableModels.filter(m => m.provider === 'OpenRouter');
  }

  // Step 3: Select model based on cost-performance weight
  const selectedModel = selectModelByWeight(candidateModels, routingConfig.cost_performance_weight);

  if (!selectedModel) {
    // Fallback - no models available, throw error
    console.log('Cosmo routing failed, no available models');
    throw createCosmoError('MODEL_UNAVAILABLE', 'No suitable models available for routing');
  }

  const costTier = getCostTier(routingConfig.cost_performance_weight);
  console.log(`Cosmo selected: ${selectedModel.model_id} (${costTier} tier, ${candidateModels.length} candidates)`);

  return {
    selectedModelId: selectedModel.model_id,
    selectedCategory: detectedCategory,
    provider: selectedModel.provider,
    reasoning: `Selected ${selectedModel.name} for ${detectedCategory} task with ${costTier} cost tier`,
    costTier,
    modelsConsidered: candidateModels.length,
  };
}

// Cosmo routing for image generation
export async function cosmoSelectImageModel(
  prompt: string,
  routingConfig: CosmoRoutingConfig,
  imageModels: { model_id: string; description: string }[],
  openRouterApiKey: string
): Promise<string> {
  console.log('=== COSMO AI: Image Model Selection ===');

  try {
    const modelDescriptions = imageModels
      .map(m => `- ${m.model_id}: ${m.description}`)
      .join('\n');

    const endpoint = getProviderEndpoint(routingConfig.provider);
    const apiKey = getProviderApiKey(routingConfig.provider) || openRouterApiKey;
    const headers = getProviderHeaders(routingConfig.provider, apiKey!);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: routingConfig.model_id,
        messages: [{
          role: 'user',
          content: `Analyze this image generation prompt and respond with ONLY the best model ID.

Available models:
${modelDescriptions}

Prompt: "${prompt}"

Respond with ONLY the model ID (e.g., "openai/dall-e-3"):`
        }],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      console.log('Cosmo image analysis failed, using default');
    return imageModels[0]?.model_id;
    }

    const data = await response.json();
    const recommendedModel = data.choices?.[0]?.message?.content?.trim();

    // Validate the recommendation
    const validModels = imageModels.map(m => m.model_id);
    if (validModels.includes(recommendedModel)) {
      console.log(`Cosmo selected image model: ${recommendedModel}`);
      return recommendedModel;
    }

    console.log(`Invalid image model recommendation: ${recommendedModel}, using default`);
    return imageModels[0]?.model_id;
  } catch (error) {
    console.error('Cosmo image model selection error:', error);
    return imageModels[0]?.model_id;
  }
}
