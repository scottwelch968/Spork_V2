/**
 * COSMO Orchestrator - The God Layer (Phase 3: Unified Entry Point)
 * 
 * Central entry point that coordinates ALL AI interactions and system tasks.
 * COSMO handles all request types through a single orchestrate() function:
 * - Chat messages (user conversations)
 * - Webhooks (external triggers)
 * - System tasks (scheduled jobs, background processing)
 * - Agent actions (AI agent autonomous operations)
 * - API calls (direct integrations)
 * 
 * The functionExecutor is a TOOL that COSMO uses, not a separate orchestrator.
 * COSMO decides WHAT to do, the executor does WHAT COSMO says.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Canonical contract types from contracts.ts
import type { 
  NormalizedRequest,
  CosmoContext,
  ExecutionResult,
  ExecutionError,
  BuildResultOptions,
  CostTier,
} from './contracts.ts';

// Canonical DebugData from contracts.ts (Article II compliance)
import type { DebugData } from './contracts.ts';

// Domain types from types.ts
import type { 
  CosmoRequest, 
  CosmoResponse, 
  CosmoMetadata,
  SystemSettings,
  CosmoRoutingConfig,
  TierAttempt,
  ContextSources,
  CosmoRequestType,
  CosmoRequestSource,
  WebhookResponse,
  SystemTaskResult,
  AgentActionResponse,
  EnhancedIntentAnalysis,
} from './types.ts';
import { analyzeIntent, analyzeIntentEnhanced } from './intentAnalyzer.ts';
import { selectFunctions } from './functionSelector.ts';
import { executeFunctions, type BatchExecutionRequest } from './functionExecutor.ts';
import { routeToModel, getCostTier, getFallbackModel, getSimilarModel } from './modelRouter.ts';
import { enhancePrompt } from './promptEnhancer.ts';
import { 
  createMetadataEvent, 
  estimateTokens, 
  calculateCost, 
  saveDebugLog 
} from './responseProcessor.ts';
import { resolveActions } from './actionResolver.ts';
import { 
  createCosmoError, 
  errorFromException, 
  isCosmoError,
  type CosmoError 
} from './errors.ts';
import { 
  createScopedLogger,
  generateTraceId,
  info as logInfo,
  error as logError,
} from './logger.ts';
import {
  getProviderEndpoint,
  getProviderApiKey,
} from './providerConfig.ts';

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Request Normalization (Phase 3) =============

/**
 * Detect request type from request properties
 */
function detectRequestType(request: CosmoRequest): CosmoRequestType {
  // Explicit request type takes precedence
  if (request.requestType) {
    return request.requestType;
  }
  
  // Detect from request properties
  if (request.webhookPayload) {
    return 'webhook';
  }
  if (request.taskName) {
    return 'system_task';
  }
  if (request.agentId || request.agentGoal) {
    return 'agent_action';
  }
  if (request.source?.type === 'api') {
    return 'api_call';
  }
  
  // Default to chat
  return 'chat';
}

/**
 * Normalize request source
 */
function normalizeSource(request: CosmoRequest): CosmoRequestSource {
  if (request.source) {
    return request.source;
  }
  
  const requestType = detectRequestType(request);
  
  switch (requestType) {
    case 'webhook':
      return { type: 'webhook', metadata: request.webhookPayload };
    case 'system_task':
      return { type: 'system', name: request.taskName };
    case 'agent_action':
      return { type: 'agent', id: request.agentId };
    case 'api_call':
      return { type: 'api' };
    default:
      return { type: 'user', id: request.userId };
  }
}

/**
 * Normalize incoming request with defaults
 * Returns NormalizedRequest with all guaranteed fields
 */
