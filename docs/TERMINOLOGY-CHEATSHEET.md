# Spork Terminology Cheat Sheet

> Quick reference. See [governance/08-TERMINOLOGY-GUIDE.md](governance/08-TERMINOLOGY-GUIDE.md) for details.

---

## Layers at a Glance

| # | Layer | Key Terms | Location |
|---|-------|-----------|----------|
| 1 | COSMO Core | Module, Action, Contract, Decision | `_shared/cosmo/` |
| 2 | COSMO Security | Quota Check, Loop Guard, Rate Limiter | `check-quota`, COSMO modules |
| 3 | User Auth | Auth Context, Protected Route, Session | `src/contexts/AuthContext.tsx` |
| 4 | System Auth | System User, System Session, Admin Auth | `src/contexts/SystemAuthContext.tsx` |
| 5 | Presentation | Page, Component, Dialog, Card | `src/pages/`, `src/components/` |
| 6 | Database | Table, RLS Policy, Migration, Trigger | `supabase/migrations/` |
| 7 | Edge Functions | Edge Function, Handler, Response | `supabase/functions/` |
| 8 | Hooks | Data Hook, Mutation Hook, Query Hook | `src/hooks/` |
| 9 | Admin | Admin Page, Admin Tab, Setting | `src/pages/admin/` |
| 10 | Integrations | Tool, Provider, Installation | `spork_tools`, `external_providers` |
| 11 | Launchpad | Internal Tool, Tool Definition, Sandbox | `src/pages/LaunchpadPage.tsx` |
| 12 | Queue | Request Queue, Batch, Priority | `cosmo_request_queue` |
| 13 | Storage | Bucket, Storage Policy, File | `app-media`, `knowledge-base` |
| 14 | Email | Template, Rule, Provider | `email_templates`, `email_rules` |
| 15 | Logging | Activity Log, Debug Log, Audit Log | `activity_log`, `cosmo_debug_logs` |
| 16 | Knowledge Base | Document, Chunk, Embedding | `knowledge_base` table |

---

## Quick Translations

| You Say | I Understand |
|---------|--------------|
| "function" | ❓ **Clarify**: COSMO Module / Edge Function / DB Function / Hook |
| "component" | ❓ **Clarify**: Page / UI Component / Dialog / Card |
| "type" | ❓ **Clarify**: Canonical Contract / System Type / Presentation Type / Action Type |
| "create backend for X" | Edge Function in `supabase/functions/` |
| "COSMO handles X" | COSMO Module in `_shared/cosmo/` |
| "add database table" | Migration via `supabase--migration` tool |
| "store user data" | Table with `user_id` + RLS policies |
| "add to admin" | Admin Page/Tab in `src/pages/admin/` |
| "fetch data" | Data Hook in `src/hooks/` |
| "save to database" | Mutation Hook + Edge Function |
| "add AI feature" | COSMO routing + Edge Function |
| "user authentication" | User Auth Layer (AuthContext) |
| "admin login" | System Auth Layer (SystemAuthContext) |
| "display X" | Presentation Component |
| "external API" | External Integration via COSMO protocol |

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| COSMO Module | `camelCase.ts` | `modelRouter.ts`, `intentAnalyzer.ts` |
| Edge Function | `kebab-case/` | `check-quota/`, `chat/` |
| Page | `PascalCasePage.tsx` | `DashboardPage.tsx` |
| Component | `PascalCase.tsx` | `ChatInput.tsx` |
| Hook | `useCamelCase.ts` | `useChats.ts` |
| Type File | `camelCase.ts` | `chat.ts`, `debug.ts` |
| Migration | `YYYYMMDDHHMMSS_description.sql` | `20240115120000_add_personas.sql` |

---

## Type Locations

| Type Category | Location | Purpose |
|---------------|----------|---------|
| Canonical Contracts | `src/cosmo/contracts.ts` | NormalizedRequest, CosmoContext, ExecutionResult |
| System Types | `src/cosmo/types/system.ts` | Actor, DataRequest, RequestContext |
| Action Types | `src/cosmo/actions/types.ts` | CosmoAction, CodeChange |
| Presentation Types | `src/presentation/types/` | UIMessage, ChatContext, DebugEntry |
| Bridge Functions | `src/cosmo/bridge.ts` | Layer boundary translations |

---

## Data Flow Rules

```
✅ ALLOWED
Presentation → Hook → Edge Function → Database
Presentation → Hook → Edge Function → COSMO → External API
Admin Page → admin-data Edge Function → Database (bypasses RLS)

❌ PROHIBITED  
Presentation → Database (direct)
Presentation → COSMO Core (direct execution)
Client → External API (bypass COSMO)
Hook → COSMO Module (import directly)
```

---

## Ambiguous Terms - Always Clarify

| Term | Could Mean |
|------|------------|
| "function" | COSMO Module, Edge Function, DB Function, Chat Function, Hook |
| "type" | Contract, System Type, Presentation Type, DB Type |
| "model" | AI Model, Data Model, DB Table |
| "action" | COSMO Action, User Action, DB Action |
| "context" | CosmoContext, AuthContext, ChatContext, React Context |
| "handler" | Edge Function Handler, Event Handler, Error Handler |
| "service" | Edge Function, COSMO Module, External Service |
| "store" | Database Table, React State, LocalStorage |

---

## Quick Decision Tree

```
Need to persist data?
  → Database table + RLS + Migration

Need server-side logic?
  → Edge Function in supabase/functions/

Need AI routing/decision?
  → COSMO Module in _shared/cosmo/

Need to display data?
  → Presentation Component + Data Hook

Need external API?
  → External Integration via COSMO protocol

Need admin-only access?
  → Admin Page + admin-data Edge Function
```

---

## File Location Quick Reference

| What You Need | Where It Goes |
|---------------|---------------|
| New page | `src/pages/` |
| Reusable UI | `src/components/` |
| Data fetching | `src/hooks/` |
| Server logic | `supabase/functions/` |
| COSMO logic | `supabase/functions/_shared/cosmo/` |
| DB schema | `supabase/migrations/` |
| UI types | `src/presentation/types/` |
| COSMO types | `src/cosmo/contracts.ts` |
| Admin pages | `src/pages/admin/` |

---

*Full terminology guide: [governance/08-TERMINOLOGY-GUIDE.md](governance/08-TERMINOLOGY-GUIDE.md)*
