/**
 * Cosmo God Layer - Domain Type Definitions
 * 
 * CONSTITUTIONAL COMPLIANCE:
 * - Canonical contracts (NormalizedRequest, CosmoContext, ExecutionResult) are in contracts.ts
 * - This file contains DOMAIN-SPECIFIC types that extend or supplement contracts
 * - Core request types are RE-EXPORTED from contracts.ts to avoid duplication
 * 
 * 6 HARD RULES:
 * 1. Canonical types ONLY in contracts.ts - do NOT duplicate here
 * 2. Domain-specific types (webhooks, agents, batching, etc.) live here
 * 3. Re-export canonical types from contracts.ts for convenience
 * 4. Never define CosmoRequestType, CosmoMessage, CosmoRequest here - use contracts.ts
 */

// ============= RE-EXPORT Canonical Types from contracts.ts =============
// Per COSMO Constitution Article II: Canonical Contracts are the ONLY source of truth

export type {
  CosmoRequestType,
  CosmoRequestSource,
  CosmoResponseMode,
  CosmoPriority,
  CosmoMessage,
  SpaceContext,
  CosmoRequest,
  CostTier,
} from './contracts.ts';

// Import for internal use in this file's type definitions (minimal - others imported below)
import type { CosmoRequest, CosmoRequestType, CosmoPriority } from './contracts.ts';

export interface CosmoResponse {
  stream: ReadableStream;
  metadata: CosmoMetadata;
}

export interface CosmoMetadata {
  actualModelUsed: string;
  cosmoSelected: boolean;
  detectedCategory: string | null;
  costTier: 'low' | 'balanced' | 'premium' | null;
  functionsInvoked: string[];
  processingTimeMs: number;
  requestType?: CosmoRequestType;
  actionsExecuted?: string[];
}

// ============= Action Types (Phase 2) =============

export type CosmoActionType = 
  | 'function'      // Execute a chat function
  | 'chain'         // Execute a function chain
  | 'model_call'    // Call an AI model
  | 'external_api'  // Call external API
  | 'system';       // System operation

export interface CosmoAction {
  actionKey: string;
  actionType: CosmoActionType;
  config: Record<string, unknown>;
  extractedParams: Record<string, unknown>;
  priority: number;
  requiredContext: string[];
  conditions: Record<string, unknown>;
}

export interface ActionMapping {
  id: string;
  intentKey: string;
  actionKey: string;
  actionType: CosmoActionType;
  actionConfig: Record<string, unknown>;
  parameterPatterns: Record<string, unknown>;
  requiredContext: string[];
  priority: number;
  conditions: Record<string, unknown>;
  isActive: boolean;
}

export interface ActionExecutionResult {
  actionKey: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface ActionPlan {
  actions: CosmoAction[];
  executionOrder: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  shouldStream: boolean;
  totalEstimatedTimeMs: number;
}

// ============= RE-EXPORT Canonical Analysis & Selection Types from contracts.ts =============
// Per COSMO Constitution Article II: These are DUPLICATES that must come from contracts.ts

export type {
  IntentAnalysis,
  ContextNeed,
  FunctionSelection,
  ModelSelection,
  EnhancedPrompt,
  ContextSources,
  // Configuration types - canonical source
  TierAttempt,
  SystemSettings,
  CosmoConfig,
  CosmoRoutingConfig,
  PreMessageConfig,
  AiInstructionsConfig,
  FallbackConfig,
  ResponseFormattingRules,
} from './contracts.ts';

// Import for use in domain-specific types below
import type { 
  IntentAnalysis, 
  CosmoMessage,
  ContextSources,
  TierAttempt,
} from './contracts.ts';

// ============= Enhanced Intent Analysis (Phase 2) - EXTENDS canonical type =============

export interface EnhancedIntentAnalysis extends IntentAnalysis {
  intentKey: string;
  actions: CosmoAction[];
  actionPlan: ActionPlan;
  parameterExtractions: Record<string, string>;
  entityExtractions: ExtractedEntity[];
}

export interface ParameterPattern {
  name: string;
  pattern: string;
  type: 'regex' | 'entity' | 'keyword';
  required: boolean;
  defaultValue?: unknown;
}

// ============= Function Selection - Domain types (non-canonical) =============

export interface FunctionCandidate {
  function_key: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  is_enabled: boolean;
}

// ============= Model Routing - Domain types (non-canonical) =============

export interface ModelCandidate {
  model_id: string;
  name: string;
  provider: string;
  best_for: string;
  pricing_prompt: number | null;
  pricing_completion: number | null;
  is_free: boolean | null;
  context_length: number | null;
}

// ModelRoutingConfig REMOVED - use CosmoRoutingConfig from contracts.ts instead
// (COSMO Constitution Article II compliance - no duplicate types)

// ============= Prompt Enhancement - Domain types (non-canonical) =============

export interface PromptContext {
  formattingRules?: string;
  aiInstructions?: string;
  spaceAiInstructions?: string;
  complianceRule?: string;
  personaPrompt?: string;
  personalContext?: string;
  knowledgeBaseContext?: string;
  historyMessages?: CosmoMessage[];
}

// ============= Response Processing =============

export interface ProcessedResponse {
  content: string;
  suggestedActions: SuggestedAction[];
  extractedEntities: ExtractedEntity[];
  followUpRecommendations: string[];
}

export interface SuggestedAction {
  type: 'save' | 'share' | 'export' | 'regenerate' | 'elaborate';
  label: string;
  enabled: boolean;
}

export interface ExtractedEntity {
  type: 'location' | 'date' | 'person' | 'organization' | 'code' | 'url' | 'email' | 'number';
  value: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
}

// ============= Debug & Logging =============
// CosmoDebugData REMOVED - use canonical DebugData from contracts.ts instead
// Per COSMO Constitution Article II: No duplicate contract types

// Re-export DebugData as CosmoDebugData for backward compatibility
export type { DebugData as CosmoDebugData } from './contracts.ts';

// ============= Settings =============
// TierAttempt, SystemSettings, CosmoConfig, PreMessageConfig, AiInstructionsConfig, 
// FallbackConfig, CosmoRoutingConfig, ResponseFormattingRules are now RE-EXPORTED 
// from contracts.ts above (COSMO Constitution Article II compliance)

// ============= Webhook Types =============

export type WebhookProvider = 'stripe' | 'github' | 'custom' | 'unknown';

export interface WebhookVerificationResult {
  verified: boolean;
  provider: WebhookProvider;
  error?: string;
  timestamp?: number;
}

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  actionsExecuted?: string[];
  verificationResult?: WebhookVerificationResult;
}

