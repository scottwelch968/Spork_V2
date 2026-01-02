/**
 * COSMO System Types
 * 
 * System-level types used by COSMO subsystems for request handling,
 * event processing, and internal communication.
 * 
 * These are NOT canonical contracts (see src/cosmo/contracts.ts).
 * These are NOT presentation types (see src/presentation/types/).
 */

// ============= ACTOR TYPES =============

export type ActorType = 'user' | 'editor' | 'agent' | 'system' | 'webhook' | 'api';

export interface Actor {
  type: ActorType;
  id: string;
  metadata?: Record<string, unknown>;
}

// ============= DISPLAY MODES =============

export type DisplayMode = 'ui' | 'minimal' | 'silent';

export interface RequestContext {
  displayMode: DisplayMode;
  workspaceId?: string;
  chatId?: string;
  personaId?: string;
  persist: boolean;
  streamResponse: boolean;
}

// ============= REQUEST TYPES =============

export interface Attachment {
  type: 'file' | 'image' | 'code';
  name: string;
  content: string;
  mimeType?: string;
}

export interface DataRequest {
  requestId: string;
  actor: Actor;
  context: RequestContext;
  content: string;
  model?: string;
  attachments?: Attachment[];
  timestamp: number;
}

// ============= MODEL SELECTION =============

export interface ModelSelectionUI {
  requestId: string;
  selectedModel: string;
  selectedModelName?: string;
  cosmoSelected: boolean;
  detectedCategory?: string;
  reason?: string;
}

// ============= RESPONSE TYPES =============

export interface ResponseChunk {
  requestId: string;
  content: string;
  fullContent: string;
  model: string;
  isComplete: boolean;
}

export interface ResponseComplete {
  requestId: string;
  content: string;
  model: string;
  modelName?: string;
  cosmoSelected: boolean;
  detectedCategory?: string;
  messageId?: string;
  tokensUsed?: number;
}

// ============= ACTIONS =============

export type ActionType = 'copy' | 'regenerate' | 'save' | 'share' | 'edit' | 'delete';

export interface AvailableAction {
  type: ActionType;
  label: string;
  enabled: boolean;
  handler?: string;
}

export interface ActionsResult {
  requestId: string;
  actions: AvailableAction[];
  responseType: 'text' | 'image' | 'code' | 'error';
}

// ============= PERSISTENCE =============

export interface PersistenceResult {
  requestId: string;
  success: boolean;
  messageId?: string;
  chatId?: string;
  error?: string;
}

// ============= ERROR TYPES =============

export interface FunctionError {
  requestId: string;
  phase: 'submit' | 'model-select' | 'response' | 'actions' | 'persist';
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

// ============= EVENT TYPES =============

export type ChatFunctionEvent =
  | 'request:submitted'
  | 'request:validated'
  | 'model:selecting'
  | 'model:selected'
  | 'model:ready'
  | 'response:started'
  | 'response:chunk'
  | 'response:metadata'
  | 'response:complete'
  | 'actions:determining'
  | 'actions:determined'
  | 'persist:started'
  | 'persist:complete'
  | 'error:occurred';

// ============= FUNCTION OPTIONS =============

export interface SubmitRequestOptions {
  actor: Actor;
  content: string;
  context: Partial<RequestContext>;
  model?: string;
  attachments?: Attachment[];
}

export interface ProcessResponseOptions {
  request: DataRequest;
  modelSelection: ModelSelectionUI;
  authToken?: string;
}

// ============= EVENT PAYLOADS =============

export interface ChatFunctionEventPayloads {
  'request:submitted': DataRequest;
  'request:validated': DataRequest;
  'model:selecting': { requestId: string; requestedModel?: string };
  'model:selected': ModelSelectionUI;
  'model:ready': ModelSelectionUI;
  'response:started': { requestId: string; model: string };
  'response:chunk': ResponseChunk;
  'response:metadata': ModelSelectionUI;
  'response:complete': ResponseComplete;
  'actions:determining': { requestId: string };
  'actions:determined': ActionsResult;
  'persist:started': { requestId: string; chatId?: string };
  'persist:complete': PersistenceResult;
  'error:occurred': FunctionError;
}
