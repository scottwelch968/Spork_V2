/**
 * COSMO Logger - Structured Logging Utility (CANONICAL SOURCE)
 * 
 * COSMO Constitution Article II/XI Compliance:
 * This is the SINGLE SOURCE OF TRUTH for LogLevel and LogEntry types.
 * edgeLogger.ts imports from here to avoid duplication.
 * 
 * Provides consistent logging across all COSMO modules with:
 * - Trace ID propagation for request correlation
 * - Structured log format for easier parsing
 * - Log levels (debug, info, warn, error)
 * - Request/response phase logging
 */

import type { CosmoError } from './errors.ts';

// ============= Canonical Types (SINGLE SOURCE OF TRUTH) =============
// Per COSMO Constitution Article II: These are the canonical definitions.
// edgeLogger.ts imports these types - do NOT duplicate.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  traceId?: string;
  functionName?: string;  // Added for edgeLogger compatibility
  phase?: string;
  message: string;
  data?: Record<string, unknown>;
}

// ============= Configuration =============

// Enable debug logging via environment variable
const DEBUG_ENABLED = Deno.env.get('COSMO_DEBUG_LOG') === 'true';

// ============= Core Logger =============

/**
 * Log a message with structured format
 */
export function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  traceId?: string
): void {
  // Skip debug logs unless explicitly enabled
  if (level === 'debug' && !DEBUG_ENABLED) {
    return;
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(traceId && { traceId }),
    ...(data && { data }),
  };
  
  // Format output based on level
  const prefix = traceId ? `[${traceId}]` : '';
  const formattedMessage = `[COSMO:${level.toUpperCase()}]${prefix} ${message}`;
  
  switch (level) {
    case 'error':
      console.error(formattedMessage, data ? JSON.stringify(data) : '');
      break;
    case 'warn':
      console.warn(formattedMessage, data ? JSON.stringify(data) : '');
      break;
    case 'debug':
      console.debug(formattedMessage, data ? JSON.stringify(data) : '');
      break;
    default:
      console.log(formattedMessage, data ? JSON.stringify(data) : '');
  }
}

// ============= Convenience Methods =============

export function debug(message: string, data?: Record<string, unknown>, traceId?: string): void {
  log('debug', message, data, traceId);
}

export function info(message: string, data?: Record<string, unknown>, traceId?: string): void {
  log('info', message, data, traceId);
}

export function warn(message: string, data?: Record<string, unknown>, traceId?: string): void {
  log('warn', message, data, traceId);
}

export function error(message: string, data?: Record<string, unknown>, traceId?: string): void {
  log('error', message, data, traceId);
}

// ============= Request Phase Logging =============

/**
 * Log the start of a request phase
 */
export function logPhaseStart(
  traceId: string,
  phase: string,
  data?: Record<string, unknown>
): void {
  log('info', `=== ${phase} START ===`, data, traceId);
}

/**
 * Log the completion of a request phase
 */
export function logPhaseComplete(
  traceId: string,
  phase: string,
  durationMs: number,
  data?: Record<string, unknown>
): void {
  log('info', `=== ${phase} COMPLETE (${durationMs}ms) ===`, data, traceId);
}

/**
 * Log a request lifecycle event
 */
export function logRequest(
  traceId: string,
  phase: string,
  data: Record<string, unknown>
): void {
  log('info', phase, { ...data, phase }, traceId);
}

// ============= Error Logging =============

/**
 * Log a CosmoError with full context
 */
export function logError(
  traceId: string,
  cosmoError: CosmoError,
  context?: Record<string, unknown>
): void {
  log('error', `Error: ${cosmoError.code} - ${cosmoError.message}`, {
    code: cosmoError.code,
    httpStatus: cosmoError.httpStatus,
    retryable: cosmoError.retryable,
    details: cosmoError.details,
    ...context,
  }, traceId);
}

/**
 * Log an exception with trace ID
 */
export function logException(
  traceId: string,
  err: unknown,
  context?: Record<string, unknown>
): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  
  log('error', `Exception: ${message}`, {
    stack,
    ...context,
  }, traceId);
}

// ============= Trace ID Generation =============

/**
 * Generate a unique trace ID for request correlation
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `cosmo_${timestamp}_${random}`;
}

// ============= Logger Factory =============

/**
 * Create a scoped logger with pre-bound traceId
 */
export function createScopedLogger(traceId: string) {
  return {
    debug: (msg: string, data?: Record<string, unknown>) => debug(msg, data, traceId),
    info: (msg: string, data?: Record<string, unknown>) => info(msg, data, traceId),
    warn: (msg: string, data?: Record<string, unknown>) => warn(msg, data, traceId),
    error: (msg: string, data?: Record<string, unknown>) => error(msg, data, traceId),
    logPhaseStart: (phase: string, data?: Record<string, unknown>) => logPhaseStart(traceId, phase, data),
    logPhaseComplete: (phase: string, durationMs: number, data?: Record<string, unknown>) => logPhaseComplete(traceId, phase, durationMs, data),
    logRequest: (phase: string, data: Record<string, unknown>) => logRequest(traceId, phase, data),
    logError: (err: CosmoError, context?: Record<string, unknown>) => logError(traceId, err, context),
    logException: (err: unknown, context?: Record<string, unknown>) => logException(traceId, err, context),
  };
}