// ============= System Task Types =============

export interface SystemTaskConfig {
  taskName: string;
  schedule?: string;
  config: Record<string, unknown>;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface SystemTaskResult {
  taskName: string;
  success: boolean;
  startedAt: string;
  completedAt: string;
  result?: unknown;
  error?: string;
}

// ============= Agent Types =============

export interface AgentConfig {
  agentId: string;
  name: string;
  goal: string;
  capabilities: string[];
  constraints: string[];
  maxIterations?: number;
}

export interface AgentActionRequest {
  agentId: string;
  goal: string;
  context: Record<string, unknown>;
  previousActions?: ActionExecutionResult[];
}

export interface AgentActionResponse {
  actionsTaken: ActionExecutionResult[];
  goalAchieved: boolean;
  nextSteps?: string[];
  reasoning: string;
}

// ============= Specialized Request Types (Phase 4) =============

export interface EnhancePromptRequest {
  prompt: string;
  personaId?: string;
  chatId?: string;
  userId?: string;
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  model: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  userId?: string;
  workspaceId?: string;
  selectedModel?: string;
  isWorkspaceChat?: boolean;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  model: string;
  cosmoSelected: boolean;
  storagePath?: string;
}

export interface KnowledgeQueryRequest {
  question: string;
  userId: string;
  workspaceId: string;
  documentIds?: string[];
}

export interface KnowledgeQueryResponse {
  answer: string;
  sources: Array<{ id: string; title: string; fileName: string }>;
  model: string;
}

// ============= Queue Types =============

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface QueuedRequest {
  id: string;
  priority: CosmoPriority;
  priorityScore: number;
  requestType: CosmoRequestType;
  requestPayload: CosmoRequest;
  userId?: string;
  workspaceId?: string;
  status: QueueStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  resultPayload?: unknown;
  errorMessage?: string;
  callbackUrl?: string;
  expiresAt: string;
  retryCount: number;
  maxRetries: number;
  processingNode?: string;
  estimatedWaitMs?: number;
}

export interface QueueStats {
  pending: { low: number; normal: number; high: number; critical: number; total: number };
  processing: number;
  completed24h: number;
  failed24h: number;
  avgWaitTimeMs: number;
  avgProcessingTimeMs: number;
  throughputPerMinute: number;
  oldestPendingAge: number;
}

export interface EnqueueOptions {
  priority?: CosmoPriority;
  callbackUrl?: string;
  expiresInMs?: number;
  maxRetries?: number;
}

export interface QueueProcessorResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  expiredCleaned: number;
  batchesProcessed?: number;
}

// ============= Batch Types =============

export type BatchStatus = 'collecting' | 'processing' | 'completed' | 'failed';

export interface BatchedRequest {
  id: string;
  requestPayload: CosmoRequest;
  addedAt: string;
}

