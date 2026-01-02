# Chat Process Matrix

## Overview

This document defines the exact execution order for chat operations. Each phase must complete before the next begins. This eliminates race conditions and provides predictable behavior.

## Execution Phases

### Phase 1: OPTIMISTIC UI (Synchronous)
**Trigger:** User clicks send
**Blocking:** YES - must complete before Phase 2
**Operations:**
1. Add user message to state immediately
2. Set loading state
3. Emit `user-message-added` event with element reference

### Phase 2: SCROLL (Synchronous)
**Trigger:** `user-message-added` event
**Blocking:** YES - must complete before Phase 3
**Operations:**
1. Get DOM reference to user message (already in DOM from Phase 1)
2. Calculate scroll position
3. Execute scroll to top
4. Emit `scroll-complete` event

### Phase 3: BACKGROUND SAVE (Async, Non-blocking)
**Trigger:** Phase 2 complete OR immediately after Phase 1 if no scroll needed
**Blocking:** NO - fire and forget with error queue
**Operations:**
1. Create chat if needed (save chat ID for later)
2. Save user message to database
3. Queue any errors for retry/notification
4. Do NOT await - continue to Phase 4 immediately

### Phase 4: API CALL (Async)
**Trigger:** Phase 1 complete (does not wait for Phase 3)
**Blocking:** YES for streaming, but UI already updated
**Operations:**
1. Build request body with messages
2. Start streaming request
3. Emit `stream-started` event

### Phase 5: RESPONSE RENDER (Async, Streaming)
**Trigger:** SSE chunks received
**Blocking:** NO - continuous updates
**Operations:**
1. Parse SSE chunks
2. Update streaming message state
3. NO scroll forcing - content streams naturally under input
4. Parse metadata when received

### Phase 6: FINALIZE (Async)
**Trigger:** Stream complete ([DONE] received)
**Blocking:** NO
**Operations:**
1. Move streaming message to completed messages
2. Clear streaming state
3. Save assistant message to database (fire and forget)
4. Update URL if new chat (navigation)
5. Emit `response-complete` event
6. Clear loading state

## Event System

### Events Emitted

| Event | Payload | When |
|-------|---------|------|
| `user-message-added` | `{ element: HTMLElement, messageId: string }` | After optimistic UI update |
| `scroll-complete` | `{ success: boolean }` | After scroll executed |
| `stream-started` | `{ model: string, isAuto: boolean }` | When SSE stream begins |
| `stream-chunk` | `{ content: string, model: string }` | Each SSE chunk |
| `metadata-received` | `{ model, category, cosmoSelected }` | When metadata SSE received |
| `response-complete` | `{ messageId: string, model: string }` | After final save |

### Event Listeners

| Component | Listens To | Action |
|-----------|-----------|--------|
| UnifiedChatInterface | `user-message-added` | Execute scroll-to-top |
| ModelActionBox | `stream-started` | Show "booting" state |
| ModelActionBox | `metadata-received` | Transition to "ready" |
| FloatingChatInput | `response-complete` | Re-enable input |

## Database Operations

### Non-Blocking Saves

All database operations use fire-and-forget pattern with error queuing:

```typescript
// Instead of:
await supabase.from('messages').insert(data);

// Use:
queueDatabaseSave({
  table: 'messages',
  data,
  onError: (error) => {
    errorQueue.push({ table: 'messages', error, data });
    toast.error('Failed to save message');
  }
});
```

### Error Queue

Failed saves are queued for:
1. Automatic retry (3 attempts, exponential backoff)
2. User notification
3. Manual retry option

## Container Architecture

### Single Scroll Container

```
AppLayout (h-screen, overflow-hidden)
└── main (flex-1, overflow-hidden)
    └── ChatScrollContainer (h-full, overflow-y-auto) ← ONLY scrollable element
        └── messages (paddingBottom: inputHeight + buffer)
    └── FloatingChatInput (fixed, bottom: 0) ← Viewport fixed, NOT in scroll container
```

### Key Rules

1. **ONE** scroll container handles all scrolling
2. No nested `overflow-hidden` preventing scroll
3. FloatingChatInput is viewport-fixed, not scroll-fixed
4. Messages have bottom padding to account for input overlay

## Timing Guarantees

| Operation | Max Duration | Notes |
|-----------|--------------|-------|
| Optimistic UI | <16ms | Single render cycle |
| Scroll execution | <50ms | requestAnimationFrame |
| DB save queue | <5ms | Non-blocking |
| Stream start | <2000ms | Network dependent |
| Response render | Streaming | Continuous |
| Final save | <500ms | Background |

## Race Condition Prevention

### Problem: loadExistingChat vs sendMessage

**Old behavior:** `useEffect` watches `messages` array and could trigger load during send.

**New behavior:** 
- `isAddingMessageRef` guards prevent `loadExistingChat` during active send
- Event-driven scroll happens BEFORE any async operations
- URL navigation happens AFTER all operations complete

### Problem: Scroll target changes before scroll executes

**Old behavior:** `getLastUserMessageElement()` called inside async callback, DOM may have changed.

**New behavior:**
- Element reference captured synchronously in Phase 1
- Same reference passed through event to Phase 2
- No DOM querying during scroll execution