function normalizeRequest(request: CosmoRequest): NormalizedRequest {
  const requestType = detectRequestType(request);
  const timestamp = Date.now();
  const requestId = `cosmo_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
  const traceId = `trace_${timestamp.toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  
  return {
    ...request,
    requestType,
    source: normalizeSource(request),
    responseMode: request.responseMode || (requestType === 'system_task' ? 'silent' : 'stream'),
    priority: request.priority || 'normal',
    normalizedAt: new Date().toISOString(),
    requestId,
    traceId,
  };
}

/**
 * Initialize CosmoContext for a request
 * Creates the shared state object that flows through the pipeline
 */
function initContext(
  request: NormalizedRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): CosmoContext {
  return {
    request,
    supabase,
    settings,
    startTime: Date.now(),
    functionsInvoked: [],
    actionsExecuted: [],
    tiersAttempted: [],
    debug: {
      original_message: request.content,
      requested_model: request.requestedModel || null,
      request_type: request.requestType,
    },
  };
}

/**
 * Build ExecutionResult from context and options
 * Standardizes result creation across all handlers
 */
function buildExecutionResult(
  context: CosmoContext,
  options: BuildResultOptions
): ExecutionResult {
  const processingTimeMs = Date.now() - context.startTime;
  
  return {
    success: options.success ?? true,
    stream: options.stream,
    content: options.content,
    data: options.data,
    actualModelUsed: options.actualModelUsed || 'unknown',
    cosmoSelected: options.cosmoSelected ?? false,
    detectedCategory: options.detectedCategory ?? context.intent?.category ?? null,
    costTier: options.costTier ?? context.modelSelection?.costTier ?? null,
    processingTimeMs,
    functionsInvoked: context.functionsInvoked,
    actionsExecuted: context.actionsExecuted,
    tiersAttempted: context.tiersAttempted,
    tokens: options.tokens,
    cost: options.cost,
    error: options.error,
  };
}

// createExecutionError moved to errors.ts - use errorFromException and toExecutionError instead

// getEndpointForProvider and getApiKeyForProvider moved to providerConfig.ts

/**
 * Make request to AI model
 */
async function makeModelRequest(
  modelId: string,
  provider: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  modelConfig?: Record<string, unknown>
): Promise<{ response: Response; requestBody: Record<string, unknown> }> {
  const endpoint = getProviderEndpoint(provider);
  const apiKey = getProviderApiKey(provider);

  if (!apiKey) {
    throw createCosmoError('CONFIG_MISSING', `API key not configured for provider: ${provider}`);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (provider.toLowerCase() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://spork.app';
    headers['X-Title'] = 'Spork AI';
  }

  // Build model parameters
  const isLovableAI = provider.toLowerCase() !== 'openrouter';
  
  // COSMO Constitution Article VI: Database-driven model configuration
  // Use skip_temperature flag from ai_models table instead of hardcoded pattern matching
  const skipTemperature = modelConfig?.skip_temperature ?? false;

  const modelParams: Record<string, unknown> = {};

  if (modelConfig) {
    if (isLovableAI) {
      modelParams.max_completion_tokens = modelConfig.default_max_tokens;
    } else {
      modelParams.max_tokens = modelConfig.default_max_tokens;
    }

    // Only add temperature if model doesn't skip it (database-driven)
    if (!skipTemperature) {
      modelParams.temperature = modelConfig.default_temperature ?? 0.7;
    }

    modelParams.top_p = modelConfig.default_top_p;
    modelParams.frequency_penalty = modelConfig.default_frequency_penalty;
    modelParams.presence_penalty = modelConfig.default_presence_penalty;
  } else {
    if (isLovableAI) {
      modelParams.max_completion_tokens = 2048;
    } else {
      modelParams.max_tokens = 2048;
    }
    // Default: include temperature (skipTemperature is false when no modelConfig)
    if (!skipTemperature) {
      modelParams.temperature = 0.7;
    }
  }

  const requestBody = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
    ...modelParams,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  return { response, requestBody };
}

/**
 * Execute tiered fallback system
 */
async function executeTieredFallback(
  primaryModelId: string,
  primaryProvider: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  modelConfig: Record<string, unknown> | null,
  modelCategory: string,
  supabase: SupabaseClient
): Promise<{ 
  response: Response; 
  actualModelUsed: string; 
  tiersAttempted: TierAttempt[];
  requestBody: Record<string, unknown>;
}> {
  const tiersAttempted: TierAttempt[] = [];
  const logger = createScopedLogger(`fallback_${Date.now().toString(36)}`);
  
  // TIER 1: Primary model
  logger.info('TIER 1: Trying primary model', { model: primaryModelId, provider: primaryProvider });
  let result = await makeModelRequest(primaryModelId, primaryProvider, systemPrompt, messages, modelConfig || undefined);
  
  tiersAttempted.push({
    tier: 1,
    tier_name: 'Primary Model',
    model: primaryModelId,
    provider: primaryProvider,
    success: result.response.ok,
    error: result.response.ok ? undefined : `HTTP ${result.response.status}`,
    status_code: result.response.status,
  });

  if (result.response.ok) {
    logger.info('TIER 1 success', { model: primaryModelId });
    return { response: result.response, actualModelUsed: primaryModelId, tiersAttempted, requestBody: result.requestBody };
  }

  // TIER 2: Similar category model
  logger.warn('TIER 1 failed, trying similar model', { status: result.response.status });
  const similarModel = await getSimilarModel(supabase, primaryModelId, modelCategory);
  
  if (similarModel) {
    logger.info('TIER 2: Trying similar model', { model: similarModel.model_id });
    result = await makeModelRequest(similarModel.model_id, 'OpenRouter', systemPrompt, messages);
    
    tiersAttempted.push({
      tier: 2,
      tier_name: 'Similar Category Model',
      model: similarModel.model_id,
      provider: 'OpenRouter',
      success: result.response.ok,
      error: result.response.ok ? undefined : `HTTP ${result.response.status}`,
      status_code: result.response.status,
    });

    if (result.response.ok) {
      logger.info('TIER 2 success', { model: similarModel.model_id });
    }
    }

  // TIER 2b: Any other OpenRouter model
  const { data: anyModelData } = await supabase
    .from('ai_models')
    .select('model_id')
    .eq('provider', 'OpenRouter')
    .neq('model_id', primaryModelId)
    .neq('model_id', similarModel?.model_id || '')
    .eq('is_active', true)
    .limit(1)
    .single();

  const anyModel = anyModelData as { model_id: string } | null;

  if (anyModel) {
    logger.info('TIER 2b: Trying any OpenRouter model', { model: anyModel.model_id });
    result = await makeModelRequest(anyModel.model_id, 'OpenRouter', systemPrompt, messages);
    
    tiersAttempted.push({
      tier: 2,
      tier_name: 'Any OpenRouter Model',
      model: anyModel.model_id,
      provider: 'OpenRouter',
      success: result.response.ok,
      error: result.response.ok ? undefined : `HTTP ${result.response.status}`,
      status_code: result.response.status,
    });

    if (result.response.ok) {
      logger.info('TIER 2b success', { model: anyModel.model_id });
    }
  }

  // TIER 3: Lovable AI fallback
  const fallback = await getFallbackModel(supabase);
  if (fallback) {
    logger.info('TIER 3: Trying Lovable AI fallback', { model: fallback.model_id });
    result = await makeModelRequest(fallback.model_id, fallback.provider, systemPrompt, messages);
    
    tiersAttempted.push({
      tier: 3,
      tier_name: 'Lovable AI Fallback',
      model: fallback.model_id,
      provider: fallback.provider,
      success: result.response.ok,
      error: result.response.ok ? undefined : `HTTP ${result.response.status}`,
      status_code: result.response.status,
    });

    if (result.response.ok) {
      logger.info('TIER 3 success', { model: fallback.model_id });
    }
  }

  // All tiers failed
  logger.error('All tiers failed', { tiersAttempted: tiersAttempted.length });
  return { response: result.response, actualModelUsed: primaryModelId, tiersAttempted, requestBody: result.requestBody };
}

/**
 * Load system settings from database
 */
async function loadSettings(supabase: SupabaseClient): Promise<SystemSettings> {
  const { data } = await supabase.from('system_settings').select('*');
  
  const settings: SystemSettings = {};
  data?.forEach((s: { setting_key: string; setting_value: unknown }) => {
    (settings as Record<string, unknown>)[s.setting_key] = s.setting_value;
  });
  
  return settings;
}

// ============= Request Type Handlers (Phase 3) =============

/**
 * Handle webhook requests
 */
async function handleWebhookFlow(
  request: CosmoRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<WebhookResponse> {
  logInfo('Processing webhook request');
  
  const payload = request.webhookPayload || {};
  const event = payload.event as string || 'unknown';
  
  // Analyze intent from webhook event
  const intent = await analyzeIntentEnhanced(
    `Webhook event: ${event}. Data: ${JSON.stringify(payload.data || {})}`,
    settings.cosmo_routing_config,
    Deno.env.get('OPENROUTER_API_KEY')
  );
  
  // Execute actions from the plan
  const actionsExecuted: string[] = [];
  
  for (const action of intent.actionPlan.actions) {
    if (action.actionType === 'function') {
      const functionKey = action.config.function_key as string;
      if (functionKey) {
        const batchRequest: BatchExecutionRequest = {
          functions: [{
            functionKey,
            context: {
              webhookEvent: event,
              webhookData: payload.data,
              ...action.extractedParams,
            },
            requestId: `webhook_${Date.now()}_${functionKey}`,
          }],
          sequential: true,
        };
        
        const result = await executeFunctions(batchRequest, supabase);
        if (result.success) {
          actionsExecuted.push(functionKey);
        }
      }
    }
  }
  
  return {
    success: true,
    message: `Processed webhook event: ${event}`,
    actionsExecuted,
  };
}

/**
 * Handle system task requests
 */
async function handleSystemTaskFlow(
  request: CosmoRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<SystemTaskResult> {
  logInfo('Processing system task', { taskName: request.taskName });
  
  const startedAt = new Date().toISOString();
  const taskConfig = request.taskConfig || {};
  
  try {
    // Resolve actions for this task
    const actionPlan = await resolveActions(
      request.taskName || 'system_task',
      `Execute system task: ${request.taskName}`,
      taskConfig,
      supabase
    );
    
    // Execute each action
    const results: Record<string, unknown> = {};
    
    for (const action of actionPlan.actions) {
      if (action.actionType === 'function') {
        const functionKey = action.config.function_key as string;
        if (functionKey) {
          const batchRequest: BatchExecutionRequest = {
            functions: [{
              functionKey,
              context: {
                taskName: request.taskName,
                ...taskConfig,
                ...action.extractedParams,
              },
              requestId: `task_${Date.now()}_${functionKey}`,
            }],
            sequential: true,
          };
          
          const result = await executeFunctions(batchRequest, supabase);
          results[functionKey] = result;
        }
      }
    }
    
    return {
      taskName: request.taskName || 'unknown',
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      result: results,
    };
  } catch (error) {
    return {
      taskName: request.taskName || 'unknown',
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle agent action requests
 */
/**
 * Maximum iterations allowed for agent execution loops
 * Prevents runaway agents from consuming resources
 */
const AGENT_MAX_ITERATIONS = 10;

async function handleAgentActionFlow(
  request: CosmoRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<AgentActionResponse> {
  logInfo('Processing agent action', { agentId: request.agentId });
  
  const goal = request.agentGoal || request.content;
  const agentContext = request.agentContext || {};
  
  // Get max iterations from agent context or use default
  const maxIterations = (agentContext.maxIterations as number) || AGENT_MAX_ITERATIONS;
  let iterationCount = 0;
  
  // Analyze the agent's goal
  const intent = await analyzeIntentEnhanced(
    goal,
    settings.cosmo_routing_config,
    Deno.env.get('OPENROUTER_API_KEY'),
    agentContext
  );
  
  // Execute actions with loop enforcement
  const actionsTaken: Array<{ actionKey: string; success: boolean; data?: unknown; error?: string; executionTimeMs: number }> = [];
  
  for (const action of intent.actionPlan.actions) {
    // CRITICAL: Enforce loop limit before each iteration
    iterationCount++;
    if (iterationCount > maxIterations) {
      logInfo('Agent exceeded max iterations', { agentId: request.agentId, maxIterations });
      actionsTaken.push({
        actionKey: 'loop_limit_exceeded',
        success: false,
        error: `Agent execution stopped: exceeded maximum iterations limit (${maxIterations}). This is a safety measure to prevent runaway processes.`,
        executionTimeMs: 0,
      });
      break;
    }
    
    const startTime = Date.now();
    
    if (action.actionType === 'function') {
      const functionKey = action.config.function_key as string;
      if (functionKey) {
        const batchRequest: BatchExecutionRequest = {
          functions: [{
            functionKey,
            context: {
              agentId: request.agentId,
              agentGoal: goal,
              iterationCount,
              maxIterations,
              ...agentContext,
              ...action.extractedParams,
            },
            requestId: `agent_${Date.now()}_${functionKey}`,
          }],
          sequential: true,
        };
        
        try {
          const result = await executeFunctions(batchRequest, supabase);
          actionsTaken.push({
            actionKey: functionKey,
            success: result.success,
            data: result.results,
            executionTimeMs: Date.now() - startTime,
          });
        } catch (error) {
          actionsTaken.push({
            actionKey: functionKey,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTimeMs: Date.now() - startTime,
          });
        }
      }
    } else if (action.actionType === 'model_call') {
      // For model calls, we'll need to do a simplified chat
      actionsTaken.push({
        actionKey: action.actionKey,
        success: true,
        data: { message: 'Model call would be executed here' },
        executionTimeMs: Date.now() - startTime,
      });
    }
  }
  
  // Check if loop limit was exceeded
  const loopLimitExceeded = actionsTaken.some(a => a.actionKey === 'loop_limit_exceeded');
  
  // Determine if goal was achieved (simplified check)
  const goalAchieved = !loopLimitExceeded && actionsTaken.length > 0 && actionsTaken.every(a => a.success);
  
  return {
    actionsTaken,
    goalAchieved,
    nextSteps: loopLimitExceeded 
      ? ['Agent loop limit exceeded - review agent configuration', 'Consider breaking goal into smaller sub-tasks']
      : (goalAchieved ? [] : ['Retry failed actions', 'Request human assistance']),
    reasoning: loopLimitExceeded
      ? `Agent execution stopped after ${iterationCount} iterations (limit: ${maxIterations})`
      : `Executed ${actionsTaken.length} actions based on intent analysis`,
  };
}

// ============= Specialized Request Handlers (Phase 4) =============

import type {
  EnhancePromptRequest,
  EnhancePromptResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  KnowledgeQueryRequest,
  KnowledgeQueryResponse,
} from './types.ts';
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Handle enhance prompt requests through COSMO
 */
async function handleEnhancePromptFlow(
  request: EnhancePromptRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<EnhancePromptResponse> {
  // Fetch model configuration from database
  const { data: cosmoModelSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'cosmo_routing_config')
    .maybeSingle();
  
  const cosmoRoutingConfig = cosmoModelSetting?.setting_value as { model_id?: string } | undefined;
  
  // Get fallback model from DB for enhance prompt fallback
  const { data: fallbackSetting } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'fallback_model')
    .maybeSingle();
  
  const fallbackConfig = fallbackSetting?.setting_value as { model_id?: string } | undefined;
  
  const DEFAULT_SYSTEM_PROMPT = `You are Cosmo, an expert prompt engineer. Your task is to enhance and improve the user's prompt to make it clearer, more specific, and more likely to get a high-quality AI response. 

Guidelines:
- Make the prompt more detailed and specific
- Add relevant context or constraints if helpful
- Improve clarity and structure
- Keep the original intent intact
- Return ONLY the enhanced prompt, nothing else - no explanations, no preamble, no quotes, just the improved prompt text.`;

  // Get Cosmo config
  const cosmoConfig = settings.cosmo_config as { enabled?: boolean; model_id?: string; system_prompt?: string; use_pre_message_context?: boolean } | undefined;
  const preMessageConfig = settings.pre_message_config;
  
  const modelId = cosmoConfig?.model_id || cosmoRoutingConfig?.model_id;
  if (!modelId) {
    throw createCosmoError('CONFIG_MISSING', 'No model configured for prompt enhancement. Configure cosmo_routing_config in system settings.');
  }
  const baseSystemPrompt = cosmoConfig?.system_prompt || DEFAULT_SYSTEM_PROMPT;
  const usePreMessageContext = cosmoConfig?.use_pre_message_context ?? false;

  // Build context parts
  const contextParts: string[] = [baseSystemPrompt];

  if (usePreMessageContext && preMessageConfig) {
    // Add persona context
    if (preMessageConfig.include_persona && request.personaId) {
      const { data: persona } = await supabase
        .from('personas')
        .select('system_prompt, name')
        .eq('id', request.personaId)
        .single();
      
      if (persona?.system_prompt) {
        contextParts.push(`\n\nActive Persona (${persona.name}): Consider this persona's style and approach when enhancing the prompt: ${persona.system_prompt}`);
      }
    }

    // Add conversation history
    if (preMessageConfig.include_history && request.chatId) {
      const maxMessages = preMessageConfig.max_history_messages || 5;
      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('chat_id', request.chatId)
        .order('created_at', { ascending: false })
        .limit(maxMessages);
      
      if (history?.length) {
        const historyContext = history.reverse()
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`)
          .join('\n');
        contextParts.push(`\n\nRecent Conversation Context:\n${historyContext}`);
      }
    }
  }

  const finalSystemPrompt = contextParts.join('');
  const messages = [{ role: 'user', content: `Please enhance this prompt:\n\n${request.prompt}` }];

  // Get model provider
  const { data: modelInfo } = await supabase
    .from('ai_models')
    .select('provider')
    .eq('model_id', modelId)
    .eq('is_active', true)
    .single();

  const provider = modelInfo?.provider || 'OpenRouter';

  // Use COSMO's tiered fallback
  const { response, actualModelUsed } = await executeTieredFallback(
    modelId,
    provider,
    finalSystemPrompt,
    messages,
    null,
    'prompt_enhancement',
    supabase
  );

  if (!response.ok) {
    if (response.status === 429) throw createCosmoError('RATE_LIMITED');
    if (response.status === 402) throw createCosmoError('PAYMENT_REQUIRED');
    throw createCosmoError('INTERNAL_ERROR', 'Enhancement failed');
  }

  const data = await response.json();
  const enhancedPrompt = data?.choices?.[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    throw createCosmoError('INTERNAL_ERROR', 'No enhanced prompt returned');
  }

  return { enhancedPrompt, model: actualModelUsed };
}

/**
 * Handle image generation requests through COSMO
 */
async function handleImageGenerationFlow(
  request: ImageGenerationRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<ImageGenerationResponse> {
  logInfo('Processing image generation request', { model: request.selectedModel });
  
  const routingConfig = settings.cosmo_routing_config as CosmoRoutingConfig | undefined;
  const costWeight = routingConfig?.cost_performance_weight ?? 50;
  
  // Fetch image models from database
  const { data: imageModels } = await supabase
    .from('ai_models')
    .select('model_id, best_for_description, pricing_prompt, provider')
    .eq('best_for', 'image_generation')
    .eq('is_active', true)
    .neq('provider', 'Lovable AI')
    .order('display_order', { ascending: true });

  const modelIds = imageModels?.map((m: { model_id: string }) => m.model_id) || [];
  const wasAutoSelected = !request.selectedModel || request.selectedModel === 'auto';
  
  let selectedModelId: string;
  let provider: string;

  // TIER 1: COSMO AI auto-selection - model from database config (no hard-coded fallback)
  if (wasAutoSelected && modelIds.length > 0) {
    logInfo('TIER 1: Cosmo AI analyzing prompt for model selection');
    
    const cosmoModelId = routingConfig?.model_id;
    if (!cosmoModelId) {
      throw createCosmoError('CONFIG_MISSING', 'No routing model configured in cosmo_routing_config');
    }
    const modelDescriptions = imageModels?.map((m: { model_id: string; best_for_description: string }) => 
      `- ${m.model_id}: ${m.best_for_description || 'Image generation'}`
    ).join('\n') || '';

    try {
      const { response } = await makeModelRequest(
        cosmoModelId,
        'OpenRouter',
        '',
        [{
          role: 'user',
          content: `Analyze this image generation prompt and respond with ONLY the best model ID.\n\nAvailable models:\n${modelDescriptions}\n\nPrompt: "${request.prompt}"\n\nRespond with ONLY the model ID:`
        }],
        { default_max_tokens: 50 }
      );

      if (response.ok) {
        const data = await response.json();
        const recommended = data.choices?.[0]?.message?.content?.trim();
        if (modelIds.includes(recommended)) {
          selectedModelId = recommended;
          provider = imageModels?.find((m: { model_id: string }) => m.model_id === recommended)?.provider || 'OpenRouter';
        } else {
          // Fall back to cost-weight selection
          selectedModelId = selectImageModelByCost(costWeight, imageModels || []);
          provider = 'OpenRouter';
        }
      } else {
        selectedModelId = selectImageModelByCost(costWeight, imageModels || []);
        provider = 'OpenRouter';
      }
    } catch {
      selectedModelId = selectImageModelByCost(costWeight, imageModels || []);
      provider = 'OpenRouter';
    }
  } else {
    // TIER 2: User-selected model - no hard-coded fallback
    if (!request.selectedModel && modelIds.length === 0) {
      throw createCosmoError('CONFIG_MISSING', 'No image generation models available in database');
    }
    selectedModelId = request.selectedModel || modelIds[0];
    const modelData = imageModels?.find((m: { model_id: string }) => m.model_id === selectedModelId);
    provider = modelData?.provider || 'OpenRouter';
  }

  logInfo('Model selected for image generation', { model: selectedModelId, provider });

  // Make image generation request
  let result = await makeImageGenerationRequest(selectedModelId, provider, request.prompt);
  let actualModelUsed = selectedModelId;

  // TIER 3: Admin default fallback
  if (!result.ok && result.status !== 429 && result.status !== 402) {
    const { data: settingData } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'image_model')
      .maybeSingle();

    const adminModel = (settingData?.setting_value as { model_id?: string; provider?: string })?.model_id;
    const adminProvider = (settingData?.setting_value as { model_id?: string; provider?: string })?.provider || 'OpenRouter';

    if (adminModel) {
      result = await makeImageGenerationRequest(adminModel, adminProvider, request.prompt);
      if (result.ok) actualModelUsed = adminModel;
    }
  }

  // TIER 4: Lovable AI fallback from database
  if (!result.ok && result.status !== 429 && result.status !== 402) {
    // Get image fallback model from database
    const { data: imageFallbackSetting } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'image_fallback_model')
      .maybeSingle();
    
    const imageFallbackConfig = imageFallbackSetting?.setting_value as { model_id?: string; provider?: string } | undefined;
    const fallbackModel = imageFallbackConfig?.model_id;
    const fallbackProvider = imageFallbackConfig?.provider || 'Lovable AI';
    
    if (fallbackModel) {
      result = await makeImageGenerationRequest(fallbackModel, fallbackProvider, request.prompt);
      if (result.ok) actualModelUsed = fallbackModel;
    }
  }

  if (!result.ok) {
    if (result.status === 429) throw createCosmoError('RATE_LIMITED');
    if (result.status === 402) throw createCosmoError('PAYMENT_REQUIRED');
    throw createCosmoError('INTERNAL_ERROR', `Image generation failed: ${result.errorText}`);
  }

  // deno-lint-ignore no-explicit-any
  const rawImageUrl = (result.data as any)?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
  if (!rawImageUrl) throw createCosmoError('INTERNAL_ERROR', 'No image generated');

  let finalImageUrl = rawImageUrl;
  let storagePath: string | undefined;

  // Upload base64 to storage
  if (rawImageUrl.startsWith('data:image/')) {
    const matches = rawImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const imageType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = decode(base64Data);
      
      const timestamp = Date.now();
      const uniqueId = crypto.randomUUID();
      const userFolder = request.userId || 'anonymous';
      storagePath = `${userFolder}/temp-ai-images/${timestamp}-${uniqueId}.${imageType}`;

      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(storagePath, imageBuffer, {
          contentType: `image/${imageType}`,
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(storagePath);
        finalImageUrl = urlData.publicUrl;
      }
    }
  }

  return {
    imageUrl: finalImageUrl,
    model: actualModelUsed,
    cosmoSelected: wasAutoSelected,
    storagePath,
  };
}

// Helper: Select image model by cost weight
// Per COSMO Constitution Article VI: No hard-coded intelligence - throws if no models available
function selectImageModelByCost(weight: number, models: Array<{ model_id: string; pricing_prompt?: number }>): string {
  if (models.length === 0) {
    throw createCosmoError('CONFIG_MISSING', 'No image generation models available in database');
  }
  
  const sorted = [...models].sort((a, b) => (a.pricing_prompt || 0) - (b.pricing_prompt || 0));
  const total = sorted.length;
  
  let index: number;
  if (weight <= 33) {
    index = Math.floor(Math.random() * Math.ceil(total / 3));
  } else if (weight <= 66) {
    const start = Math.ceil(total / 3);
    const end = Math.ceil(2 * total / 3);
    index = start + Math.floor(Math.random() * (end - start)) || Math.floor(total / 2);
  } else {
    index = Math.ceil(2 * total / 3) + Math.floor(Math.random() * Math.ceil(total / 3));
    index = Math.min(index, total - 1);
  }
  
  return sorted[index]?.model_id || sorted[0]?.model_id;
}

// Helper: Make image generation request
async function makeImageGenerationRequest(
  modelId: string,
  provider: string,
  prompt: string
): Promise<{ ok: boolean; data?: Record<string, unknown>; status?: number; errorText?: string }> {
  const endpoint = getProviderEndpoint(provider);
  const apiKey = getProviderApiKey(provider);

  if (!apiKey) return { ok: false, errorText: `No API key for ${provider}` };

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (provider?.toLowerCase() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://spork.app';
    headers['X-Title'] = 'Spork AI';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, status: response.status, errorText };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, errorText: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Handle knowledge base query requests through COSMO
 */
async function handleKnowledgeQueryFlow(
  request: KnowledgeQueryRequest,
  supabase: SupabaseClient,
  settings: SystemSettings
): Promise<KnowledgeQueryResponse> {
  logInfo('Processing knowledge query request', { workspaceId: request.workspaceId });
  
  // Model will be fetched from system_settings below

  // Fetch documents
  let query = supabase
    .from('knowledge_base')
    .select('*')
    .eq('user_id', request.userId)
    .eq('workspace_id', request.workspaceId);

  if (request.documentIds?.length) {
    query = query.in('id', request.documentIds);
  }

  const { data: documents, error: fetchError } = await query;

  if (fetchError) throw createCosmoError('INTERNAL_ERROR', `Failed to fetch documents: ${fetchError.message}`);
  if (!documents?.length) {
    return {
      answer: 'No documents found. Please upload documents first.',
      sources: [],
      model: 'none',
    };
  }

  // Find relevant chunks
  const relevantChunks = findRelevantChunks(request.question, documents);
  const context = relevantChunks
    .map(chunk => `[${chunk.title}]\n${chunk.content}`)
    .join('\n\n---\n\n');

  // Get KB model from settings
  const { data: settingData } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'knowledge_base_model')
    .maybeSingle();

  const kbModel = (settingData?.setting_value as { model_id?: string })?.model_id;
  const kbProvider = (settingData?.setting_value as { provider?: string })?.provider || 'OpenRouter';
  
  if (!kbModel) {
    throw createCosmoError('CONFIG_MISSING', 'No knowledge base model configured. Configure knowledge_base_model in system settings.');
  }

  const systemPrompt = `You are a helpful AI assistant that answers questions based on provided document context. 
Always cite the source documents in your answer using [Document Title] format. 
If the answer is not in the provided context, say so clearly.`;

  const messages = [{
    role: 'user',
    content: `Context from uploaded documents:\n\n${context}\n\nQuestion: ${request.question}\n\nPlease answer based on the provided context and cite your sources.`
  }];

  // Use COSMO's tiered fallback
  const { response, actualModelUsed } = await executeTieredFallback(
    kbModel,
    kbProvider,
    systemPrompt,
    messages,
    null,
    'research',
    supabase
  );

  if (!response.ok) {
    if (response.status === 429) throw createCosmoError('RATE_LIMITED');
    if (response.status === 402) throw createCosmoError('PAYMENT_REQUIRED');
    throw createCosmoError('INTERNAL_ERROR', 'Knowledge query failed');
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;

  if (!answer) throw createCosmoError('INTERNAL_ERROR', 'No answer returned');

  const sources = Array.from(new Set(relevantChunks.map(c => JSON.stringify({
    id: c.documentId,
    title: c.title,
    fileName: c.fileName
  })))).map(s => JSON.parse(s));

  return { answer, sources, model: actualModelUsed };
}

// Helper: Find relevant document chunks
function findRelevantChunks(question: string, documents: Array<{ id: string; title: string; file_name: string; chunks?: Array<{ content: string }> }>) {
  const words = question.toLowerCase().split(/\s+/);
  const chunks: Array<{ documentId: string; title: string; fileName: string; content: string; relevance: number }> = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks || []) {
      const text = chunk.content.toLowerCase();
      const matchCount = words.filter(w => w.length > 3 && text.includes(w)).length;
      if (matchCount > 0) {
        chunks.push({
          documentId: doc.id,
          title: doc.title,
          fileName: doc.file_name,
          content: chunk.content,
          relevance: matchCount
        });
      }
    }
  }

  return chunks.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

// ============= Exported HTTP Request Handlers =============

/**
 * HTTP handler for enhance prompt requests
 */
export async function handleEnhancePromptRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract user ID
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const settings = await loadSettings(supabase);
    const result = await handleEnhancePromptFlow({
      prompt: body.prompt,
      personaId: body.personaId,
      chatId: body.chatId,
      userId,
    }, supabase, settings);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (message === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'Usage limit reached. Please add credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * HTTP handler for image generation requests
 */
export async function handleImageGenerationRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const settings = await loadSettings(supabase);
    const result = await handleImageGenerationFlow({
      prompt: body.prompt,
      userId: body.userId,
      workspaceId: body.workspaceId,
      selectedModel: body.selectedModel,
      isWorkspaceChat: body.isWorkspaceChat,
    }, supabase, settings);

    // Track usage
    if (body.userId) {
      const { data: costData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'image_generation_cost')
        .maybeSingle();
      
      const imageCost = (costData?.setting_value as { cost_usd?: number })?.cost_usd ?? 0.04;
      
      await supabase.functions.invoke('track-usage', {
        body: {
          userId: body.userId,
          workspaceId: body.workspaceId,
          actionType: 'image_generation',
          model: result.model,
          cost: imageCost,
        }
      });
    }

    return new Response(JSON.stringify({
      imageUrl: result.imageUrl,
      model: result.model,
      cosmoSelected: result.cosmoSelected,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (message === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * HTTP handler for knowledge base query requests
 */
export async function handleKnowledgeQueryRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const settings = await loadSettings(supabase);
    const result = await handleKnowledgeQueryFlow({
      question: body.question,
      userId: body.userId,
      workspaceId: body.workspaceId,
      documentIds: body.documentIds,
    }, supabase, settings);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (message === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add credits.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle chat flow (existing logic)
 */
async function handleChatFlow(
  request: CosmoRequest,
  supabase: SupabaseClient,
  settings: SystemSettings,
  debugData: DebugData
): Promise<CosmoResponse> {
  const startTime = Date.now();
  const routingConfig = settings.cosmo_routing_config as CosmoRoutingConfig | undefined;
  const debugEnabled = (settings.cosmo_debug_enabled as { enabled?: boolean })?.enabled ?? false;
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');

  // Step 2: Analyze intent (use enhanced analysis)
  const intent = await analyzeIntentEnhanced(request.content, routingConfig, apiKey);
  debugData.detected_intent = intent.category;

  // Step 3: COSMO selects functions to execute based on intent
  const functionSelection = await selectFunctions(intent, supabase);
  debugData.functions_invoked = functionSelection.selectedFunctions;
  debugData.intent_patterns = [
    `functions:${functionSelection.selectedFunctions.join(',')}`,
    `confidence:${(intent.confidence * 100).toFixed(0)}%`,
    `actions:${intent.actionPlan.actions.length}`,
  ];
  
  // Step 3b: COSMO executes non-chat functions using its functionExecutor tool
  const nonChatFunctions = (functionSelection.executionOrder ?? []).filter(f => f !== 'chat');
  let functionResults: Record<string, unknown> = {};
  
  if (nonChatFunctions.length > 0) {
    logInfo('Executing functions via executor tool', { count: nonChatFunctions.length });
    
    const batchRequest: BatchExecutionRequest = {
      functions: nonChatFunctions.map(functionKey => ({
        functionKey,
        context: {
          content: request.content,
          workspaceId: request.workspaceId,
          chatId: request.chatId,
          userId: request.userId,
          personaId: request.personaId,
          extractedParams: intent.parameterExtractions,
        },
        requestId: `cosmo_${Date.now()}_${functionKey}`,
      })),
      sequential: true,
    };
    
    const executionResult = await executeFunctions(batchRequest, supabase);
    
    for (const result of executionResult.results) {
      if (result.success && result.data) {
        functionResults[result.functionKey] = result.data;
      }
    }
    
    logInfo('Function execution complete', { success: executionResult.success, resultsCount: executionResult.results.length });
  }

  // Step 4: Route to model
  const modelSelection = await routeToModel(
    intent,
    routingConfig || { enabled: false, model_id: '', provider: '', cost_performance_weight: 50, system_prompt: '', available_categories: [], fallback_category: 'conversation' },
    supabase,
    request.requestedModel
  );
  
  if (request.requestedModel === 'auto') {
    debugData.intent_patterns.push(`cost_tier:${modelSelection.costTier}`);
    debugData.intent_patterns.push(`routing_model:${routingConfig?.model_id || 'none'}`);
  }

  // Step 5: Enhance prompt with context (including function results)
  const enhancedPrompt = await enhancePrompt(request, intent, settings, supabase, functionResults);
  debugData.full_system_prompt = enhancedPrompt.systemPrompt;
  debugData.system_prompt_preview = enhancedPrompt.systemPrompt.slice(0, 500);
  if (enhancedPrompt.contextSources) debugData.context_sources = enhancedPrompt.contextSources;

  // Step 6: Get model config
  const { data: modelConfig } = await supabase
    .from('ai_models')
    .select('*')
    .eq('model_id', modelSelection.selectedModelId)
    .eq('is_active', true)
    .single();

  debugData.selected_model = modelSelection.selectedModelId ?? null;
  debugData.model_provider = modelSelection.provider ?? null;

  // Step 7: Execute with tiered fallback
  const selectedModelId = modelSelection.selectedModelId ?? modelSelection.selectedModel ?? '';
  const selectedProvider = modelSelection.provider ?? 'OpenRouter';
  
  const { response, actualModelUsed, tiersAttempted, requestBody } = await executeTieredFallback(
    selectedModelId,
    selectedProvider,
    enhancedPrompt.systemPrompt,
    enhancedPrompt.messages ?? [],
    modelConfig,
    modelSelection.selectedCategory ?? intent.category,
    supabase
  );

  debugData.tiers_attempted = tiersAttempted;
  debugData.api_request_body = requestBody;
  debugData.selected_model = actualModelUsed;
  debugData.fallback_used = actualModelUsed !== modelSelection.selectedModelId;

  // Handle error responses
  if (!response.ok) {
    debugData.success = false;
    debugData.response_time_ms = Date.now() - startTime;

    if (response.status === 429) {
      debugData.error_message = 'Rate limits exceeded';
      if (debugEnabled) await saveDebugLog(supabase, debugData, request.workspaceId, request.chatId, request.userId);
      throw createCosmoError('RATE_LIMITED');
    }
    if (response.status === 402) {
      debugData.error_message = 'Payment required';
      if (debugEnabled) await saveDebugLog(supabase, debugData, request.workspaceId, request.chatId, request.userId);
      throw createCosmoError('PAYMENT_REQUIRED');
    }

    debugData.error_message = `All models failed: ${response.status}`;
    if (debugEnabled) await saveDebugLog(supabase, debugData, request.workspaceId, request.chatId, request.userId);
    throw createCosmoError('ALL_MODELS_FAILED', `All models failed with status ${response.status}`);
  }

  // Calculate tokens and cost
  const promptText = (enhancedPrompt.messages ?? []).map(m => m.content).join(' ');
  const tokens = estimateTokens(promptText);
  const cost = calculateCost(tokens, modelConfig?.pricing_prompt || 0, modelConfig?.pricing_completion || 0);

  debugData.prompt_tokens = tokens.prompt;
  debugData.completion_tokens = tokens.completion;
  debugData.total_tokens = tokens.total;
  debugData.cost = cost;
  debugData.response_time_ms = Date.now() - startTime;
  debugData.actions_executed = intent.actionPlan.actions.map(a => a.actionKey);

  // Log usage
  if (request.userId && request.workspaceId) {
    await supabase.from('usage_logs').insert({
      user_id: request.userId,
      workspace_id: request.workspaceId,
      action: 'chat_message',
      action_type: 'chat',
      model: actualModelUsed,
      tokens_used: tokens.total,
      prompt_tokens: tokens.prompt,
      completion_tokens: tokens.completion,
      cost,
      metadata: {
        chat_id: request.chatId,
        persona_id: request.personaId,
        requested_model: request.requestedModel,
        actual_model: actualModelUsed,
        fallback_used: debugData.fallback_used,
        functions_invoked: functionSelection.selectedFunctions,
        actions_executed: debugData.actions_executed,
      },
    });
  }

  // Save debug log
  if (debugEnabled) {
    await saveDebugLog(supabase, debugData, request.workspaceId, request.chatId, request.userId);
  }

  // Create metadata for response
  const metadata: CosmoMetadata = {
    actualModelUsed,
    cosmoSelected: request.requestedModel === 'auto',
    detectedCategory: intent.category,
    costTier: modelSelection.costTier,
    functionsInvoked: functionSelection.selectedFunctions,
    processingTimeMs: Date.now() - startTime,
    requestType: request.requestType,
    actionsExecuted: debugData.actions_executed,
  };

  // Create streaming response with metadata injection
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = response.body!.getReader();
    
    try {
      // Send metadata first
      await writer.write(encoder.encode(createMetadataEvent(metadata)));
      
      // Stream content
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writer.write(value);
      }
    } finally {
      await writer.close();
    }
  })();

  return { stream: readable, metadata };
}

// ============= Main Orchestrator (Phase 3: Unified Entry) =============

/**
 * Cosmo Orchestrator - Main entry point for ALL request types
 */
export async function orchestrate(request: CosmoRequest): Promise<CosmoResponse> {
  const startTime = Date.now();
  
  // Normalize the request
  const normalizedRequest = normalizeRequest(request);
  const logger = createScopedLogger(normalizedRequest.traceId);
  logger.logPhaseStart('ORCHESTRATION', { requestType: normalizedRequest.requestType });

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Load settings
  const settings = await loadSettings(supabase);

  // Initialize debug data (uses canonical DebugData from contracts.ts)
  const debugData: DebugData = {
    original_message: request.content,
    detected_intent: null,
    intent_patterns: [],
    requested_model: request.requestedModel || null,
    auto_select_enabled: request.requestedModel === 'auto',
    context_sources: {
      formatting_rules: false,
      ai_instructions: false,
      space_ai_instructions: false,
      compliance_rule: false,
      persona: false,
      personal_context: false,
      knowledge_base: false,
      history: false,
      history_count: 0,
    },
    system_prompt_preview: '',
    full_system_prompt: '',
    persona_prompt: null,
    ai_instructions: null,
    selected_model: null,
    model_provider: null,
    model_config: {},
    tiers_attempted: [],
    fallback_used: false,
    response_time_ms: 0,
    prompt_tokens: null,
    completion_tokens: null,
    total_tokens: null,
    cost: null,
    success: true,
    error_message: null,
    api_request_body: null,
    api_response_headers: null,
    openrouter_request_id: null,
    functions_invoked: [],
    request_type: normalizedRequest.requestType,
  };

  try {
    // Route based on request type
    switch (normalizedRequest.requestType) {
      case 'webhook': {
        const result = await handleWebhookFlow(normalizedRequest, supabase, settings);
        // Convert to CosmoResponse format
        const responseBody = JSON.stringify(result);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(responseBody));
            controller.close();
          }
        });
        return {
          stream,
          metadata: {
            actualModelUsed: 'system',
            cosmoSelected: false,
            detectedCategory: 'webhook',
            costTier: null,
            functionsInvoked: result.actionsExecuted || [],
            processingTimeMs: Date.now() - startTime,
            requestType: 'webhook',
          },
        };
      }
      
      case 'system_task': {
        const result = await handleSystemTaskFlow(normalizedRequest, supabase, settings);
        const responseBody = JSON.stringify(result);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(responseBody));
            controller.close();
          }
        });
        return {
          stream,
          metadata: {
            actualModelUsed: 'system',
            cosmoSelected: false,
            detectedCategory: 'system_task',
            costTier: null,
            functionsInvoked: [],
            processingTimeMs: Date.now() - startTime,
            requestType: 'system_task',
          },
        };
      }
      
      case 'agent_action': {
        const result = await handleAgentActionFlow(normalizedRequest, supabase, settings);
        const responseBody = JSON.stringify(result);
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(responseBody));
            controller.close();
          }
        });
        return {
          stream,
          metadata: {
            actualModelUsed: 'agent',
            cosmoSelected: false,
            detectedCategory: 'agent_action',
            costTier: null,
            functionsInvoked: result.actionsTaken.map(a => a.actionKey),
            processingTimeMs: Date.now() - startTime,
            requestType: 'agent_action',
          },
        };
      }
      
      case 'api_call':
      case 'chat':
      default:
        // Use existing chat flow
        const response = await handleChatFlow(normalizedRequest, supabase, settings, debugData);
        logger.logPhaseComplete('ORCHESTRATION', Date.now() - startTime);
        return response;
    }

  } catch (error) {
    debugData.success = false;
    debugData.error_message = error instanceof Error ? error.message : 'Unknown error';
    debugData.response_time_ms = Date.now() - startTime;

    logger.logException(error, { requestType: normalizedRequest.requestType });
    throw error;
  }
}

/**
 * Handle HTTP request wrapper for edge function
 */
export async function handleChatRequest(req: Request): Promise<Response> {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Extract user ID from auth header
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Build Cosmo request
    const cosmoRequest: CosmoRequest = {
      content: body.messages[body.messages.length - 1]?.content || '',
      messages: body.messages,
      chatId: body.chatId,
      workspaceId: body.workspaceId,
      personaId: body.personaId,
      requestedModel: body.model,
      spaceContext: body.spaceContext,
      userId,
      authToken: authHeader?.replace('Bearer ', ''),
      // Phase 3: Support explicit request type from body
      requestType: body.requestType,
      source: body.source,
      responseMode: body.responseMode,
    };

    // Orchestrate
    const result = await orchestrate(cosmoRequest);

    return new Response(result.stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'RATE_LIMITED') {
      return new Response(
        JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message === 'PAYMENT_REQUIRED') {
      return new Response(
        JSON.stringify({ error: 'Payment required, please add funds to your account.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logError('[COSMO] Chat request error', { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
