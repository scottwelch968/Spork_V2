/**
 * Centralized utility for model display names
 * Ensures consistent "Cosmo Ai" branding throughout the app
 */

export const COSMO_AI_NAME = 'Cosmo Ai';
export const COSMO_AI_AUTO_DESCRIPTION = 'Cosmo Ai - Spork finds the right model for you';

/**
 * Get the display name for a model ID
 * Converts "auto" or empty values to "Cosmo Ai"
 */
export function getModelDisplayName(modelId: string | null | undefined, modelName?: string): string {
  if (!modelId || modelId === 'auto') {
    return COSMO_AI_NAME;
  }
  return modelName || modelId;
}

/**
 * Check if a model ID represents the auto/Cosmo Ai selection
 */
export function isCosmoAi(modelId: string | null | undefined): boolean {
  return !modelId || modelId === 'auto';
}
