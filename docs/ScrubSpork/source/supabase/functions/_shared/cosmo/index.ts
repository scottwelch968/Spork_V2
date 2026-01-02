/**
 * COSMO - The God Layer
 * 
 * Central AI orchestration system that controls all AI interactions.
 * COSMO is the brain that:
 * - Analyzes user intent
 * - Decides what functions to execute
 * - Routes to appropriate AI models
 * - Processes and enhances responses
 * 
 * All other modules are TOOLS that COSMO uses:
 * - intentAnalyzer: COSMO's understanding module
 * - functionSelector: COSMO's planning module
 * - functionExecutor: COSMO's action executor (the tool COSMO uses to run functions)
 * - modelRouter: COSMO's model selection module
 * - promptEnhancer: COSMO's context builder
 * - responseProcessor: COSMO's output formatter
 * - providerConfig: COSMO's provider management
 */

// Provider configuration utilities
export {
  getProviderEndpoint,
  getProviderApiKey,
  getProviderHeaders,
  isOpenRouterProvider,
  isLovableProvider,
} from './providerConfig.ts';

// Main orchestrator entry point
export { 
  orchestrate, 
  handleChatRequest, 
  handleEnhancePromptRequest,
  handleImageGenerationRequest,
  handleKnowledgeQueryRequest,
  corsHeaders 
} from './orchestrator.ts';

// COSMO's understanding module - Intent Analysis
export { 
  analyzeIntent,
  analyzeIntentEnhanced,
  requiresFunction, 
  needsContext,
  getAvailableCategories,
  refreshIntentCache,
} from './intentAnalyzer.ts';

// COSMO's action resolution module - Intent to Action mapping
export {
  resolveActions,
  getAllActionMappings,
} from './actionResolver.ts';

// COSMO's planning module - Function Selection
export { 
  selectFunctions, 
  getAvailableFunctions, 
  getFunctionConfig, 
  isFunctionAvailable 
} from './functionSelector.ts';

// COSMO's action executor - Function Execution (replaces EventHandler pattern)
export { 
  executeFunction, 
  executeFunctions,
  isFunctionAvailable as canExecuteFunction,
  getAvailableFunctions as getExecutableFunctions,
  type FunctionExecutionRequest,
  type FunctionExecutionResult,
  type BatchExecutionRequest,
  type BatchExecutionResult,
} from './functionExecutor.ts';

// COSMO's model selection module - Model Routing
export { 
  routeToModel, 
  getCostTier, 
  getCostTierLabel, 
  selectModelByWeight,
  getAvailableModels,
  getFallbackModel,
  getSimilarModel,
} from './modelRouter.ts';

// COSMO's context builder - Prompt Enhancement
export { 
  enhancePrompt, 
  buildContext, 
  previewContextSources 
} from './promptEnhancer.ts';

// COSMO's output formatter - Response Processing
export { 
  processResponse, 
  createMetadataEvent, 
  createActionsEvent,
  estimateTokens,
  calculateCost,
  saveDebugLog,
} from './responseProcessor.ts';

// COSMO's webhook security module - Signature Verification
export {
  verifyWebhookSignature,
  verifyStripeSignature,
  verifyGitHubSignature,
  verifyGenericSignature,
  detectWebhookProvider,
  getProviderSecret,
} from './webhookVerifier.ts';

// COSMO's error handling module - Centralized Error Factory (Phase 3)
export { 
  createCosmoError,
  errorFromException,
  isCosmoError,
  errorToHttpStatus,
  isRetryable,
  getUserMessage,
  toExecutionError,
  type CosmoErrorCode,
  type CosmoError,
} from './errors.ts';

// COSMO's structured logging module (Phase 3)
export {
  log,
  debug,
  info,
  warn,
  error,
  logPhaseStart,
  logPhaseComplete,
  logRequest,
  logError,
  logException,
  generateTraceId,
  createScopedLogger,
  type LogLevel,
  type LogEntry,
} from './logger.ts';

