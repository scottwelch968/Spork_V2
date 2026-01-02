/**
 * COSMO Error Factory - Centralized Error Creation & Handling
 * 
 * Provides standardized error creation, classification, and HTTP status mapping.
 * All COSMO modules should use these utilities for consistent error handling.
 */

// ============= Error Codes =============

/**
 * Canonical error codes for COSMO operations
 * Maps to both CosmoDenyReason (user-facing) and internal error states
 */
export type CosmoErrorCode = 
  // User-facing (maps to CosmoDenyReason)
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'PAYMENT_REQUIRED'
  | 'UNAUTHORIZED'
  | 'PERMISSION_DENIED'
  | 'MODEL_UNAVAILABLE'
  | 'INTEGRATION_EXPIRED'
  | 'LOOP_LIMIT_EXCEEDED'
  | 'APPROVAL_REQUIRED'
  | 'INVALID_PAYLOAD'
  // Internal error codes
  | 'ALL_MODELS_FAILED'
  | 'CONFIG_MISSING'
  | 'FUNCTION_FAILED'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

// ============= Error Interface =============

export interface CosmoError {
  code: CosmoErrorCode;
  message: string;
  httpStatus: number;
  retryable: boolean;
  details?: string;
  stack?: string;
  traceId?: string;
}

// ============= HTTP Status Mapping =============

const ERROR_HTTP_STATUS: Record<CosmoErrorCode, number> = {
  RATE_LIMITED: 429,
  QUOTA_EXCEEDED: 402,
  PAYMENT_REQUIRED: 402,
  UNAUTHORIZED: 401,
  PERMISSION_DENIED: 403,
  MODEL_UNAVAILABLE: 503,
  INTEGRATION_EXPIRED: 401,
  LOOP_LIMIT_EXCEEDED: 400,
  APPROVAL_REQUIRED: 403,
  INVALID_PAYLOAD: 400,
  ALL_MODELS_FAILED: 503,
  CONFIG_MISSING: 500,
  FUNCTION_FAILED: 500,
  TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

// ============= Retryable Errors =============

const RETRYABLE_ERRORS: Set<CosmoErrorCode> = new Set([
  'RATE_LIMITED',
  'MODEL_UNAVAILABLE',
  'TIMEOUT',
  'ALL_MODELS_FAILED',
]);

// ============= User-Friendly Messages =============

const ERROR_MESSAGES: Record<CosmoErrorCode, string> = {
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: 'Usage limit reached. Please upgrade your plan or wait for reset.',
  PAYMENT_REQUIRED: 'Payment required. Please add credits to continue.',
  UNAUTHORIZED: 'Authentication required. Please sign in.',
  PERMISSION_DENIED: 'You do not have permission for this action.',
  MODEL_UNAVAILABLE: 'AI model temporarily unavailable. Please try again.',
  INTEGRATION_EXPIRED: 'Integration credentials expired. Please reconnect.',
  LOOP_LIMIT_EXCEEDED: 'Agent execution stopped to prevent runaway process.',
  APPROVAL_REQUIRED: 'This action requires approval before proceeding.',
  INVALID_PAYLOAD: 'Invalid request format. Please check your input.',
  ALL_MODELS_FAILED: 'All AI models failed. Please try again later.',
  CONFIG_MISSING: 'System configuration missing. Contact support.',
  FUNCTION_FAILED: 'Function execution failed. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
};

// ============= Factory Functions =============

/**
 * Create a standardized COSMO error
 */
export function createCosmoError(
  code: CosmoErrorCode,
  message?: string,
  details?: string,
  traceId?: string
): CosmoError {
  return {
    code,
    message: message || ERROR_MESSAGES[code],
    httpStatus: ERROR_HTTP_STATUS[code],
    retryable: RETRYABLE_ERRORS.has(code),
    details,
    traceId,
  };
}

/**
 * Create error from caught exception
 */
export function errorFromException(
  error: unknown,
  traceId?: string,
  defaultCode: CosmoErrorCode = 'INTERNAL_ERROR'
): CosmoError {
  if (isCosmoError(error)) {
    return { ...error, traceId: traceId || error.traceId };
  }
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Detect known error patterns from message
    if (message.includes('RATE_LIMITED') || message.includes('429')) {
      return createCosmoError('RATE_LIMITED', undefined, message, traceId);
    }
    if (message.includes('PAYMENT_REQUIRED') || message.includes('402')) {
      return createCosmoError('PAYMENT_REQUIRED', undefined, message, traceId);
    }
    if (message.includes('UNAUTHORIZED') || message.includes('401')) {
      return createCosmoError('UNAUTHORIZED', undefined, message, traceId);
    }
    if (message.includes('ALL_MODELS_FAILED')) {
      return createCosmoError('ALL_MODELS_FAILED', undefined, message, traceId);
    }
    if (message.includes('CONFIG_MISSING') || message.includes('not configured')) {
      return createCosmoError('CONFIG_MISSING', message, undefined, traceId);
    }
    
    return {
      code: defaultCode,
      message,
      httpStatus: ERROR_HTTP_STATUS[defaultCode],
      retryable: RETRYABLE_ERRORS.has(defaultCode),
      details: error.stack,
      traceId,
    };
  }
  
  return createCosmoError(defaultCode, String(error), undefined, traceId);
}

// ============= Type Guards =============

/**
 * Check if an error is a CosmoError
 */
export function isCosmoError(error: unknown): error is CosmoError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'httpStatus' in error &&
    'retryable' in error
  );
}

// ============= Utility Functions =============

/**
 * Get HTTP status code for error code
 */
export function errorToHttpStatus(code: CosmoErrorCode): number {
  return ERROR_HTTP_STATUS[code];
}

/**
 * Check if an error code is retryable
 */
export function isRetryable(code: CosmoErrorCode): boolean {
  return RETRYABLE_ERRORS.has(code);
}

/**
 * Get user-friendly message for error code
 */
export function getUserMessage(code: CosmoErrorCode): string {
  return ERROR_MESSAGES[code];
}

/**
 * Convert CosmoError to ExecutionError format for contracts
 */
export function toExecutionError(error: CosmoError): {
  code: string;
  message: string;
  httpStatus: number;
  retryable: boolean;
  details?: string;
  stack?: string;
} {
  return {
    code: error.code,
    message: error.message,
    httpStatus: error.httpStatus,
    retryable: error.retryable,
    details: error.details,
    stack: error.stack,
  };
}
