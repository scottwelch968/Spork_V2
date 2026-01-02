/**
 * App Store ↔ COSMO Protocol Validator
 * 
 * Validates requests from installed tools/assistants/agents
 * and enforces permission boundaries.
 */

import type {
  AppItemType,
  CosmoAppRequest,
  CosmoAppResponse,
  CosmoAppOperation,
  CosmoDenyReason,
  RetryPolicy,
  FailureHandling,
} from './types.ts';

// ============= Capability Matrix =============

/**
 * What each app type can and cannot request from COSMO
 */
export const CAPABILITY_MATRIX: Record<AppItemType, {
  allowed: string[];
  denied: string[];
  maxConcurrent: number;
  hasLoop: boolean;
  autonomy: 'none' | 'reactive' | 'autonomous';
}> = {
  tool: {
    allowed: [
      'ai.complete',
      'ai.generateImage',
      'storage.read',
      'storage.write',
      'external.checkConnection',
      'external.call',
    ],
    denied: [
      'chat.fullSession',
      'agent.execute',
      'agent.plan',
      'agent.reflect',
      'cosmo.orchestrate',
    ],
    maxConcurrent: 1,
    hasLoop: false,
    autonomy: 'none',
  },
  assistant: {
    allowed: [
      'ai.complete',
      'ai.generateImage',
      'chat.send',
      'chat.getHistory',
      'tool.invoke',
      'tool.list',
      'storage.read',
      'storage.write',
      'storage.delete',
      'external.checkConnection',
      'external.listConnections',
      'external.call',
    ],
    denied: [
      'agent.execute',
      'agent.plan',
      'agent.reflect',
      'agent.checkpoint',
    ],
    maxConcurrent: 3,
    hasLoop: false,
    autonomy: 'reactive',
  },
  agent: {
    allowed: [
      'ai.complete',
      'ai.generateImage',
      'chat.send',
      'chat.getHistory',
      'tool.invoke',
      'tool.list',
      'storage.read',
      'storage.write',
      'storage.delete',
      'files.read',
      'files.write',
      'files.list',
      'agent.plan',
      'agent.execute',
      'agent.reflect',
      'agent.checkpoint',
      'external.checkConnection',
      'external.listConnections',
      'external.requestConnection',
      'external.call',
      'external.refreshToken',
    ],
    denied: [
      'cosmo.configChange',
      'admin.userManagement',
      'admin.systemSettings',
      'external.disconnect', // Only users can disconnect, not agents
    ],
    maxConcurrent: 10,
    hasLoop: true,
    autonomy: 'autonomous',
  },
};

// ============= Permission Requirements =============

/**
 * Maps operations to required installation permissions
 */
export const PERMISSION_REQUIREMENTS: Record<string, string[]> = {
  // AI operations
  'ai.complete': ['ai'],
  'ai.generateImage': ['ai'],
  'ai.embedDocument': ['ai'],
  
  // Chat operations
  'chat.send': ['chat'],
  'chat.getHistory': ['chat'],
  
  // Tool operations
  'tool.invoke': ['ai'],
  'tool.list': [],  // No permission required
  
  // Storage operations
  'storage.read': ['storage'],
  'storage.write': ['storage'],
  'storage.delete': ['storage'],
  
  // File operations
  'files.read': ['files'],
  'files.write': ['files'],
  'files.list': ['files'],
  
  // Agent operations
  'agent.plan': ['ai'],
  'agent.execute': ['ai'],
  'agent.reflect': ['ai'],
  'agent.checkpoint': ['storage'],
  
  // External operations
  'external.checkConnection': [],
  'external.listConnections': [],
  'external.requestConnection': [],
  'external.call': ['external'],
  'external.refreshToken': ['external'],
  'external.disconnect': ['external'],
};

// ============= Retry Policies =============

/**
 * Retry policies per app type
 */
export const RETRY_POLICIES: Record<AppItemType, RetryPolicy> = {
  tool: {
    maxRetries: 0,  // Tools don't retry - fail fast
    retryableErrors: [],
    backoffMs: 0,
  },
  assistant: {
    maxRetries: 2,  // Limited retries for assistants
    retryableErrors: ['rate_limited', 'model_unavailable', 'dependency_unavailable', 'external_rate_limited'],
    backoffMs: 1000,
  },
  agent: {
    maxRetries: 5,  // Agents have robust retry
    retryableErrors: [
      'rate_limited',
      'model_unavailable',
      'dependency_unavailable',
      'context_insufficient',
      'external_rate_limited',
      'integration_expired',
    ],
    backoffMs: 2000,
    exponentialBackoff: true,
  },
};

// ============= Failure Handling =============

/**
 * How failures propagate per app type
 */
export const FAILURE_HANDLERS: Record<AppItemType, FailureHandling> = {
  tool: {
    onFailure: 'throw',  // Immediate throw to caller
    logLevel: 'error',
  },
  assistant: {
    onFailure: 'graceful',  // Return error message to user
    logLevel: 'warn',
    fallbackResponse: 'I encountered an issue while processing your request. Please try again.',
  },
  agent: {
    onFailure: 'reflect',  // Trigger reflection step
    logLevel: 'info',
    canAdjustPlan: true,
    maxFailuresBeforeAbort: 3,
  },
};

