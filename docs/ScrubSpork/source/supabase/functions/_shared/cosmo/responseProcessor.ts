/**
 * Cosmo Response Processor
 * Post-processes AI responses to extract actions, entities, and recommendations
 */

import { info, error, debug } from './logger.ts';
// Canonical DebugData from contracts.ts (Article II compliance)
import type { DebugData } from './contracts.ts';
import type { 
  ProcessedResponse, 
  SuggestedAction, 
  ExtractedEntity,
  CosmoMetadata,
} from './types.ts';

/**
 * Detect code blocks in response
 */
function containsCode(content: string): boolean {
  return content.includes('```') || content.includes('`');
}

/**
 * Detect URLs in response
 */
function extractUrls(content: string): ExtractedEntity[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex) || [];
  
  return matches.map(url => ({
    type: 'url' as const,
    value: url,
    confidence: 1.0,
  }));
}

/**
 * Detect dates in response
 */
function extractDates(content: string): ExtractedEntity[] {
  // Simple date patterns
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s*\d{4}\b/gi,
  ];

  const entities: ExtractedEntity[] = [];
  
  for (const pattern of datePatterns) {
    const matches = content.match(pattern) || [];
    for (const match of matches) {
      entities.push({
        type: 'date',
        value: match,
        confidence: 0.9,
      });
    }
  }

  return entities;
}

/**
 * Generate suggested actions based on response content
 */
function generateActions(content: string): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Always include copy
  actions.push({
    type: 'save',
    label: 'Save Response',
    enabled: true,
  });

  // If contains code, suggest copy code
  if (containsCode(content)) {
    actions.push({
      type: 'export',
      label: 'Export Code',
      enabled: true,
    });
  }

  // Always include regenerate
  actions.push({
    type: 'regenerate',
    label: 'Regenerate',
    enabled: true,
  });

  // If response is substantial, suggest elaborate
  if (content.length > 500) {
    actions.push({
      type: 'elaborate',
      label: 'Elaborate More',
      enabled: true,
    });
  }

  // Share action
  actions.push({
    type: 'share',
    label: 'Share',
    enabled: true,
  });

  return actions;
}

/**
 * Generate follow-up recommendations based on content
 */
function generateFollowUps(content: string): string[] {
  const followUps: string[] = [];

  // If mentions steps or instructions
  if (content.toLowerCase().includes('step') || content.toLowerCase().includes('first')) {
    followUps.push('Can you explain any of these steps in more detail?');
  }

  // If mentions alternatives
  if (content.toLowerCase().includes('alternative') || content.toLowerCase().includes('option')) {
    followUps.push('What are the pros and cons of each option?');
  }

  // If mentions code
  if (containsCode(content)) {
    followUps.push('Can you add error handling to this code?');
    followUps.push('How would I test this?');
  }

  // Generic follow-ups
  if (followUps.length === 0) {
    followUps.push('Can you provide more examples?');
    followUps.push('How does this compare to alternatives?');
  }

  return followUps.slice(0, 3); // Max 3 follow-ups
}

/**
 * Main response processing function
 */
export function processResponse(content: string): ProcessedResponse {
  info('=== COSMO: Processing Response ===');

  // Extract entities
  const entities: ExtractedEntity[] = [
    ...extractUrls(content),
    ...extractDates(content),
  ];

  // Generate actions
  const actions = generateActions(content);

  // Generate follow-up recommendations
  const followUps = generateFollowUps(content);

  const result: ProcessedResponse = {
    content,
    suggestedActions: actions,
    extractedEntities: entities,
    followUpRecommendations: followUps,
  };

  debug('Response processing complete', {
    entitiesFound: entities.length,
    actionsGenerated: actions.length,
    followUpsGenerated: followUps.length,
  });

  return result;
}

/**
 * Create SSE metadata event for streaming
 */
export function createMetadataEvent(metadata: CosmoMetadata): string {
  return `data: ${JSON.stringify({
    type: 'metadata',
    actualModelUsed: metadata.actualModelUsed,
    cosmoSelected: metadata.cosmoSelected,
    detectedCategory: metadata.detectedCategory,
    costTier: metadata.costTier,
    functionsInvoked: metadata.functionsInvoked,
  })}\n\n`;
}

/**
 * Create SSE actions event for streaming
 */
export function createActionsEvent(actions: SuggestedAction[]): string {
  return `data: ${JSON.stringify({
    type: 'actions',
    suggestedActions: actions,
  })}\n\n`;
}

/**
 * Estimate token counts from text
 */
export function estimateTokens(text: string): { prompt: number; completion: number; total: number } {
  // Rough estimate: ~4 characters per token
  const promptTokens = Math.ceil(text.length / 4);
  const completionTokens = 500; // Estimated average

  return {
    prompt: promptTokens,
    completion: completionTokens,
    total: promptTokens + completionTokens,
  };
}

/**
 * Calculate estimated cost based on token counts and model pricing
 */
export function calculateCost(
  tokens: { prompt: number; completion: number },
  pricingPrompt: number,
  pricingCompletion: number
): number {
  const promptCost = (tokens.prompt / 1_000_000) * pricingPrompt;
  const completionCost = (tokens.completion / 1_000_000) * pricingCompletion;
  return promptCost + completionCost;
}

/**
 * Save debug log to database
 * Uses canonical DebugData type from contracts.ts (Article II compliance)
 */
export async function saveDebugLog(
  supabase: any,
  debugData: DebugData,
  workspaceId?: string,
  chatId?: string,
  userId?: string
): Promise<void> {
  try {
    await supabase.from('cosmo_debug_logs').insert({
      operation_type: 'chat',
      user_id: userId || null,
      chat_id: chatId || null,
      workspace_id: workspaceId || null,
      original_message: debugData.original_message,
      detected_intent: debugData.detected_intent,
      intent_patterns: debugData.intent_patterns,
      requested_model: debugData.requested_model,
      auto_select_enabled: debugData.auto_select_enabled,
      context_sources: debugData.context_sources,
      system_prompt_preview: debugData.system_prompt_preview,
      full_system_prompt: debugData.full_system_prompt,
      persona_prompt: debugData.persona_prompt,
      ai_instructions: debugData.ai_instructions,
      selected_model: debugData.selected_model,
      model_provider: debugData.model_provider,
      model_config: debugData.model_config,
      tiers_attempted: debugData.tiers_attempted,
      fallback_used: debugData.fallback_used,
      response_time_ms: debugData.response_time_ms,
      prompt_tokens: debugData.prompt_tokens,
      completion_tokens: debugData.completion_tokens,
      total_tokens: debugData.total_tokens,
      cost: debugData.cost,
      success: debugData.success,
      error_message: debugData.error_message,
      api_request_body: debugData.api_request_body,
      api_response_headers: debugData.api_response_headers,
      openrouter_request_id: debugData.openrouter_request_id,
    });
    debug('Debug log saved');
  } catch (err) {
    error('Failed to save debug log', { error: err instanceof Error ? err.message : String(err) });
  }
}