export interface BatchTicket {
  batchId: string;
  requestId: string;
  position: number;
  estimatedProcessingAt: string;
}

export interface BatchConfig {
  windowMs: number;
  maxSize: number;
  minSize: number;
  batchableTypes: CosmoRequestType[];
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  requestResults: Map<string, string>;
  tokensSaved: number;
  apiCallsSaved: number;
  processingTimeMs: number;
  error?: string;
}

export interface BatchStats {
  activeBatches: number;
  avgBatchSize: number;
  apiCallsSaved24h: number;
  tokensSaved24h: number;
  successRate: number;
  totalBatched24h: number;
}

export interface RequestBatch {
  id: string;
  similarityHash: string;
  status: BatchStatus;
  requestType: string;
  requestIds: string[];
  combinedPrompt: string | null;
  combinedResponse: string | null;
  responseMap: Record<string, string>;
  modelUsed: string | null;
  tokensSaved: number;
  apiCallsSaved: number;
  createdAt: string;
  processedAt: string | null;
  windowExpiresAt: string;
  errorMessage: string | null;
}

// ============= COSMO Canonical Contracts (Re-exported from contracts.ts) =============
// NOTE: Core types (CosmoRequest, CosmoMessage, etc.) are re-exported at top of file
// Additional canonical types re-exported here for backward compatibility

export type {
  NormalizedRequest,
  CosmoContext,
  ExecutionResult,
  ExecutionError,
  // TierAttempt, SystemSettings, CosmoRoutingConfig, PreMessageConfig, 
  // ResponseFormattingRules, IntentAnalysis, FunctionSelection, ModelSelection,
  // EnhancedPrompt already exported at top of file - removed here to prevent duplicate
  DebugData,
  BuildResultOptions,
  NormalizeRequestFn,
  InitContextFn,
} from './contracts.ts';

// ============= App Store ↔ COSMO Protocol =============

/**
 * AppItemType - Classification of App Store items
 * Based on AI-DEVELOPMENT.md definitions
 */
export type AppItemType = 'tool' | 'assistant' | 'agent';

/**
 * AppItemCapabilities - What each type can request from COSMO
 */
export interface AppItemCapabilities {
  tool: {
    canRequest: ('ai.complete' | 'ai.generateImage' | 'storage.read' | 'storage.write')[];
    cannotRequest: ('chat.fullSession' | 'agent.execute' | 'cosmo.orchestrate')[];
    maxConcurrentCalls: 1;
    hasLoop: false;
    autonomy: 'none';
  };
  assistant: {
    canRequest: ('ai.complete' | 'ai.generateImage' | 'chat.send' | 'tool.invoke' | 'storage.*')[];
    cannotRequest: ('agent.execute' | 'agent.plan')[];
    maxConcurrentCalls: 3;
    hasLoop: false;
    autonomy: 'reactive';
  };
  agent: {
    canRequest: ('ai.complete' | 'ai.generateImage' | 'chat.send' | 'tool.invoke' | 'storage.*' | 'files.*' | 'agent.plan' | 'agent.execute')[];
    cannotRequest: ('cosmo.configChange' | 'admin.*')[];
    maxConcurrentCalls: 10;
    hasLoop: true;
    autonomy: 'autonomous';
  };
}

/**
 * CosmoAppRequest - Request from App Store item to COSMO
 */
export interface CosmoAppRequest {
  appItemId: string;           // Installed tool/assistant/agent ID
  appItemType: AppItemType;    // 'tool' | 'assistant' | 'agent'
  appItemName: string;
  workspaceId: string;
  userId: string;
  
  operation: CosmoAppOperation;
  payload: Record<string, unknown>;
  
  // Execution context
  context: {
    installedVersion: string;
    permissions: string[];      // Granted permissions from installation
    configValues?: Record<string, unknown>;
  };
  
  // Retry configuration (agent-only can set custom)
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
    retryableErrors: string[];
  };
}

/**
 * CosmoAppOperation - Operations App Store items can request
 */
export type CosmoAppOperation = 
  // AI Operations (all types)
  | 'ai.complete'
  | 'ai.generateImage'
  | 'ai.embedDocument'
  
  // Chat Operations (assistant, agent)
  | 'chat.send'
  | 'chat.getHistory'
  
  // Tool Operations (assistant, agent can invoke other tools)
  | 'tool.invoke'
  | 'tool.list'
  
  // Storage Operations (all types)
  | 'storage.read'
  | 'storage.write'
  | 'storage.delete'
  
  // File Operations (requires 'files' permission)
  | 'files.read'
  | 'files.write'
  | 'files.list'
  
  // Agent-only Operations
  | 'agent.plan'
  | 'agent.execute'
  | 'agent.reflect'
  | 'agent.checkpoint'
  
  // External Integration Operations
  | 'external.checkConnection'
  | 'external.listConnections'
  | 'external.requestConnection'
  | 'external.call'
  | 'external.refreshToken'
  | 'external.disconnect';

