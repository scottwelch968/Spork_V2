# Implementation Guides

## Pre-Implementation Protocol (MANDATORY)

Before any significant change:

1. **Historical Context Review** - Review last 12 hours of conversation and failed attempts
2. **Issue Persistence Evaluation** - Confirm original issue still exists
3. **Root Cause Analysis** - Explain WHY each previous fix failed
4. **Strategy Re-evaluation** - Challenge current approach, consider alternatives
5. **Implementation Plan Validation** - Present solution with explicit reasoning

**If 3+ fixes fail, acknowledge architectural change is required.**

---

## Error Handling

Edge functions must return structured errors:

```typescript
{
  message: string;
  code: string;
  httpStatus: number;
  details?: string;
  hint?: string;
  table?: string;
}
```

## COSMO Execution Model

- Unified entry point for all request types
- `functionExecutor` is pure execution only
- `EventHandler` is UI relay only

## Queueing & Batching

- Priority-based queueing
- Similarity batching with savings tracking
- Atomic dequeue and safe retries

## Auth & React Architecture

- Single `AuthProvider` via layout pattern
- No module-level mutable auth state
- Debounced activity tracking (5-second minimum)

## Streaming Rule

Metadata must be sent **before** final done signal.
