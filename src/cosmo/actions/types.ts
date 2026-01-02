/**
 * COSMO Action Layer Types
 * 
 * Defines the communication protocol for how COSMO delivers typed instructions
 * to all system layers (presentation, database, system, external).
 * 
 * This is a COSMO core module - actions flow FROM COSMO TO output layers.
 * Output layers never send actions back to COSMO.
 * 
 * @see docs/governance/amendments/001-ACTION-LAYER-ARCHITECTURE.md
 */

// ============= CODE CHANGE ACTION =============

/**
 * CodeChange - Represents a code modification action
 * Used by Spork Editor for AI-assisted code changes
 */
export interface CodeChange {
  file: string;
  action: 'create' | 'edit' | 'delete';
  content: string;
}

// ============= TARGET LAYERS =============

/**
 * Target layers that can receive COSMO actions
 */
export type ActionTarget = 
  | 'presentation'  // UI rendering, display updates, user feedback
  | 'database'      // Persistence operations, queries, mutations
  | 'system'        // Internal function execution, COSMO operations
  | 'external';     // Third-party API calls, integrations

// ============= PRIORITY LEVELS =============

export type ActionPriority = 'low' | 'normal' | 'high' | 'critical';

// ============= ACTION CONTEXT =============

export interface ActionContext {
  userId?: string;
  workspaceId?: string;
  chatId?: string;
  requestId?: string;
  priority?: ActionPriority;
}

// ============= COSMO ACTION INTERFACE =============

/**
 * Unified action instruction from COSMO to any layer
 * 
 * @template T - Type of the action payload
 */
export interface CosmoAction<T = unknown> {
  /** Unique action identifier */
  actionId: string;
  
  /** Trace ID for debugging/correlation */
  traceId: string;
  
  /** Which layer should handle this action */
  target: ActionTarget;
  
  /** Action type within the target layer */
  actionType: string;
  
  /** Action-specific payload */
  payload: T;
  
  /** Optional context for the action */
  context?: ActionContext;
  
  /** Timestamp of action creation (ISO 8601) */
  createdAt: string;
}

// ============= PRESENTATION ACTION TYPES =============

/**
 * Actions COSMO sends to the UI/Presentation layer
 */
export type PresentationActionType =
  | 'display:message'        // Show a message in chat
  | 'display:chunk'          // Stream a response chunk
  | 'display:complete'       // Mark response complete
  | 'display:error'          // Show error to user
  | 'display:loading'        // Show loading state
  | 'display:toast'          // Show toast notification
  | 'display:modal'          // Show modal dialog
  | 'update:model-info'      // Update model attribution
  | 'update:actions'         // Update available actions
  | 'update:context';        // Update chat context

// ============= DATABASE ACTION TYPES =============

/**
 * Actions COSMO sends to the database layer
 */
export type DatabaseActionType =
  | 'persist:message'        // Save message to database
  | 'persist:chat'           // Save/update chat
  | 'persist:usage'          // Log usage metrics
  | 'query:history'          // Fetch chat history
  | 'query:context'          // Fetch context data
  | 'delete:message'         // Remove message
  | 'update:metadata';       // Update message metadata

// ============= SYSTEM ACTION TYPES =============

/**
 * Actions COSMO sends to internal systems
 */
export type SystemActionType =
  | 'execute:function'       // Run a chat function
  | 'execute:chain'          // Run function chain
  | 'route:model'            // Route to AI model
  | 'enhance:prompt'         // Enhance user prompt
  | 'analyze:intent'         // Analyze user intent
  | 'validate:quota'         // Check usage quota
  | 'log:debug';             // Log debug information

// ============= EXTERNAL ACTION TYPES =============

/**
 * Actions COSMO sends to external services
 */
export type ExternalActionType =
  | 'call:api'               // Call external API
  | 'auth:refresh'           // Refresh OAuth token
  | 'webhook:send'           // Send webhook
  | 'integration:invoke';    // Invoke integration

// ============= ALL ACTION TYPES UNION =============

export type AllActionTypes = 
  | PresentationActionType 
  | DatabaseActionType 
  | SystemActionType 
  | ExternalActionType;

// ============= TYPED ACTION HELPERS =============

/**
 * Presentation action with typed payload
 */
export interface PresentationAction<T = unknown> extends CosmoAction<T> {
  target: 'presentation';
  actionType: PresentationActionType;
}

/**
 * Database action with typed payload
 */
export interface DatabaseAction<T = unknown> extends CosmoAction<T> {
  target: 'database';
  actionType: DatabaseActionType;
}

/**
 * System action with typed payload
 */
export interface SystemAction<T = unknown> extends CosmoAction<T> {
  target: 'system';
  actionType: SystemActionType;
}

/**
 * External action with typed payload
 */
export interface ExternalAction<T = unknown> extends CosmoAction<T> {
  target: 'external';
  actionType: ExternalActionType;
}

// ============= COMMON PAYLOAD TYPES =============

/**
 * Payload for display:message action
 */
export interface DisplayMessagePayload {
  content: string;
  role: 'user' | 'assistant' | 'system';
  model?: string;
  modelName?: string;
  cosmoSelected?: boolean;
  detectedCategory?: string;
}

/**
 * Payload for display:chunk action
 */
export interface DisplayChunkPayload {
  content: string;
  fullContent: string;
  model: string;
  isComplete: boolean;
}

/**
 * Payload for display:error action
 */
export interface DisplayErrorPayload {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Payload for display:toast action
 */
export interface DisplayToastPayload {
  title: string;
  description?: string;
  variant: 'default' | 'destructive' | 'success';
  duration?: number;
}

/**
 * Payload for persist:message action
 */
export interface PersistMessagePayload {
  content: string;
  role: 'user' | 'assistant';
  chatId: string;
  model?: string;
  tokensUsed?: number;
  cosmoSelected?: boolean;
  detectedCategory?: string;
}

/**
 * Payload for execute:function action
 */
export interface ExecuteFunctionPayload {
  functionKey: string;
  parameters: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Payload for route:model action
 */
export interface RouteModelPayload {
  requestedModel?: string;
  costTierWeight: number;
  intent?: string;
  fallbackEnabled: boolean;
}

/**
 * Payload for call:api action
 */
export interface CallApiPayload {
  providerKey: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

// ============= ACTION RESULT =============

/**
 * Result of processing a COSMO action
 */
export interface ActionResult<T = unknown> {
  actionId: string;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  processingTimeMs?: number;
}
