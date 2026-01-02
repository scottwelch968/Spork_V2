# Amendment 001: COSMO Action Layer Architecture

**Status:** PROPOSED  
**Date:** 2025-12-15  
**Author:** System Architect  
**Amends:** COSMO Constitution Articles IV, V, VIII

---

## Purpose

This amendment establishes the **COSMO Action Layer** as the formal communication protocol for how COSMO delivers instructions to all system layers. While the COSMO Constitution defines WHAT COSMO does (orchestration, routing, execution), this amendment defines HOW COSMO communicates those decisions.

## Problem Statement

Current architecture has implicit communication patterns between COSMO and its consumers:
- No formal instruction format for cross-layer communication
- Presentation layer types mixed with system action types
- No standardized way for COSMO to instruct database, UI, or external layers
- Legacy types conflate "what to display" with "what action to take"

## Scope

This amendment covers:
1. Definition of the Action Layer as COSMO's communication protocol
2. `CosmoAction` interface specification
3. Target layer definitions and boundaries
4. File structure requirements
5. Migration path for existing types

---

## Definitions

### Action Layer
The communication protocol through which COSMO delivers typed instructions to all system layers. The Action Layer is NOT an orchestrator—it is a message format and delivery mechanism controlled by COSMO.

### CosmoAction
A typed instruction envelope containing:
- What action to perform
- Which layer should handle it
- What payload to deliver
- Trace context for debugging

### Target Layers
Recipients of COSMO actions:
- **Presentation**: UI rendering, display updates, user feedback
- **Database**: Persistence operations, queries, mutations
- **System**: Function execution, internal operations
- **External**: Third-party API calls, integrations

### Presentation Layer
An **output function** of COSMO that handles only display concerns. Presentation receives instructions from COSMO but never initiates system actions. It is explicitly NOT a COSMO function—it is a consumer of COSMO output.

---

## Architecture

### Principle: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    COSMO (God Layer)                        │
│  src/cosmo/                                                 │
│  ├── contracts.ts      (Canonical types)                    │
│  ├── actions/          (Action Layer - NEW)                 │
│  │   ├── types.ts      (CosmoAction interface)              │
│  │   ├── dispatcher.ts (Action routing)                     │
│  │   └── handlers/     (Layer-specific handlers)            │
│  ├── orchestrator.ts   (Entry point)                        │
│  └── [other modules]                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ CosmoAction messages
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Output Layers                            │
├─────────────────────────────────────────────────────────────┤
│  Presentation (src/presentation/)                           │
│  ├── types/            (Display-only types)                 │
│  │   ├── chat.ts       (UIMessage, ChatContext)             │
│  │   ├── queue.ts      (QueueDisplay, QueueStats)           │
│  │   ├── debug.ts      (DebugEntry, DebugFilters)           │
│  │   └── [others]                                           │
│  └── handlers/         (Action handlers for UI)             │
├─────────────────────────────────────────────────────────────┤
│  Database (via edge functions)                              │
│  External (via integration protocol)                        │
└─────────────────────────────────────────────────────────────┘
```

### CosmoAction Interface

```typescript
// src/cosmo/actions/types.ts

/**
 * Target layers that can receive COSMO actions
 */
export type ActionTarget = 
  | 'presentation'  // UI rendering
  | 'database'      // Persistence operations
  | 'system'        // Internal function execution
  | 'external';     // Third-party integrations

/**
 * Unified action instruction from COSMO to any layer
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
  context?: {
    userId?: string;
    workspaceId?: string;
    chatId?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
  
  /** Timestamp of action creation */
  createdAt: string;
}
```

### Layer-Specific Action Types

#### Presentation Actions
```typescript
// Actions COSMO sends to the UI layer
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
```

#### Database Actions
```typescript
// Actions COSMO sends to the database layer
export type DatabaseActionType =
  | 'persist:message'        // Save message to database
  | 'persist:chat'           // Save/update chat
  | 'persist:usage'          // Log usage metrics
  | 'query:history'          // Fetch chat history
  | 'query:context'          // Fetch context data
  | 'delete:message'         // Remove message
  | 'update:metadata';       // Update message metadata
```

#### System Actions
```typescript
// Actions COSMO sends to internal systems
export type SystemActionType =
  | 'execute:function'       // Run a chat function
  | 'execute:chain'          // Run function chain
  | 'route:model'            // Route to AI model
  | 'enhance:prompt'         // Enhance user prompt
  | 'analyze:intent'         // Analyze user intent
  | 'validate:quota'         // Check usage quota
  | 'log:debug';             // Log debug information
```

#### External Actions
```typescript
// Actions COSMO sends to external services
export type ExternalActionType =
  | 'call:api'               // Call external API
  | 'auth:refresh'           // Refresh OAuth token
  | 'webhook:send'           // Send webhook
  | 'integration:invoke';    // Invoke integration