/**
 * CosmoDenyReason - Why COSMO denied a request
 */
export type CosmoDenyReason = 
  | 'permission_denied'         // App doesn't have required permission
  | 'operation_not_allowed'     // Operation not allowed for this app type
  | 'rate_limited'              // Too many requests
  | 'quota_exceeded'            // Workspace quota exceeded
  | 'invalid_payload'           // Request payload validation failed
  | 'dependency_unavailable'    // Required service/model unavailable
  | 'approval_required'         // Human approval needed (agents)
  | 'loop_limit_exceeded'       // Agent exceeded max iterations
  | 'context_insufficient'      // Missing required context
  | 'model_unavailable'         // Requested model not available
  // External integration reasons
  | 'integration_not_connected' // Provider not connected for user/workspace
  | 'integration_expired'       // OAuth token expired, needs refresh
  | 'integration_scope_insufficient' // Connected but missing required scope
  | 'provider_not_supported'    // Provider not enabled in system
  | 'external_rate_limited';    // Provider rate limit exceeded

/**
 * CosmoAppResponse - COSMO's response to App Store item
 */
export interface CosmoAppResponse {
  success: boolean;
  requestId: string;
  
  // On success
  data?: unknown;
  
  // On failure
  denied?: {
    reason: CosmoDenyReason;
    message: string;
    httpStatus: number;
    retryable: boolean;
    retryAfterMs?: number;
    requiredPermissions?: string[];
    suggestedAction?: string;
  };
  
  // Metadata
  metadata: {
    processingTimeMs: number;
    modelUsed?: string;
    tokensUsed?: number;
    quotaRemaining?: number;
  };
}

/**
 * RetryPolicy - Defines retry behavior per app type
 */
export interface RetryPolicy {
  maxRetries: number;
  retryableErrors: CosmoDenyReason[];
  backoffMs: number;
  exponentialBackoff?: boolean;
}

/**
 * FailureHandling - How failures propagate
 */
export interface FailureHandling {
  onFailure: 'throw' | 'graceful' | 'reflect';
  logLevel: 'error' | 'warn' | 'info';
  fallbackResponse?: string;
  canAdjustPlan?: boolean;
  maxFailuresBeforeAbort?: number;
}

// ============= External Integration Types =============

/**
 * ExternalProvider - Supported external service configuration
 */
export interface ExternalProvider {
  providerKey: string;
  name: string;
  description?: string;
  category: 'communication' | 'storage' | 'crm' | 'productivity' | 'development';
  authType: 'oauth2' | 'api_key' | 'webhook';
  oauthAuthorizeUrl?: string;
  oauthTokenUrl?: string;
  oauthScopes?: string[];
  iconUrl?: string;
  documentationUrl?: string;
  isEnabled: boolean;
}

/**
 * IntegrationCredentials - Decrypted credentials for external calls
 * NEVER logged or stored in plain text
 */
export interface IntegrationCredentials {
  providerKey: string;
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  webhookSecret?: string;
  expiresAt?: Date;
  scopes: string[];
  externalAccountId?: string;
  externalAccountName?: string;
}

/**
 * ExternalOperationRequest - Request to call an external service
 */
export interface ExternalOperationRequest {
  appItemId?: string;
  appItemType?: AppItemType;
  userId: string;
  workspaceId?: string;
  providerKey: string;
  operation: string;  // e.g., 'slack.postMessage', 'gdrive.uploadFile'
  payload: Record<string, unknown>;
  
  // Credential resolution
  preferWorkspaceIntegration?: boolean;
  requiredScopes?: string[];
}

/**
 * ExternalOperationResult - Result from external service call
 */
export interface ExternalOperationResult {
  success: boolean;
  data?: unknown;
  
  // On failure
  error?: {
    code: 'credential_missing' | 'credential_expired' | 'scope_insufficient' | 
          'provider_error' | 'rate_limited' | 'permission_denied';
    message: string;
    requiresReauth: boolean;
    reauthUrl?: string;
  };
  
  // Metadata
  providerKey: string;
  operationTimeMs?: number;
  quotaUsed?: number;
  rateLimit?: {
    remaining: number;
    resetAt: Date;
  };
}

/**
 * OAuthTokens - Token response from OAuth provider
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
  externalUserId?: string;
  externalUserName?: string;
  externalUserEmail?: string;
  externalWorkspaceId?: string;
  externalWorkspaceName?: string;
}