// COSMO's queue manager - Request Queuing with Priority
export {
  enqueueRequest,
  dequeueNext,
  updateQueueStatus,
  retryRequest,
  cancelRequest,
  getQueueStats,
  cleanupExpired,
  cleanupOld,
  isHighLoad,
  shouldQueue,
  calculatePriorityScore,
  type QueuedRequest,
  type QueueStats,
  type EnqueueOptions,
} from './queueManager.ts';

// COSMO's batch manager - Request Batching for Similar Queries
export {
  computeSimilarityHash,
  isBatchable,
  findOrCreateBatch,
  addToBatch,
  getReadyBatches,
  buildCombinedPrompt,
  extractResponses,
  processBatch,
  cleanupStaleBatches,
  getBatchStats,
  DEFAULT_BATCH_CONFIG,
} from './batchManager.ts';

// ============= Canonical Contract Types (SINGLE SOURCE OF TRUTH) =============
export type {
  // Canonical Contracts
  NormalizedRequest,
  CosmoContext,
  ExecutionResult,
  ExecutionError,
  CostTier,
  BuildResultOptions,
  NormalizeRequestFn,
  InitContextFn,
  
  // Supporting contract types
  TierAttempt,
  SystemSettings,
  CosmoRoutingConfig,
  PreMessageConfig,
  ResponseFormattingRules,
  IntentAnalysis as CanonicalIntentAnalysis,
  FunctionSelection as CanonicalFunctionSelection,
  ModelSelection as CanonicalModelSelection,
  EnhancedPrompt as CanonicalEnhancedPrompt,
  DebugData,
  ContextSources,
  ContextNeed,
} from './contracts.ts';

// ============= Domain Types (from types.ts) =============
export type {
  // Core request/response types
  CosmoRequest,
  CosmoResponse,
  CosmoMetadata,
  CosmoMessage,
  CosmoRequestType,
  CosmoRequestSource,
  CosmoResponseMode,
  CosmoPriority,
  
  // Context types
  SpaceContext,
  PromptContext,
  
  // Intent analysis types (domain-specific)
  IntentAnalysis,
  EnhancedIntentAnalysis,
  
  // Action types
  CosmoAction,
  CosmoActionType,
  ActionMapping,
  ActionExecutionResult,
  ActionPlan,
  ParameterPattern,
  ExtractedEntity,
  
  // Function types
  FunctionCandidate,
  FunctionSelection,
  
  // Model types
  ModelCandidate,
  // CosmoRoutingConfig exported above with contracts
  ModelSelection,
  
  // Response types
  ProcessedResponse,
  SuggestedAction,
  
  // Debug types - CosmoDebugData is now alias to DebugData from contracts.ts
  // Use DebugData from contracts.ts directly (exported above)
  
  // Config types (domain-specific wrappers)
  AiInstructionsConfig,
  FallbackConfig,
  CosmoConfig,
  
  // Webhook types
  WebhookProvider,
  WebhookVerificationResult,
  WebhookPayload,
  WebhookResponse,
  
  // Specialized request/response types
  EnhancePromptRequest,
  EnhancePromptResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  KnowledgeQueryRequest,
  KnowledgeQueryResponse,
  
  // System task types
  SystemTaskConfig,
  SystemTaskResult,
  
  // Agent types
  AgentConfig,
  AgentActionRequest,
  AgentActionResponse,
  
  // Queue types
  QueueStatus,
  QueueProcessorResult,
  
  // Batch types
  BatchStatus,
  BatchedRequest,
  BatchTicket,
  BatchConfig,
  BatchResult,
  BatchStats,
  RequestBatch,
  
  // App Store Protocol types
  AppItemType,
  AppItemCapabilities,
  CosmoAppRequest,
  CosmoAppOperation,
  CosmoDenyReason,
  CosmoAppResponse,
  RetryPolicy,
  FailureHandling,
  
  // External Integration types
  ExternalProvider,
  IntegrationCredentials,
  ExternalOperationRequest,
  ExternalOperationResult,
  OAuthTokens,
} from './types.ts';