```

---

## Rules

### Rule 1: All COSMO Functions Live Under `src/cosmo/`
The Action Layer is a COSMO function. All action types, dispatcher, and handlers live under `src/cosmo/actions/`.

### Rule 2: Presentation is an Output Layer, Not a COSMO Function
Presentation types live in `src/presentation/types/`. Presentation is a consumer of COSMO output—it receives actions but never initiates system operations.

### Rule 3: Actions Flow One Direction
COSMO → Output Layers. Output layers do not send actions to COSMO. User interactions trigger new requests through the standard entry point (`orchestrate()`).

### Rule 4: Presentation Types Are Display-Only
Types in `src/presentation/types/` define:
- ✅ How data appears in the UI
- ✅ UI state management shapes
- ✅ Display formatting options
- ❌ NOT system operations
- ❌ NOT action definitions
- ❌ NOT request/response contracts

### Rule 5: Bridge Translates at Boundaries
`src/cosmo/bridge.ts` converts between:
- Canonical COSMO types ↔ Presentation types
- Action payloads ↔ Display formats
- No direct imports from `src/presentation/` in COSMO core

### Rule 6: Legacy Migration Complete ✅
`src/cosmo/legacy/` has been deleted. All types migrated to:
- System types → `src/cosmo/types/system.ts`
- Presentation types → `src/presentation/types/`
- Action types → `src/cosmo/actions/types.ts`

---

## File Structure

```
src/
├── cosmo/                          # God Layer
│   ├── contracts.ts                # Canonical types (existing)
│   ├── bridge.ts                   # Boundary translation (existing)
│   ├── orchestrator.ts             # Entry point (existing)
│   ├── actions/                    # NEW: Action Layer
│   │   ├── types.ts                # CosmoAction, ActionTarget, action types
│   │   ├── dispatcher.ts           # Routes actions to handlers
│   │   ├── index.ts                # Barrel export
│   │   └── handlers/               # Layer-specific handlers
│   │       ├── presentation.ts     # Handles presentation actions
│   │       ├── database.ts         # Handles database actions
│   │       ├── system.ts           # Handles system actions
│   │       └── external.ts         # Handles external actions
│   └── legacy/                     # Quarantined deprecated types
│       └── [Legacy* types only]
│
├── presentation/                   # Output Layer
│   ├── types/                      # Display-only types
│   │   ├── chat.ts                 # UIMessage, ChatContext, MessageDisplay
│   │   ├── queue.ts                # QueueDisplay, QueueStats
│   │   ├── debug.ts                # DebugEntry, DebugFilters
│   │   ├── editor.ts               # EditorMessage, CodeDisplay
│   │   ├── space.ts                # SpaceChatDisplay
│   │   ├── response.ts             # ResponseDisplay, ChunkDisplay
│   │   └── index.ts                # Barrel export
│   └── handlers/                   # Optional: presentation action handlers
│       └── actionHandler.ts        # Processes presentation actions
```

---

## Migration Path

### Phase 1: Create Action Layer Foundation ✅ COMPLETE
1. ✅ Created `src/cosmo/actions/types.ts` with `CosmoAction` interface
2. ✅ Created `src/cosmo/actions/index.ts` barrel export
3. ✅ Updated governance documentation

### Phase 2: Create Presentation Layer ✅ COMPLETE
1. ✅ Created `src/presentation/types/` directory
2. ✅ Moved display-only types:
   - `src/presentation/types/chat.ts` (ChatContext, UIMessage, ChatConfig, MessageHeaderMessage)
   - `src/presentation/types/queue.ts` (QueuedRequest, QueueStats, TimeSeriesPoint)
   - `src/presentation/types/debug.ts` (DebugEntry, DebugFilters, etc.)
   - `src/presentation/types/spaceChat.ts` (SpaceChat, SpaceChatMessage)
   - `src/presentation/types/editor.ts` (SporkEditorMessage)
   - `src/presentation/types/response.ts` (ResponseChunk, ModelSelectionUI, etc.)
3. ✅ Created barrel export `src/presentation/types/index.ts`

### Phase 3: Split Mixed Types ✅ COMPLETE
1. ✅ Created `src/cosmo/types/system.ts` with system types:
   - Actor, ActorType, DataRequest, RequestContext, DisplayMode
   - Attachment, ResponseChunk, ResponseComplete, etc.
2. ✅ Moved `CodeChange` to `src/cosmo/actions/types.ts`
3. ✅ Moved `SporkEditorMessage` to `src/presentation/types/editor.ts`

### Phase 4: Update Imports ✅ COMPLETE
1. ✅ Updated all 30 consumer files to import from new locations
2. ✅ Updated `src/cosmo/bridge.ts` to import from `@/cosmo/types/system`
3. ✅ Updated `src/cosmo/index.ts` re-exports

### Phase 5: Cleanup ✅ COMPLETE
1. ✅ Deleted all legacy files (types.ts, chatTypes.ts, debugTypes.ts, queueTypes.ts, spaceChatTypes.ts, editorChatTypes.ts, index.ts)
2. ✅ Removed `src/cosmo/legacy/` directory
3. ✅ Updated SECURITY-VERIFICATION.md
4. ✅ Updated COSMO Constitution Article III
5. ✅ Updated COSMO Coding Checklist

---

## Compliance

This amendment:
- ✅ Preserves COSMO as God Layer (Article I)
- ✅ Maintains canonical contracts in `src/cosmo/contracts.ts` (Article II)
- ✅ Clarifies legacy quarantine purpose (Article III)
- ✅ Keeps single entry point via `orchestrate()` (Article IV)
- ✅ Defines clean adapter pattern for presentation (Article V)
- ✅ Does not hard-code intelligence (Article VI)
- ✅ Maintains server-authoritative execution (Article VII)
- ✅ Clarifies tool hierarchy with Action Layer (Article VIII)
- ✅ Supports external integration protocol (Article IX)

---

## Approval

- [ ] Architecture Review
- [ ] Constitution Compliance Verified
- [ ] Implementation Plan Approved

---

## Changelog

| Date | Change |
|------|--------|
| 2025-12-15 | Initial proposal |