// ============= Validation Functions =============

/**
 * Validate an incoming app request
 * Returns null if valid, or a deny response if invalid
 */
export function validateAppRequest(request: CosmoAppRequest): CosmoAppResponse | null {
  const startTime = Date.now();
  
  // 1. Check if app type is valid
  if (!['tool', 'assistant', 'agent'].includes(request.appItemType)) {
    return buildDenyResponse(request, 'invalid_payload', 'Invalid app item type', 400, startTime);
  }
  
  // 2. Check if operation is allowed for this app type
  if (!isOperationAllowed(request.appItemType, request.operation)) {
    return buildDenyResponse(
      request,
      'operation_not_allowed',
      `Operation '${request.operation}' is not allowed for ${request.appItemType}s`,
      403,
      startTime,
      { suggestedAction: `Use an app type with higher autonomy level for this operation.` }
    );
  }
  
  // 3. Check if required permissions are granted
  if (!hasRequiredPermissions(request.context.permissions, request.operation)) {
    const required = PERMISSION_REQUIREMENTS[request.operation] || [];
    return buildDenyResponse(
      request,
      'permission_denied',
      `Missing required permissions: ${required.join(', ')}`,
      403,
      startTime,
      { requiredPermissions: required }
    );
  }
  
  // All validations passed
  return null;
}

/**
 * Check if an operation is allowed for a given app type
 */
export function isOperationAllowed(appType: AppItemType, operation: CosmoAppOperation): boolean {
  const capabilities = CAPABILITY_MATRIX[appType];
  
  // Check explicit denials first
  if (capabilities.denied.some(denied => operationMatches(operation, denied))) {
    return false;
  }
  
  // Check explicit allows
  return capabilities.allowed.some(allowed => operationMatches(operation, allowed));
}

/**
 * Check if granted permissions satisfy operation requirements
 */
export function hasRequiredPermissions(grantedPermissions: string[], operation: CosmoAppOperation): boolean {
  const required = PERMISSION_REQUIREMENTS[operation] || [];
  
  // No permissions required
  if (required.length === 0) {
    return true;
  }
  
  // Check all required permissions are granted
  return required.every(req => grantedPermissions.includes(req));
}

/**
 * Get retry policy for an app type
 */
export function getRetryPolicy(appType: AppItemType): RetryPolicy {
  return RETRY_POLICIES[appType];
}

/**
 * Get failure handler for an app type
 */
export function getFailureHandler(appType: AppItemType): FailureHandling {
  return FAILURE_HANDLERS[appType];
}

/**
 * Check if an error is retryable for a given app type
 */
export function isErrorRetryable(appType: AppItemType, reason: CosmoDenyReason): boolean {
  const policy = RETRY_POLICIES[appType];
  return policy.retryableErrors.includes(reason);
}

/**
 * Calculate backoff time for retry attempt
 */
export function calculateBackoff(appType: AppItemType, attemptNumber: number): number {
  const policy = RETRY_POLICIES[appType];
  
  if (policy.exponentialBackoff) {
    return policy.backoffMs * Math.pow(2, attemptNumber - 1);
  }
  
  return policy.backoffMs;
}

// ============= Helper Functions =============

/**
 * Check if operation matches a pattern (supports wildcards like 'storage.*')
 */
function operationMatches(operation: string, pattern: string): boolean {
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return operation.startsWith(prefix + '.');
  }
  return operation === pattern;
}

/**
 * Build a deny response
 */
function buildDenyResponse(
  request: CosmoAppRequest,
  reason: CosmoDenyReason,
  message: string,
  httpStatus: number,
  startTime: number,
  extras?: {
    requiredPermissions?: string[];
    suggestedAction?: string;
    retryAfterMs?: number;
  }
): CosmoAppResponse {
  const retryable = isErrorRetryable(request.appItemType, reason);
  
  return {
    success: false,
    requestId: crypto.randomUUID(),
    denied: {
      reason,
      message,
      httpStatus,
      retryable,
      ...extras,
    },
    metadata: {
      processingTimeMs: Date.now() - startTime,
    },
  };
}

/**
 * Log app request for auditing
 */
export function logAppRequest(
  request: CosmoAppRequest,
  response: CosmoAppResponse,
  supabase: unknown
): void {
  // Log to activity_log table
  const logEntry = {
    actor_type: `app_${request.appItemType}`,
    actor_id: request.appItemId,
    action: request.operation,
    resource_type: 'cosmo_request',
    resource_id: response.requestId,
    workspace_id: request.workspaceId || null,
    app_section: 'app_store',
    details: {
      appItemName: request.appItemName,
      success: response.success,
      deniedReason: response.denied?.reason,
      processingTimeMs: response.metadata.processingTimeMs,
    },
  };
  
  // Fire and forget - don't await
  (supabase as any).from('activity_log').insert(logEntry);
}
