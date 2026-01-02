/**
 * COSMO Request Normalizer
 * 
 * Single point of entry for converting any raw request into NormalizedRequest.
 * All adapters use this function - they do NOT create NormalizedRequest directly.
 */

import type {
  CosmoRequest,
  NormalizedRequest,
  CosmoRequestType,
  CosmoRequestSource,
  CosmoResponseMode,
  CosmoPriority,
} from './contracts';

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `cosmo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate a unique trace ID for request correlation
 */
function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `trace_${timestamp}_${random}`;
}

/**
 * Detect request type from raw request
 */
function detectRequestType(raw: Partial<CosmoRequest>): CosmoRequestType {
  if (raw.requestType) return raw.requestType;
  if (raw.webhookPayload) return 'webhook';
  if (raw.taskName) return 'system_task';
  if (raw.agentId || raw.agentGoal) return 'agent_action';
  return 'chat';
}

/**
 * Build source from raw request
 */
function buildSource(raw: Partial<CosmoRequest>): CosmoRequestSource {
  if (raw.source) return raw.source;
  
  const type = detectRequestType(raw);
  switch (type) {
    case 'webhook':
      return { type: 'webhook', metadata: raw.webhookPayload };
    case 'system_task':
      return { type: 'system', name: raw.taskName };
    case 'agent_action':
      return { type: 'agent', id: raw.agentId };
    case 'api_call':
      return { type: 'api' };
    default:
      return { type: 'user', id: raw.userId };
  }
}

/**
 * Determine response mode from raw request
 */
function determineResponseMode(raw: Partial<CosmoRequest>): CosmoResponseMode {
  if (raw.responseMode) return raw.responseMode;
  
  const type = detectRequestType(raw);
  switch (type) {
    case 'webhook':
    case 'system_task':
      return 'batch';
    case 'agent_action':
      return 'silent';
    default:
      return 'stream';
  }
}

/**
 * Determine priority from raw request
 */
function determinePriority(raw: Partial<CosmoRequest>): CosmoPriority {
  if (raw.priority) return raw.priority;
  
  const type = detectRequestType(raw);
  switch (type) {
    case 'agent_action':
      return 'high';
    case 'system_task':
      return 'low';
    default:
      return 'normal';
  }
}

/**
 * Normalize any raw request into a NormalizedRequest
 * 
 * This is the ONLY function that should create NormalizedRequest objects.
 * All adapters call this function to ensure consistent normalization.
 */
export function normalizeRequest(
  raw: Partial<CosmoRequest>,
  defaults?: Partial<NormalizedRequest>
): NormalizedRequest {
  const requestType = detectRequestType(raw);
  const source = buildSource(raw);
  const responseMode = determineResponseMode(raw);
  const priority = determinePriority(raw);

  return {
    // Core fields with defaults
    content: raw.content || '',
    messages: raw.messages || [],
    chatId: raw.chatId,
    workspaceId: raw.workspaceId,
    personaId: raw.personaId,
    requestedModel: raw.requestedModel,
    spaceContext: raw.spaceContext,
    userId: raw.userId,
    authToken: raw.authToken,
    
    // Webhook fields
    webhookPayload: raw.webhookPayload,
    webhookSecret: raw.webhookSecret,
    
    // Task fields
    taskName: raw.taskName,
    taskConfig: raw.taskConfig,
    
    // Agent fields
    agentId: raw.agentId,
    agentGoal: raw.agentGoal,
    agentContext: raw.agentContext,
    
    // Callback
    callbackUrl: raw.callbackUrl,
    
    // GUARANTEED fields (normalized)
    requestType,
    source,
    responseMode,
    priority,
    
    // Normalization metadata
    normalizedAt: new Date().toISOString(),
    requestId: defaults?.requestId || generateRequestId(),
    traceId: defaults?.traceId || generateTraceId(),
    
    // Allow defaults to override
    ...defaults,
  };
}

/**
 * Validate that a request is properly normalized
 */
export function isNormalizedRequest(obj: unknown): obj is NormalizedRequest {
  if (!obj || typeof obj !== 'object') return false;
  
  const req = obj as Partial<NormalizedRequest>;
  
  return (
    typeof req.requestType === 'string' &&
    typeof req.source === 'object' &&
    typeof req.responseMode === 'string' &&
    typeof req.priority === 'string' &&
    typeof req.normalizedAt === 'string' &&
    typeof req.requestId === 'string'
  );
}
