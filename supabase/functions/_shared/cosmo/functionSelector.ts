/**
 * Cosmo Function Selector
 * Selects appropriate functions based on intent analysis and available functions
 */

import type { 
  IntentAnalysis, 
  FunctionCandidate, 
  FunctionSelection 
} from './types.ts';
import { info, warn, error, debug } from './logger.ts';

/**
 * Query available functions from database
 */
export async function getAvailableFunctions(
  supabase: any
): Promise<FunctionCandidate[]> {
  const { data: functions, error } = await supabase
    .from('chat_functions')
    .select('function_key, name, description, tags, input_schema, output_schema, is_enabled')
    .eq('is_enabled', true);

  if (error) {
    warn('Error fetching chat functions from database', { error: error.message });
    return [];
  }

  return functions || [];
}

/**
 * Match functions based on intent tags
 */
function matchFunctionsByTags(
  functions: FunctionCandidate[],
  requiredFunctions: string[]
): FunctionCandidate[] {
  return functions.filter(fn => 
    requiredFunctions.includes(fn.function_key) ||
    (fn.tags && fn.tags.some(tag => 
      requiredFunctions.some(req => tag.toLowerCase().includes(req.toLowerCase()))
    ))
  );
}

/**
 * Score a function's relevance to the intent
 */
function scoreFunctionRelevance(
  fn: FunctionCandidate,
  intent: IntentAnalysis
): number {
  let score = 0;

  // Direct match with required functions
  if (intent.requiredFunctions.includes(fn.function_key)) {
    score += 10;
  }

  // Tag matching
  if (fn.tags) {
    for (const tag of fn.tags) {
      if (intent.category.toLowerCase().includes(tag.toLowerCase())) {
        score += 3;
      }
      if (intent.requiredFunctions.some(rf => tag.toLowerCase().includes(rf.toLowerCase()))) {
        score += 2;
      }
    }
  }

  // Description matching
  if (fn.description) {
    const descLower = fn.description.toLowerCase();
    if (descLower.includes(intent.category)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Determine execution order based on dependencies
 */
function determineExecutionOrder(
  selectedFunctions: FunctionCandidate[]
): string[] {
  // For now, simple ordering: data-fetching functions first, then processing
  const dataFunctions = ['maps', 'gmail', 'calendar', 'web_search', 'knowledge_base'];
  const processingFunctions = ['chat', 'image_generation'];

  const ordered: string[] = [];

  // Add data functions first
  for (const fn of selectedFunctions) {
    if (dataFunctions.includes(fn.function_key)) {
      ordered.push(fn.function_key);
    }
  }

  // Add processing functions
  for (const fn of selectedFunctions) {
    if (processingFunctions.includes(fn.function_key) && !ordered.includes(fn.function_key)) {
      ordered.push(fn.function_key);
    }
  }

  // Add any remaining
  for (const fn of selectedFunctions) {
    if (!ordered.includes(fn.function_key)) {
      ordered.push(fn.function_key);
    }
  }

  return ordered;
}

/**
 * Main function selection - Cosmo decides which functions to invoke
 */
export async function selectFunctions(
  intent: IntentAnalysis,
  supabase: any
): Promise<FunctionSelection> {
  info('COSMO: Selecting Functions');
  
  // Get all available functions
  const availableFunctions = await getAvailableFunctions(supabase);
  debug('Available functions loaded', { count: availableFunctions.length });

  if (availableFunctions.length === 0) {
    // Fallback to basic chat if no functions registered
    return {
      selectedFunctions: ['chat'],
      executionOrder: ['chat'],
      reasoning: 'No functions registered, defaulting to chat',
    };
  }

  // Score and rank functions
  const scoredFunctions = availableFunctions.map(fn => ({
    fn,
    score: scoreFunctionRelevance(fn, intent),
  }));

  // Sort by score descending
  scoredFunctions.sort((a, b) => b.score - a.score);

  // Select functions with positive scores
  const selectedFunctions = scoredFunctions
    .filter(sf => sf.score > 0)
    .map(sf => sf.fn);

  // Always include chat as a fallback
  const chatFunction = availableFunctions.find(fn => fn.function_key === 'chat');
  if (chatFunction && !selectedFunctions.some(fn => fn.function_key === 'chat')) {
    selectedFunctions.push(chatFunction);
  }

  // If no functions matched, use chat
  if (selectedFunctions.length === 0 && chatFunction) {
    selectedFunctions.push(chatFunction);
  }

  // Determine execution order
  const executionOrder = determineExecutionOrder(selectedFunctions);

  const result: FunctionSelection = {
    selectedFunctions: selectedFunctions.map(fn => fn.function_key),
    executionOrder,
    reasoning: `Selected ${selectedFunctions.length} functions for ${intent.category} intent with ${(intent.confidence * 100).toFixed(0)}% confidence`,
  };

  info('Function selection complete', { 
    selectedCount: result.selectedFunctions.length, 
    executionOrder: result.executionOrder 
  });
  return result;
}

/**
 * Get function configuration by key
 */
export async function getFunctionConfig(
  functionKey: string,
  supabase: any
): Promise<FunctionCandidate | null> {
  const { data, error } = await supabase
    .from('chat_functions')
    .select('function_key, name, description, tags, input_schema, output_schema, is_enabled')
    .eq('function_key', functionKey)
    .eq('is_enabled', true)
    .single();

  if (error) {
    warn('Error fetching function config', { functionKey, error: error.message });
    return null;
  }

  return data;
}

/**
 * Check if a specific function is available and enabled
 */
export async function isFunctionAvailable(
  functionKey: string,
  supabase: any
): Promise<boolean> {
  const config = await getFunctionConfig(functionKey, supabase);
  return config !== null && config.is_enabled;
}
