/**
 * Edge Function Logger - Structured Logging Utility
 * 
 * COSMO Constitution Article II/XI Compliance:
 * Types (LogLevel, LogEntry) are imported from cosmo/logger.ts
 * to maintain single source of truth.
 * 
 * Provides consistent logging across all edge functions with:
 * - Trace ID propagation for request correlation
 * - Structured log format for easier parsing
 * - Log levels (debug, info, warn, error)
 * - Function-scoped logging
 */

// ============= Types (IMPORTED from canonical source) =============
// Per COSMO Constitution Article II: Import from cosmo/logger.ts
import type { LogLevel, LogEntry } from './cosmo/logger.ts';

// Re-export for consumers that import from edgeLogger
export type { LogLevel, LogEntry };

// ============= Configuration =============

// Enable debug logging via environment variable
const DEBUG_ENABLED = Deno.env.get('EDGE_DEBUG_LOG') === 'true';

// ============= Trace ID Generation =============

/**
 * Generate a unique trace ID for request correlation
 */
export function generateTraceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `edge_${timestamp}_${random}`;
}

// ============= Core Logger =============

/**
 * Log a message with structured format
 */
export function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  traceId?: string,
  functionName?: string
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
    ...(functionName && { functionName }),
    ...(data && { data }),
  };
  
  // Format output based on level
  const prefix = traceId ? `[${traceId}]` : '';
  const fnPrefix = functionName ? `[${functionName}]` : '';
  const formattedMessage = `[EDGE:${level.toUpperCase()}]${fnPrefix}${prefix} ${message}`;
  
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

// ============= Function-Scoped Logger Factory =============

/**
 * Create a scoped logger with pre-bound traceId and functionName
 */
export function createLogger(functionName: string, traceId?: string) {
  const tid = traceId || generateTraceId();
  
  return {
    traceId: tid,
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data, tid, functionName),
    info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data, tid, functionName),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data, tid, functionName),
    error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data, tid, functionName),
    
    // Lifecycle methods
    start: (data?: Record<string, unknown>) => log('info', 'Request started', data, tid, functionName),
    complete: (durationMs: number, data?: Record<string, unknown>) => 
      log('info', `Request completed in ${durationMs}ms`, data, tid, functionName),
    fail: (err: unknown, data?: Record<string, unknown>) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      log('error', `Request failed: ${errorMessage}`, { ...data, stack: errorStack }, tid, functionName);
    },
  };
}

// ============= Utility Types =============

export type EdgeLogger = ReturnType<typeof createLogger>;
