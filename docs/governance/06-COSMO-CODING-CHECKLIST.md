# COSMO Coding Checklist

**Before final output, all applicable items must be YES.**

Any output that fails this checklist is invalid by definition.

---

## Contracts

| Check | Requirement |
|-------|-------------|
| ☐ | Canonical contracts only (`NormalizedRequest`, `CosmoContext`, `ExecutionResult`) |
| ☐ | Single source: `src/cosmo/contracts.ts` |

## Type Layer Separation

| Check | Requirement |
|-------|-------------|
| ☐ | Canonical contracts in `src/cosmo/contracts.ts` |
| ☐ | System types in `src/cosmo/types/system.ts` |
| ☐ | Presentation types in `src/presentation/types/` |
| ☐ | Action types in `src/cosmo/actions/types.ts` |
| ☐ | Bridge functions used at boundaries (`src/cosmo/bridge.ts`) |

## Entry Point

| Check | Requirement |
|-------|-------------|
| ☐ | One orchestrator only: `cosmo.orchestrate()` |
| ☐ | Wrappers are thin (no orchestration logic) |

## DB-Driven

| Check | Requirement |
|-------|-------------|
| ☐ | No hard-coded models or routing |
| ☐ | Registry tables enforced (`ai_models`, `system_settings`, etc.) |

## Server Authority

| Check | Requirement |
|-------|-------------|
| ☐ | No client-side COSMO execution |
| ☐ | Edge enforcement present |
| ☐ | All writes go through validated edge functions |

## Integrations

| Check | Requirement |
|-------|-------------|
| ☐ | COSMO protocol used for all external APIs |
| ☐ | Credentials secured in Supabase Vault |
| ☐ | No direct external API calls from client |

## Safety

| Check | Requirement |
|-------|-------------|
| ☐ | Quotas enforced (fail-closed) |
| ☐ | Agent loop limits enforced (max 10 iterations) |
| ☐ | Webhooks verified (HMAC signature) |

## Errors & Observability

| Check | Requirement |
|-------|-------------|
| ☐ | Structured errors returned (`message`, `code`, `httpStatus`, `details`, `hint`) |
| ☐ | Metadata logged before [DONE] signal |

## Drift Prevention

| Check | Requirement |
|-------|-------------|
| ☐ | Orphaned logic removed |
| ☐ | No parallel paths or shadow orchestrators |
| ☐ | Deletion preferred over duplication |
