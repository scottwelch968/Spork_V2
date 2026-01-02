/**
 * Cosmo Intent Analyzer
 * Analyzes user prompts to determine intent, required functions, and context needs
 * Phase 2 Enhancement: Returns structured actions via actionResolver
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getProviderEndpoint, getProviderHeaders, getProviderApiKey } from './providerConfig.ts';
import { info, warn, error, debug } from './logger.ts';
import type { 
  IntentAnalysis, 
  EnhancedIntentAnalysis,
  ContextNeed, 
  CosmoRoutingConfig,
  CosmoAction,
  ActionPlan,
} from './types.ts';
import { resolveActions, extractEntities } from './actionResolver.ts';

// Database intent structure
interface DbIntent {
  intent_key: string;
  display_name: string;
  category: string;
  keywords: string[];
  required_functions: string[];
  context_needs: string[];
  priority: number;
  is_active: boolean;
}

// Cache for intents (refreshed every 5 minutes)
let intentCache: DbIntent[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load intents from database with caching
 */
async function loadIntentsFromDb(): Promise<DbIntent[]> {
  const now = Date.now();
  
  if (intentCache && (now - cacheTimestamp) < CACHE_TTL) {
    return intentCache;
  }
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data, error: dbError } = await supabase
      .from('cosmo_intents')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (dbError) {
      error('Failed to load intents from database', { error: dbError.message });
      return getFallbackIntents();
    }
    
    intentCache = data as DbIntent[];
    cacheTimestamp = now;
    info('Loaded intents from database', { count: intentCache.length });
    return intentCache;
  } catch (err) {
    error('Error loading intents', { error: err instanceof Error ? err.message : String(err) });
    return getFallbackIntents();
  }
}

/**
 * Fallback intents if database is unavailable
 */
function getFallbackIntents(): DbIntent[] {
  return [
    { intent_key: 'coding', display_name: 'Code Assistance', category: 'coding', keywords: ['code', 'function', 'debug', 'error', 'programming'], required_functions: ['chat'], context_needs: ['history'], priority: 50, is_active: true },
    { intent_key: 'creative', display_name: 'Creative Writing', category: 'creative', keywords: ['write', 'story', 'poem', 'creative', 'imagine'], required_functions: ['chat'], context_needs: ['persona'], priority: 50, is_active: true },
    { intent_key: 'analysis', display_name: 'Data Analysis', category: 'analysis', keywords: ['analyze', 'explain', 'compare', 'evaluate', 'review'], required_functions: ['chat'], context_needs: ['knowledge_base', 'history'], priority: 50, is_active: true },
    { intent_key: 'conversation', display_name: 'General Conversation', category: 'conversation', keywords: ['hello', 'hi', 'how are', 'what is', 'tell me'], required_functions: ['chat'], context_needs: ['persona', 'history'], priority: 40, is_active: true },
    { intent_key: 'reasoning', display_name: 'Complex Reasoning', category: 'reasoning', keywords: ['solve', 'calculate', 'prove', 'logic', 'math'], required_functions: ['chat'], context_needs: ['history'], priority: 50, is_active: true },
    { intent_key: 'research', display_name: 'Research Tasks', category: 'research', keywords: ['research', 'find out', 'look up', 'search for'], required_functions: ['chat'], context_needs: ['knowledge_base'], priority: 50, is_active: true },
    { intent_key: 'general', display_name: 'General', category: 'general', keywords: [], required_functions: ['chat'], context_needs: ['persona', 'history'], priority: 10, is_active: true },
  ];
}

/**
 * Quick local intent detection using database-driven keywords
 */
