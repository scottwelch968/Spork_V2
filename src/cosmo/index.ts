/**
 * COSMO Canonical Exports
 * 
 * BARRIER EXPORT - Only canonical contracts are exported from here.
 * If it's not exported here, it's not public COSMO.
 * 
 * 6 HARD RULES:
 * 1. One contract standard only (contracts.ts)
 * 2. UI types live in src/types/ui/
 * 3. chatFunctions.ts types are UI-ONLY shapes, not COSMO contracts
 * 4. Inbound normalization required
 * 5. Outbound translation required
 * 6. No new type files outside contracts.ts
 */

// ============= Canonical Contracts =============
export type {
  // Core contracts
  NormalizedRequest,
  CosmoContext,
  ExecutionResult,
  
  // Request types
  CosmoRequest,
  CosmoRequestType,
  CosmoRequestSource,
  CosmoResponseMode,
  CosmoPriority,
  CostTier,
  
  // Message types
  CosmoMessage,
  SpaceContext,
  
  // Supporting types
  ExecutionError,
  TierAttempt,
  SystemSettings,
  CosmoRoutingConfig,
  PreMessageConfig,
  ResponseFormattingRules,
  IntentAnalysis,
  FunctionSelection,
  ModelSelection,
  EnhancedPrompt,
  DebugData,
  
  // Function types
  NormalizeRequestFn,
  InitContextFn,
} from './contracts';

// ============= Normalizer =============
export { normalizeRequest, isNormalizedRequest } from './normalizer';

// ============= Adapters =============
export { fromChatUi } from './adapters/fromChatUi';
export { fromWebhook } from './adapters/fromWebhook';
export { fromQueue } from './adapters/fromQueue';
export { fromApi } from './adapters/fromApi';

// ============= UI Bridge =============
export { uiToNormalized, uiModelSelectionToCanonical, executionResultToUI, modelSelectionToUI } from './bridge';

// ============= System Types =============
// Re-export system types for backward compatibility
export type {
  ActorType,
  Actor,
  DisplayMode,
  RequestContext,
  Attachment,
  DataRequest,
  ModelSelectionUI,
  ResponseChunk,
  ResponseComplete,
  ActionType,
  AvailableAction,
  ActionsResult,
  PersistenceResult,
  FunctionError,
  ChatFunctionEvent,
  SubmitRequestOptions,
  ProcessResponseOptions,
  ChatFunctionEventPayloads,
} from './types/system';

// ============= Presentation Types =============
// Re-export presentation types for backward compatibility
export type {
  ChatContext,
  UIMessage,
  ChatConfig,
  MessageHeaderMessage,
  QueuedRequest,
  QueueStats,
  TimeSeriesPoint,
  SporkEditorMessage,
  SpaceChat,
  SpaceChatMessage,
  DebugContextSources,
  DebugModelConfig,
  DebugTierAttempt,
  DebugApiRequestBody,
  DebugEntry,
  DebugFilters,
  DebugState,
} from '@/presentation/types';

// ============= Action Types =============
export type { CodeChange } from './actions';
