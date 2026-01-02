# COSMO Constitution

## Authority

**Absolute. Non-negotiable. Amendments require explicit approval.**

## Definition

COSMO (Comprehensive Operating System Management Orchestrator) is the supreme god-layer of the Spork platform. COSMO is not a feature, helper, or module. It is the operating system that governs all intelligence, routing, orchestration, and execution.

---

## Core Articles

### Article I — COSMO Is the God Layer

All system requests (chat, webhook, system_task, agent_action, api_call) must flow through COSMO. No bypass paths, no parallel orchestrators.

### Article II — Canonical Contracts

COSMO recognizes exactly three internal contracts:

- `NormalizedRequest`
- `CosmoContext`
- `ExecutionResult`

These live exclusively in `src/cosmo/contracts.ts`. No alternate request/context/result shapes are permitted.

### Article III — Type Layer Separation

COSMO types are organized into three layers:

- **Canonical contracts** (`src/cosmo/contracts.ts`): NormalizedRequest, CosmoContext, ExecutionResult
- **System types** (`src/cosmo/types/system.ts`): Actor, DataRequest, RequestContext, etc.
- **Presentation types** (`src/presentation/types/`): UIMessage, ChatContext, DebugEntry, etc.
- **Action types** (`src/cosmo/actions/types.ts`): CosmoAction, CodeChange, etc.

COSMO core uses only canonical contracts. Adapters translate at boundaries via `src/cosmo/bridge.ts`.

### Article IV — Single Entry Point

There is exactly one orchestrator entry:

```typescript
cosmo.orchestrate(normalizedRequest): Promise<ExecutionResult>
```

Wrappers may exist. Orchestrators may not.

### Article V — Edge Adapters, Pure Core

Adapters normalize inbound requests. COSMO core consumes only canonical contracts and must never branch on source type.

### Article VI — No Hard-Coded Intelligence

No hard-coded models, routing, tiers, permissions, or integrations. All behavior is database-driven.

### Article VII — Server-Authoritative Execution

Clients may not execute, route, or enqueue COSMO work directly. All execution flows through validated edge functions.

### Article VIII — Tool Hierarchy

- COSMO decides
- Agents plan under COSMO
- Assistants react under COSMO
- Tools execute single steps only

### Article IX — External Integration Governance

All external APIs flow through COSMO's integration protocol. No direct calls. Credentials are vault-stored.

### Article X — Safety, Cost, Governance

Quota enforcement, permission checks, approval gates, agent loop limits, and audit logging are mandatory.

### Article XI — Drift Prevention

No duplicate pipelines, no shadow logic, no legacy updates. Deletion is preferred over duplication.