async function detectIntentLocally(prompt: string): Promise<{ 
  category: string; 
  confidence: number; 
  functions: string[]; 
  contexts: ContextNeed[];
  intentKey: string;
}> {
  const intents = await loadIntentsFromDb();
  const lowerPrompt = prompt.toLowerCase();
  
  let bestMatch = { 
    category: 'general', 
    confidence: 0.3, 
    functions: ['chat'], 
    contexts: ['persona', 'history'] as ContextNeed[],
    intentKey: 'general',
  };
  
  for (const intent of intents) {
    if (!intent.keywords || intent.keywords.length === 0) continue;
    
    const matchCount = intent.keywords.filter(kw => lowerPrompt.includes(kw.toLowerCase())).length;
    if (matchCount === 0) continue;
    
    const confidence = matchCount / intent.keywords.length;
    
    // Use priority as a tiebreaker
    const adjustedConfidence = confidence + (intent.priority / 1000);
    
    if (adjustedConfidence > bestMatch.confidence) {
      bestMatch = { 
        category: intent.category, 
        confidence: Math.min(confidence * 2, 0.9),
        functions: intent.required_functions,
        contexts: intent.context_needs as ContextNeed[],
        intentKey: intent.intent_key,
      };
    }
  }
  
  return bestMatch;
}

/**
 * Use Cosmo's brain to analyze intent with AI (more accurate but slower)
 */
async function analyzeIntentWithAI(
  prompt: string,
  routingConfig: CosmoRoutingConfig,
  passedApiKey: string
): Promise<{ category: string; confidence: number; intentKey: string }> {
  try {
    // Get available categories from database
    const intents = await loadIntentsFromDb();
    const availableCategories = [...new Set(intents.map(i => i.category))];
    
    const provider = routingConfig.provider || 'OpenRouter';
    const endpoint = getProviderEndpoint(provider);
    const resolvedApiKey = getProviderApiKey(provider) || passedApiKey;
    const headers = getProviderHeaders(provider, resolvedApiKey!);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: routingConfig.model_id,
        messages: [
          { 
            role: 'system', 
            content: `${routingConfig.system_prompt}\n\nAvailable categories: ${availableCategories.join(', ')}`
          },
          { role: 'user', content: `Analyze this prompt and respond with ONLY the category name:\n\n"${prompt}"` }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      warn('Cosmo AI intent analysis failed', { status: response.status });
      const fallback = routingConfig.fallback_category ?? 'general';
      return { category: fallback, confidence: 0.5, intentKey: fallback };
    }

    const data = await response.json();
    const rawCategory = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    // Validate category against database categories
    if (availableCategories.map(c => c.toLowerCase()).includes(rawCategory)) {
      // Find the matching intent key
      const matchingIntent = intents.find(i => i.category.toLowerCase() === rawCategory);
      return { 
        category: rawCategory, 
        confidence: 0.95, 
        intentKey: matchingIntent?.intent_key || rawCategory 
      };
    }

    // Try to extract category if response contains extra text
    for (const cat of availableCategories) {
      if (rawCategory?.includes(cat.toLowerCase())) {
        const matchingIntent = intents.find(i => i.category.toLowerCase() === cat.toLowerCase());
        return { 
          category: cat, 
          confidence: 0.85, 
          intentKey: matchingIntent?.intent_key || cat 
        };
      }
    }

    const fallbackCat = routingConfig.fallback_category ?? 'general';
    return { category: fallbackCat, confidence: 0.5, intentKey: fallbackCat };
  } catch (err) {
    error('Cosmo intent analysis error', { error: err instanceof Error ? err.message : String(err) });
    const fallbackCatch = routingConfig.fallback_category ?? 'general';
    return { category: fallbackCatch, confidence: 0.3, intentKey: fallbackCatch };
  }
}

/**
 * Get intent details from database by category
 */
async function getIntentByCategory(category: string): Promise<DbIntent | null> {
  const intents = await loadIntentsFromDb();
  return intents.find(i => i.category.toLowerCase() === category.toLowerCase()) || null;
}

/**
 * Main intent analysis function - Cosmo's first step
 * Returns basic IntentAnalysis for backwards compatibility
 */
