/**
 * Cosmo Action Resolver
 * Resolves intents to executable actions using the cosmo_action_mappings table
 * This is a TOOL that COSMO uses to determine what actions to execute
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { info, warn, error, debug } from './logger.ts';
import type { 
  CosmoAction, 
  ActionMapping, 
  ActionPlan, 
  CosmoActionType,
  ExtractedEntity,
} from './types.ts';

// Cache for action mappings
let actionMappingsCache: ActionMapping[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load action mappings from database with caching
 */
async function loadActionMappings(supabase: SupabaseClient): Promise<ActionMapping[]> {
  const now = Date.now();
  
  if (actionMappingsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return actionMappingsCache;
  }
  
  try {
    const { data, error: dbError } = await supabase
      .from('cosmo_action_mappings')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (dbError) {
      error('Failed to load action mappings', { error: dbError.message });
      return [];
    }
    
    actionMappingsCache = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      intentKey: row.intent_key as string,
      actionKey: row.action_key as string,
      actionType: row.action_type as CosmoActionType,
      actionConfig: (row.action_config || {}) as Record<string, unknown>,
      parameterPatterns: (row.parameter_patterns || {}) as Record<string, unknown>,
      requiredContext: (row.required_context || []) as string[],
      priority: (row.priority || 50) as number,
      conditions: (row.conditions || {}) as Record<string, unknown>,
      isActive: row.is_active as boolean,
    }));
    
    cacheTimestamp = now;
    info('Loaded action mappings from database', { count: actionMappingsCache.length });
    return actionMappingsCache;
  } catch (err) {
    error('Error loading action mappings', { error: err instanceof Error ? err.message : String(err) });
    return [];
  }
}

/**
 * Extract parameters from prompt using patterns
 */
function extractParameters(
  prompt: string, 
  patterns: Record<string, unknown>
): Record<string, string> {
  const extracted: Record<string, string> = {};
  
  for (const [paramName, patternConfig] of Object.entries(patterns)) {
    if (typeof patternConfig === 'string') {
      // Simple regex pattern
      try {
        const regex = new RegExp(patternConfig, 'i');
        const match = prompt.match(regex);
        if (match && match[1]) {
          extracted[paramName] = match[1];
        }
      } catch (e) {
        warn('Invalid pattern', { paramName, error: e instanceof Error ? e.message : String(e) });
      }
    } else if (typeof patternConfig === 'object' && patternConfig !== null) {
      const config = patternConfig as { pattern?: string; type?: string; default?: string };
      if (config.pattern) {
        try {
          const regex = new RegExp(config.pattern, 'i');
          const match = prompt.match(regex);
          if (match && match[1]) {
            extracted[paramName] = match[1];
          } else if (config.default) {
            extracted[paramName] = config.default;
          }
        } catch (e) {
          warn('Invalid pattern', { paramName, error: e instanceof Error ? e.message : String(e) });
        }
      }
    }
  }
  
  return extracted;
}

/**
 * Extract common entities from prompt
 */
