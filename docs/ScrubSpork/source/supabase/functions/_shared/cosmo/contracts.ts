/**
 * ⚠️ SYNC REQUIREMENT ⚠️
 * 
 * This file MUST remain synchronized with:
 * - Frontend: src/cosmo/contracts.ts (MUST MATCH)
 * - Backend: supabase/functions/_shared/cosmo/contracts.ts (THIS FILE - AUTHORITATIVE)
 * 
 * This file is AUTHORITATIVE - frontend types should match these definitions.
 * When updating types, update this file first, then sync frontend.
 * 
 * Last Sync Verified: 2025-12-15
 * 
 * COSMO Canonical Contracts for Edge Functions
 * 
 * SINGLE SOURCE OF TRUTH - Frontend src/cosmo/contracts.ts mirrors this file
 * 
 * 6 HARD RULES:
 * 1. One contract standard only: This file + src/cosmo/contracts.ts are the ONLY valid sources
 * 2. Skeleton shapes become "Legacy*" and live in cosmo/legacy/
 * 3. chatFunctions.ts types are UI-ONLY shapes, not COSMO contracts
 * 4. Inbound normalization required: All requests must go through adapters
 * 5. Outbound translation required: ExecutionResult → UI-specific shapes at boundary
 * 6. No new type files: All future COSMO contract types go here
 */

// ============= Request Types =============

export type CosmoRequestType = 
  | 'chat'              // User chat messages
  | 'webhook'           // External webhook triggers  
  | 'system_task'       // Scheduled/background tasks
  | 'agent_action'      // AI agent autonomous actions
  | 'api_call'          // Direct API integrations
  | 'enhance_prompt'    // Prompt enhancement requests
  | 'image_generation'  // Image generation requests
  | 'knowledge_query';  // Knowledge base queries

export interface CosmoRequestSource {
  type: 'user' | 'webhook' | 'system' | 'agent' | 'api';
  id?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export type CosmoResponseMode = 'stream' | 'batch' | 'silent';

export type CosmoPriority = 'low' | 'normal' | 'high' | 'critical';

export type CostTier = 'low' | 'balanced' | 'premium';

// ============= Message Types =============

export interface CosmoMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SpaceContext {
  aiInstructions?: string;
  complianceRule?: string;
}

// ============= Base Request =============

export interface CosmoRequest {
  content: string;
  messages: CosmoMessage[];
  chatId?: string;
  workspaceId?: string;
  personaId?: string;
  requestedModel?: string;
  spaceContext?: SpaceContext;
  userId?: string;
  authToken?: string;
  
  // Unified request fields
  requestType?: CosmoRequestType;
  source?: CosmoRequestSource;
  responseMode?: CosmoResponseMode;
  callbackUrl?: string;
  priority?: CosmoPriority;
  
  // Webhook-specific
  webhookPayload?: Record<string, unknown>;
  webhookSecret?: string;
  
  // System task-specific
  taskName?: string;
  taskConfig?: Record<string, unknown>;
  
  // Agent-specific
  agentId?: string;
  agentGoal?: string;
  agentContext?: Record<string, unknown>;
}

// ============= CANONICAL CONTRACT: NormalizedRequest =============

/**
 * NormalizedRequest - THE canonical request shape after normalization
 * 
 * Extends CosmoRequest with GUARANTEED fields that normalization provides.
 * All COSMO handlers receive NormalizedRequest, not raw CosmoRequest.
 * 
 * This is the ONLY valid request shape inside COSMO core.
 */
export interface NormalizedRequest extends CosmoRequest {
  // All these fields are GUARANTEED after normalization (no longer optional)
  requestType: CosmoRequestType;
  source: CosmoRequestSource;
  responseMode: CosmoResponseMode;
  priority: CosmoPriority;
  
  // Normalization metadata
  normalizedAt: string;
  requestId: string;
  
  // Trace ID for end-to-end request correlation (Phase 3)
  traceId: string;
}

// ============= CANONICAL CONTRACT: CosmoContext =============

/**
 * CosmoContext - Pipeline execution context
 * 
 * Accumulates state during the orchestration pipeline.
 * Passed through all pipeline stages, allowing each to read previous results
 * and add their own. This is the "shared memory" of a single request.
 */
export interface CosmoContext {
  // Request Context (immutable after init)
  request: NormalizedRequest;
  supabase: unknown; // SupabaseClient - using unknown to avoid import issues
  settings: SystemSettings;
  
  // Analysis Results (accumulated during pipeline)
  intent?: IntentAnalysis;
  functionSelection?: FunctionSelection;
  modelSelection?: ModelSelection;
  enhancedPrompt?: EnhancedPrompt;
  
  // Execution Tracking
  startTime: number;
  functionsInvoked: string[];
  actionsExecuted: string[];
  tiersAttempted: TierAttempt[];
  
  // Debug Data Accumulator
  debug: Partial<DebugData>;
}

// ============= CANONICAL CONTRACT: ExecutionResult =============

/**
 * ExecutionResult - Unified result before response formatting
 * 
 * All request type handlers return ExecutionResult.
 * The orchestrator then formats this into the appropriate response
 * (streaming, batch JSON, silent acknowledgment) based on responseMode.
 */
export interface ExecutionResult {
  success: boolean;
  
  // Response Data (varies by request type)
  /** Streaming response for chat requests */
  stream?: ReadableStream;
  /** Content for batch/non-streaming responses */
  content?: string;
  /** Structured data for webhooks, tasks, etc. */
  data?: unknown;
  
  // Metadata (present on all results)
  actualModelUsed: string;
  cosmoSelected: boolean;
  detectedCategory: string | null;
  costTier: CostTier | null;
  processingTimeMs: number;
  