export async function analyzeIntent(
  prompt: string,
  routingConfig?: CosmoRoutingConfig,
  apiKey?: string
): Promise<IntentAnalysis> {
  info('=== COSMO: Analyzing Intent (Database-Driven) ===');
  
  // Step 1: Quick local detection using database intents
  const localDetection = await detectIntentLocally(prompt);
  debug('Local detection result', { category: localDetection.category, confidence: localDetection.confidence });
  
  // Step 2: If confidence is low and AI routing is available, use AI
  let finalCategory = localDetection.category;
  let finalConfidence = localDetection.confidence;
  
  if (localDetection.confidence < 0.7 && routingConfig?.enabled && apiKey) {
    const aiDetection = await analyzeIntentWithAI(prompt, routingConfig, apiKey);
    if (aiDetection.confidence > localDetection.confidence) {
      finalCategory = aiDetection.category;
      finalConfidence = aiDetection.confidence;
      info('AI detection overrides local', { category: finalCategory, confidence: finalConfidence });
    }
  }
  
  // Step 3: Get full intent info from database
  const intentInfo = await getIntentByCategory(finalCategory);
  
  // Step 4: Suggest enhancements based on prompt analysis
  const suggestedEnhancements: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('explain') || lowerPrompt.includes('detail')) {
    suggestedEnhancements.push('elaborate');
  }
  if (lowerPrompt.includes('example')) {
    suggestedEnhancements.push('include_examples');
  }
  if (lowerPrompt.includes('step') || lowerPrompt.includes('how to')) {
    suggestedEnhancements.push('step_by_step');
  }
  
  const result: IntentAnalysis = {
    category: finalCategory,
    confidence: finalConfidence,
    requiredFunctions: intentInfo?.required_functions || localDetection.functions,
    suggestedEnhancements,
    contextNeeds: (intentInfo?.context_needs || localDetection.contexts) as ContextNeed[],
  };
  
  debug('Intent analysis complete', { result });
  return result;
}

/**
 * Enhanced intent analysis - Phase 2
 * Returns full EnhancedIntentAnalysis with actions
 */
export async function analyzeIntentEnhanced(
  prompt: string,
  routingConfig?: CosmoRoutingConfig,
  apiKey?: string,
  context: Record<string, unknown> = {}
): Promise<EnhancedIntentAnalysis> {
  info('=== COSMO: Enhanced Intent Analysis (Phase 2) ===');
  
  // Get basic intent analysis
  const basicAnalysis = await analyzeIntent(prompt, routingConfig, apiKey);
  
  // Get local detection for intent key
  const localDetection = await detectIntentLocally(prompt);
  const intentKey = localDetection.intentKey;
  
  // Extract entities from prompt
  const entityExtractions = extractEntities(prompt);
  debug('Extracted entities from prompt', { count: entityExtractions.length });
  
  // Resolve actions using action resolver
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const actionPlan = await resolveActions(intentKey, prompt, {
    ...context,
    confidence: basicAnalysis.confidence,
  }, supabase);
  
  // Build parameter extractions from actions
  const parameterExtractions: Record<string, string> = {};
  for (const action of actionPlan.actions) {
    Object.assign(parameterExtractions, action.extractedParams);
  }
  
  const enhancedResult: EnhancedIntentAnalysis = {
    ...basicAnalysis,
    intentKey,
    actions: actionPlan.actions,
    actionPlan,
    parameterExtractions,
    entityExtractions,
  };
  
  info('Enhanced intent analysis complete', { actionsPlanned: actionPlan.actions.length });
  return enhancedResult;
}

/**
 * Check if intent requires specific function
 */
export function requiresFunction(intent: IntentAnalysis, functionKey: string): boolean {
  return intent.requiredFunctions.includes(functionKey);
}

/**
 * Check if intent needs specific context
 */
export function needsContext(intent: IntentAnalysis, contextType: ContextNeed): boolean {
  return intent.contextNeeds?.includes(contextType) ?? false;
}

/**
 * Get all available intent categories from database
 */
export async function getAvailableCategories(): Promise<string[]> {
  const intents = await loadIntentsFromDb();
  return [...new Set(intents.map(i => i.category))];
}

/**
 * Get all intent keys from database
 */
export async function getAvailableIntentKeys(): Promise<string[]> {
  const intents = await loadIntentsFromDb();
  return intents.map(i => i.intent_key);
}

/**
 * Refresh intent cache (call when admin updates intents)
 */
export function refreshIntentCache(): void {
  intentCache = null;
  cacheTimestamp = 0;
}
