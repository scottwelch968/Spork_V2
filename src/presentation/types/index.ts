/**
 * Presentation Layer - Type Exports
 * 
 * These types are for UI rendering only. They do not perform system actions.
 * Per Amendment 001: Presentation types live in src/presentation/types/
 */

// Chat display types
export type { ChatContext, UIMessage, ChatConfig, MessageHeaderMessage } from './chat';

// Debug console display types
export type {
  DebugContextSources,
  DebugModelConfig,
  DebugTierAttempt,
  DebugApiRequestBody,
  DebugEntry,
  DebugFilters,
  DebugState,
} from './debug';

// Queue display types
export type { QueueStatus, QueuedRequest, QueueStats, TimeSeriesPoint } from './queue';

// Space chat display types
export type { SpaceChat, SpaceChatMessage } from './spaceChat';

// Response display types
export type {
  ModelSelectionUI,
  ResponseChunk,
  ResponseComplete,
  ActionType,
  AvailableAction,
  ActionsResult,
  PersistenceResult,
  FunctionError,
} from './response';

// Editor display types
export type { SporkEditorMessage } from './editor';
