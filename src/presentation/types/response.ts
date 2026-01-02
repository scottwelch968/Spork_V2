/**
 * Presentation Layer - Response Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

/**
 * ModelSelectionUI - Model selection display for UI
 */
export interface ModelSelectionUI {
  modelId: string;
  autoSelect: boolean;
}

/**
 * ResponseChunk - Partial response for streaming display
 */
export interface ResponseChunk {
  content: string;
  isComplete: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * ResponseComplete - Final response for display
 */
export interface ResponseComplete {
  content: string;
  model: string;
  tokensUsed?: number;
  processingTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * ActionType - Available action types for response display
 */
export type ActionType = 'copy' | 'regenerate' | 'edit' | 'share' | 'save' | 'delete';

/**
 * AvailableAction - Action that can be performed on a response
 */
export interface AvailableAction {
  type: ActionType;
  label: string;
  enabled: boolean;
  icon?: string;
}

/**
 * ActionsResult - List of available actions for display
 */
export interface ActionsResult {
  actions: AvailableAction[];
}

/**
 * PersistenceResult - Result of persistence operation for UI feedback
 */
export interface PersistenceResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * FunctionError - Error display type for chat functions
 */
export interface FunctionError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
}