export function extractEntities(prompt: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  
  // Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let match;
  while ((match = emailRegex.exec(prompt)) !== null) {
    entities.push({
      type: 'email',
      value: match[0],
      confidence: 0.95,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  
  // URL extraction
  const urlRegex = /https?:\/\/[^\s]+/g;
  while ((match = urlRegex.exec(prompt)) !== null) {
    entities.push({
      type: 'url',
      value: match[0],
      confidence: 0.95,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  
  // Date extraction (simple patterns)
  const datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    /\b(today|tomorrow|yesterday)\b/gi,
    /\b(next|this|last)\s+(week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
  ];
  
  for (const pattern of datePatterns) {
    while ((match = pattern.exec(prompt)) !== null) {
      entities.push({
        type: 'date',
        value: match[0],
        confidence: 0.8,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  
  // Number extraction
  const numberRegex = /\b(\d+(?:\.\d+)?)\b/g;
  while ((match = numberRegex.exec(prompt)) !== null) {
    entities.push({
      type: 'number',
      value: match[0],
      confidence: 0.9,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }
  
  return entities;
}

/**
 * Check if action conditions are met
 */
function checkConditions(
  conditions: Record<string, unknown>,
  prompt: string,
  context: Record<string, unknown>
): boolean {
  if (Object.keys(conditions).length === 0) {
    return true;
  }
  
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case 'contains_keyword': {
        const keywords = Array.isArray(value) ? value : [value];
        const lowerPrompt = prompt.toLowerCase();
        if (!keywords.some((kw: string) => lowerPrompt.includes(kw.toLowerCase()))) {
          return false;
        }
        break;
      }
      case 'requires_context': {
        const required = Array.isArray(value) ? value : [value];
        for (const ctx of required) {
          if (!context[ctx as string]) {
            return false;
          }
        }
        break;
      }
      case 'min_confidence': {
        if (context.confidence && (context.confidence as number) < (value as number)) {
          return false;
        }
        break;
      }
    }
  }
  
  return true;
}

/**
 * Estimate complexity based on actions
 */
function estimateComplexity(actions: CosmoAction[]): 'simple' | 'moderate' | 'complex' {
  if (actions.length <= 1) return 'simple';
  if (actions.length <= 3) return 'moderate';
  return 'complex';
}

/**
 * Determine if response should be streamed
 */
function shouldStream(actions: CosmoAction[]): boolean {
  // Stream if any action is a model_call
  return actions.some(a => a.actionType === 'model_call');
}

/**
 * Main function: Resolve intent to actions
 */
export async function resolveActions(
  intentKey: string,
  prompt: string,
  context: Record<string, unknown> = {},
  supabase?: SupabaseClient
): Promise<ActionPlan> {
  info('=== ACTION RESOLVER: Resolving actions ===', { intentKey });
  
  // Get Supabase client if not provided
  const client = supabase || createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Load action mappings
  const allMappings = await loadActionMappings(client);
  
  // Filter mappings for this intent
  const intentMappings = allMappings.filter(m => 
    m.intentKey === intentKey || m.intentKey === '*' // '*' means applies to all intents
  );
  
  debug('Found potential action mappings', { intentKey, count: intentMappings.length });
  
  // Build actions list, checking conditions
  const actions: CosmoAction[] = [];
  
  for (const mapping of intentMappings) {
    // Check if conditions are met
    if (!checkConditions(mapping.conditions, prompt, context)) {
      debug('Skipping action - conditions not met', { actionKey: mapping.actionKey });
      continue;
    }
    
    // Extract parameters using patterns
    const extractedParams = extractParameters(prompt, mapping.parameterPatterns);
    
    const action: CosmoAction = {
      actionKey: mapping.actionKey,
      actionType: mapping.actionType,
      config: mapping.actionConfig,
      extractedParams,
      priority: mapping.priority,
      requiredContext: mapping.requiredContext,
      conditions: mapping.conditions,
    };
    
    actions.push(action);
  }
  
  // Sort by priority (highest first)
  actions.sort((a, b) => b.priority - a.priority);
  
  // Build execution order
  const executionOrder = actions.map(a => a.actionKey);
  
  // Estimate total time (rough estimate: 100ms per function, 2000ms per model call)
  const totalEstimatedTimeMs = actions.reduce((total, action) => {
    if (action.actionType === 'model_call') return total + 2000;
    if (action.actionType === 'external_api') return total + 500;
    return total + 100;
  }, 0);
  
  const plan: ActionPlan = {
    actions,
    executionOrder,
    estimatedComplexity: estimateComplexity(actions),
    shouldStream: shouldStream(actions),
    totalEstimatedTimeMs,
  };
  
  info('Action plan created', { actionCount: actions.length, complexity: plan.estimatedComplexity });
  return plan;
}

/**
 * Get all action mappings for admin UI
 */
export async function getAllActionMappings(supabase: SupabaseClient): Promise<ActionMapping[]> {
  const { data, error: dbError } = await supabase
    .from('cosmo_action_mappings')
    .select('*')
    .order('intent_key', { ascending: true })
    .order('priority', { ascending: false });
  
  if (dbError) {
    error('Failed to load all action mappings', { error: dbError.message });
    return [];
  }
  
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    intentKey: row.intent_key as string,
    actionKey: row.action_key as string,
    actionType: row.action_type as CosmoActionType,
    actionConfig: (row.action_config || {}) as Record<string, unknown>,
    parameterPatterns: (row.parameter_patterns || {}) as Record<string, unknown>,
    requiredContext: (row.required_context || []) as string[],
    priority: (row.priority || 50) as number,
    conditions: (row.conditions || {}) as Record<string, unknown>,
    isActive: row.is_active as boolean,
  }));
}

/**
 * Refresh action mappings cache
 */
export function refreshActionMappingsCache(): void {
  actionMappingsCache = null;
  cacheTimestamp = 0;
}
