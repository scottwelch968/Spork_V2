/**
 * Cosmo Function Executor
 * 
 * A TOOL that COSMO uses to execute functions.
 * This is NOT an orchestrator - COSMO is the god layer that decides what to execute.
 * The executor simply runs what COSMO tells it to.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createCosmoError } from './errors.ts';
import { info, warn, error as logError, debug } from './logger.ts';

export interface FunctionExecutionRequest {
  functionKey: string;
  context: Record<string, unknown>;
  requestId: string;
}

export interface FunctionExecutionResult {
  functionKey: string;
  success: boolean;
  data?: unknown;
  error?: string;
  eventsEmitted: string[];
  executionTimeMs: number;
}

export interface BatchExecutionRequest {
  functions: FunctionExecutionRequest[];
  sequential: boolean; // true = run in order, false = parallel
}

export interface BatchExecutionResult {
  success: boolean;
  results: FunctionExecutionResult[];
  totalTimeMs: number;
  errors: string[];
}

/**
 * Execute a single function by key
 * COSMO calls this to run one function
 */
export async function executeFunction(
  request: FunctionExecutionRequest,
  supabase: any
): Promise<FunctionExecutionResult> {
  const startTime = Date.now();
  const eventsEmitted: string[] = [];
  
  try {
    info('Executing function', { functionKey: request.functionKey, requestId: request.requestId });
    
    // Load function configuration from database
    const { data: functionConfig, error: configError } = await supabase
      .from('chat_functions')
      .select('*')
      .eq('function_key', request.functionKey)
      .eq('is_enabled', true)
      .single();
    
    if (configError || !functionConfig) {
      throw createCosmoError('FUNCTION_FAILED', `Function '${request.functionKey}' not found or disabled`);
    }
    
    // Execute based on function category/type
    const result = await executeFunctionLogic(
      request.functionKey,
      functionConfig,
      request.context,
      request.requestId,
      supabase
    );
    
    eventsEmitted.push(`${request.functionKey}:complete`);
    
    return {
      functionKey: request.functionKey,
      success: true,
      data: result,
      eventsEmitted,
      executionTimeMs: Date.now() - startTime,
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logError('Function execution failed', { functionKey: request.functionKey, error: errorMessage });
    
    eventsEmitted.push(`${request.functionKey}:error`);
    
    return {
      functionKey: request.functionKey,
      success: false,
      error: errorMessage,
      eventsEmitted,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Execute multiple functions in batch
 * COSMO calls this to run a sequence of functions
 */
export async function executeFunctions(
  request: BatchExecutionRequest,
  supabase: any
): Promise<BatchExecutionResult> {
  const startTime = Date.now();
  const results: FunctionExecutionResult[] = [];
  const errors: string[] = [];
  
  info('Batch execution started', { count: request.functions.length, mode: request.sequential ? 'sequential' : 'parallel' });
  
  if (request.sequential) {
    // Run functions in order, passing results to next
    let context = { ...request.functions[0]?.context };
    
    for (const func of request.functions) {
      const result = await executeFunction(
        { ...func, context },
        supabase
      );
      results.push(result);
      
      if (!result.success) {
        errors.push(result.error || `Function ${func.functionKey} failed`);
      } else if (result.data) {
        // Merge result into context for next function
        context = { ...context, [func.functionKey]: result.data };
      }
    }
  } else {
    // Run all functions in parallel
    const promises = request.functions.map(func =>
      executeFunction(func, supabase)
    );
    
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);
    
    for (const result of parallelResults) {
      if (!result.success) {
        errors.push(result.error || `Function ${result.functionKey} failed`);
      }
    }
  }
  
  return {
    success: errors.length === 0,
    results,
    totalTimeMs: Date.now() - startTime,
    errors,
  };
}

/**
 * Execute actual function logic based on function key
 * This is where specific function implementations live
 */
async function executeFunctionLogic(
  functionKey: string,
  functionConfig: Record<string, unknown>,
  context: Record<string, unknown>,
  requestId: string,
  supabase: any
): Promise<unknown> {
  
  switch (functionKey) {
    case 'chat':
      // Chat is handled by COSMO's model routing, not here
      return { handled: 'by_cosmo_orchestrator' };
    
    case 'maps':
    case 'google_maps':
      return await executeGoogleMapsFunction(context, supabase);
    
    case 'web_search':
      return await executeWebSearchFunction(context, supabase);
    
    case 'knowledge_base':
      return await executeKnowledgeBaseFunction(context, supabase);
    
    case 'image_generation':
      // Image generation has its own edge function
      return { handled: 'by_image_generation_edge_function' };
    
    case 'gmail':
      return await executeGmailFunction(context, supabase);
    
    case 'calendar':
      return await executeCalendarFunction(context, supabase);
    
    default:
      // For unimplemented functions, return context pass-through
      debug('No implementation for function, passing through', { functionKey });
      return {
        functionKey,
        passthrough: true,
        context,
        timestamp: Date.now(),
      };
  }
}

/**
 * Google Maps function implementation
 */
async function executeGoogleMapsFunction(
  context: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  const query = context.content as string || '';
  const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  
  if (!googleMapsApiKey) {
    throw createCosmoError('CONFIG_MISSING', 'Google Maps API key not configured');
  }
  
  // Extract location query from content
  const locationMatch = query.match(/(?:find|search|where is|locate|directions to|near)\s+(.+)/i);
  const searchQuery = locationMatch ? locationMatch[1] : query;
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleMapsApiKey}`
  );
  
  if (!response.ok) {
    throw createCosmoError('FUNCTION_FAILED', `Google Maps API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    results: data.results?.slice(0, 5) || [],
    query: searchQuery,
    status: data.status,
  };
}

/**
 * Web Search function implementation (placeholder)
 */
async function executeWebSearchFunction(
  context: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  // TODO: Implement with actual search API (e.g., Serper, Google CSE)
  return {
    query: context.content,
    results: [],
    status: 'not_implemented',
    message: 'Web search function requires API integration',
  };
}

/**
 * Knowledge Base function implementation
 */
async function executeKnowledgeBaseFunction(
  context: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  const workspaceId = context.workspaceId as string;
  const query = context.content as string;
  
  if (!workspaceId) {
    throw createCosmoError('INVALID_PAYLOAD', 'Workspace ID required for knowledge base search');
  }
  
  // Search knowledge base documents
  const { data: documents, error } = await supabase
    .from('knowledge_base')
    .select('id, title, content, file_name')
    .eq('workspace_id', workspaceId)
    .textSearch('content', query, { type: 'websearch' })
    .limit(5);
  
  if (error) {
    logError('Knowledge base search error', { error: error.message, workspaceId });
    return { results: [], query, error: error.message };
  }
  
  return {
    results: documents || [],
    query,
    count: documents?.length || 0,
  };
}

/**
 * Gmail function implementation (placeholder)
 */
async function executeGmailFunction(
  context: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  // TODO: Implement with Gmail API OAuth
  return {
    status: 'not_implemented',
    message: 'Gmail function requires OAuth integration',
  };
}

/**
 * Calendar function implementation (placeholder)
 */
async function executeCalendarFunction(
  context: Record<string, unknown>,
  supabase: any
): Promise<unknown> {
  // TODO: Implement with Google Calendar API OAuth
  return {
    status: 'not_implemented',
    message: 'Calendar function requires OAuth integration',
  };
}

/**
 * Check if a function is available and COSMO can use it
 */
export async function isFunctionAvailable(
  functionKey: string,
  supabase: any
): Promise<boolean> {
  const { data, error } = await supabase
    .from('chat_functions')
    .select('is_enabled')
    .eq('function_key', functionKey)
    .single();
  
  return !error && data?.is_enabled === true;
}

/**
 * Get all functions COSMO can use
 */
export async function getAvailableFunctions(
  supabase: any
): Promise<string[]> {
  const { data, error } = await supabase
    .from('chat_functions')
    .select('function_key')
    .eq('is_enabled', true);
  
  if (error) {
    logError('Error fetching available functions', { error: error.message });
    return [];
  }
  
  return data?.map((f: { function_key: string }) => f.function_key) || [];
}