  // Execution Details
  functionsInvoked: string[];
  actionsExecuted: string[];
  tiersAttempted: TierAttempt[];
  
  // Token/Cost Tracking
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  
  // Error Handling
  error?: ExecutionError;
}

// ============= Supporting Types =============

export interface ExecutionError {
  code: string;
  message: string;
  httpStatus: number;
  retryable: boolean;
  details?: string;
  stack?: string;
}

export interface TierAttempt {
  tier: number;
  tier_name?: string;
  model: string;
  provider?: string;
  success: boolean;
  error?: string;
  status_code?: number;
  responseTimeMs?: number;
}

export interface SystemSettings {
  pre_message_config?: PreMessageConfig;
  ai_instructions?: AiInstructionsConfig;
  fallback_model?: FallbackConfig;
  cosmo_debug_enabled?: { enabled: boolean };
  cosmo_routing_config?: CosmoRoutingConfig;
  default_model?: { model_id: string } | string;
  response_formatting_rules?: ResponseFormattingRules;
  cosmo_config?: CosmoConfig;
}

export interface CosmoConfig {
  enabled?: boolean;
  model_id?: string;
  system_prompt?: string;
  use_pre_message_context?: boolean;
}

export interface CosmoRoutingConfig {
  enabled: boolean;
  model_id?: string;
  provider?: string;
  cost_performance_weight: number;
  system_prompt?: string;
  available_categories?: string[];
  fallback_category?: string;
}

// SYNC CHECK: PreMessageConfig must match src/cosmo/contracts.ts exactly
export interface PreMessageConfig {
  auto_select_enabled?: boolean;
  auto_select_model?: boolean;  // Alias for auto_select_enabled (UI compatibility)
  include_persona?: boolean;
  include_personal_context?: boolean;
  include_knowledge_base?: boolean;
  include_history?: boolean;
  include_files?: boolean;
  include_images?: boolean;
  max_history_messages?: number;
}

export interface AiInstructionsConfig {
  enabled?: boolean;
  instructions?: string;
}

export interface FallbackConfig {
  enabled?: boolean;
  model_id?: string;
}

export interface ResponseFormattingRules {
  enabled?: boolean;
  rules?: string;
  max_length?: number;
  format_guidelines?: string;
}

export interface IntentAnalysis {
  primaryIntent?: string;
  confidence: number;
  category: string;
  keywords?: string[];
  requiredFunctions: string[];
  suggestedEnhancements?: string[];
  contextNeeds?: ContextNeed[];
  parameters?: Record<string, unknown>;
}

export type ContextNeed = 
  | 'persona'
  | 'knowledge_base'
  | 'personal_context'
  | 'history'
  | 'location'
  | 'calendar'
  | 'email';

export interface FunctionSelection {
  selectedFunctions: string[];
  executionOrder?: string[];
  scores?: Record<string, number>;
  reason?: string;
  reasoning?: string;
}

export interface ModelSelection {
  selectedModel?: string;
  selectedModelId?: string;
  selectedModelName?: string;
  selectedCategory?: string;
  cosmoSelected?: boolean;
  detectedCategory?: string;
  costTier: CostTier | null;
  provider?: string;
  reason?: string;
  reasoning?: string;
  modelsConsidered?: number;
}

export interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt?: string;
  messages?: CosmoMessage[];
  context?: string[];
  contextSources?: ContextSources;
  persona?: string;
}

export interface ContextSources {
  formatting_rules: boolean;
  ai_instructions: boolean;
  space_ai_instructions: boolean;
  compliance_rule: boolean;
  persona: boolean;
  personal_context: boolean;
  knowledge_base: boolean;
  history: boolean;
  history_count: number;
}

export interface DebugData {
  requestId?: string;
  original_message?: string;
  detected_intent?: string | null;
  intent_patterns?: string[];
  requested_model?: string | null;
  auto_select_enabled?: boolean;
  context_sources?: ContextSources;
  system_prompt_preview?: string;
  full_system_prompt?: string;
  persona_prompt?: string | null;
  ai_instructions?: string | null;
  selected_model?: string | null;
  model_provider?: string | null;
  model_config?: Record<string, unknown>;
  tiers_attempted?: TierAttempt[];
  fallback_used?: boolean;
  response_time_ms?: number;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  cost?: number | null;
  success?: boolean;
  error_message?: string | null;
  api_request_body?: Record<string, unknown> | null;
  api_response_headers?: Record<string, string> | null;
  openrouter_request_id?: string | null;
  functions_invoked?: string[];
  request_type?: CosmoRequestType;
  actions_executed?: string[];
  intent?: IntentAnalysis;
  functionSelection?: FunctionSelection;
  modelSelection?: ModelSelection;
  processingTimeMs?: number;
  errors?: ExecutionError[];
}

// ============= Build Result Options =============

/**
 * BuildResultOptions - Options for building execution results
 */
export interface BuildResultOptions {
  success?: boolean;
  stream?: ReadableStream;
  content?: string;
  data?: unknown;
  actualModelUsed?: string;
  cosmoSelected?: boolean;
  detectedCategory?: string | null;
  costTier?: CostTier | null;
  tokens?: { prompt: number; completion: number; total: number };
  cost?: number;
  error?: ExecutionError;
}

// ============= Normalizer Function Types =============

/**
 * NormalizeRequestFn - Function signature for request normalization
 */
export type NormalizeRequestFn = (
  raw: Partial<CosmoRequest>,
  defaults?: Partial<NormalizedRequest>
) => NormalizedRequest;

/**
 * InitContextFn - Function signature for context initialization
 */
export type InitContextFn = (
  request: NormalizedRequest,
  supabase: unknown,
  settings: SystemSettings
) => CosmoContext;
