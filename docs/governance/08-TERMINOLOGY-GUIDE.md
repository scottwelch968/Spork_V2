# Spork Development Terminology Guide

## Purpose

This document establishes the canonical vocabulary for all Spork development communication. When discussing components, features, or changes, use these terms to ensure precise understanding.

**Authority Level**: Required reference for all development discussions.

---

## Layer 1: COSMO Core (God Layer)

| Term | Definition | Example |
|------|------------|---------|
| **COSMO Module** | Server-side logic file in orchestration pipeline | `intentAnalyzer.ts`, `modelRouter.ts` |
| **COSMO Action** | Typed instruction COSMO sends to other layers | `CosmoAction` with `targetLayer`, `actionType` |
| **COSMO Contract** | Canonical interface for orchestration | `NormalizedRequest`, `CosmoContext`, `ExecutionResult` |
| **COSMO Decision** | Routing/selection logic outcome | Intent detection result, model selection |
| **COSMO Pipeline** | Sequence of modules processing a request | Intent → Function → Model → Prompt → Response |
| **COSMO Config** | Database-driven settings | `system_settings.cosmo_routing_config` |

### Translation Examples
- "Create a COSMO function for X" → Create a new module in `supabase/functions/_shared/cosmo/`
- "Add COSMO logic for Y" → Add decision logic to appropriate COSMO module
- "COSMO should handle Z" → Route Z through `orchestrator.ts` pipeline

---

## Layer 2: COSMO Security

| Term | Definition | Example |
|------|------------|---------|
| **Quota Check** | Usage limit validation | `check-quota` edge function |
| **Permission Validator** | Access rights verification | Permission check in COSMO module |
| **Loop Guard** | Agent iteration limiter | `AGENT_MAX_ITERATIONS` enforcement |
| **Rate Limiter** | Request frequency control | Requests per minute check |
| **Approval Gate** | Human-in-loop checkpoint | Cost threshold approval |

### Translation Examples
- "Add security to X" → Add permission validation in COSMO Security layer
- "Check if user can Y" → Create/use Permission Validator
- "Prevent abuse of Z" → Implement Rate Limiter or Loop Guard

---

## Layer 3: User Security (Authentication)

| Term | Definition | Example |
|------|------------|---------|
| **Auth Context** | React context for user session | `AuthContext`, `useAuth()` |
| **Auth Provider** | Context wrapper component | `AuthProvider` in layout |
| **Protected Route** | Route requiring authentication | `ProtectedRoute` component |
| **Session** | Active user authentication state | Supabase auth session |
| **Auth Hook** | React hook for auth operations | `useAuth()` |
| **System Auth** | Admin authentication (separate) | `SystemAuthContext` |

### Translation Examples
- "User needs to be logged in for X" → Wrap with `ProtectedRoute`
- "Check if user is authenticated" → Use `useAuth()` hook
- "Admin login for Y" → Use `SystemAuthContext`

---

## Layer 4: Presentation Layer

| Term | Definition | Example |
|------|------------|---------|
| **Page** | Top-level route component | `src/pages/Dashboard.tsx` |
| **Component** | Reusable UI element | `src/components/ui/Button.tsx` |
| **Layout** | Page structure wrapper | `AppLayout`, `AdminLayout` |
| **UI Type** | Display-only TypeScript interface | `UIMessage`, `ChatContext` |
| **Feature Component** | Domain-specific component | `src/components/chat/ChatInput.tsx` |
| **Dialog** | Modal overlay component | `CreatePersonaDialog` |
| **Form** | Data input component | `PersonaForm` |
| **Card** | Content container | `ChatCard`, `ModelCard` |
| **Panel** | Sidebar/content area | `RightSidebar`, `DebugPanel` |
| **Tab** | Tabbed interface section | `OverviewTab`, `IntentsTab` |

### Translation Examples
- "Create a UI for X" → Create Page + Components in presentation layer
- "Show Y to user" → Create/modify Component
- "Add a form for Z" → Create Form component with validation
- "Display X in a card" → Create Card component
- "Add X tab" → Create Tab component in appropriate parent

---

## Layer 5: Database Layer

| Term | Definition | Example |
|------|------------|---------|
| **Table** | Database table | `chats`, `messages`, `ai_models` |
| **RLS Policy** | Row-level security rule | `Users can view own chats` policy |
| **Migration** | Schema change SQL | Via `supabase--migration` tool |
| **Constraint** | Data integrity rule | `NOT NULL`, `UNIQUE`, `CHECK` |
| **Trigger** | Automatic database action | `update_updated_at_column()` |
| **Function (DB)** | PostgreSQL stored function | `handle_new_user()` |
| **Index** | Query optimization structure | `idx_messages_chat_id` |
| **Foreign Key** | Table relationship | `messages.chat_id → chats.id` |
| **Enum** | Constrained value type | `model_category`, `content_type` |

### Translation Examples
- "Store X in database" → Create Table with RLS policies
- "Add field Y to Z" → Create Migration adding column
- "Secure table X" → Add/modify RLS Policy
- "Auto-update timestamp" → Create Trigger
- "Link X to Y" → Add Foreign Key constraint

---

## Layer 6: Edge Functions (Backend)

| Term | Definition | Example |
|------|------------|---------|
| **Edge Function** | Serverless backend function | `supabase/functions/chat/` |
| **Handler** | Request processing logic | Main `index.ts` in function folder |
| **Shared Utility** | Reusable backend code | `supabase/functions/_shared/` |
| **Edge Logger** | Backend logging utility | `edgeLogger.ts` |
| **CORS Handler** | Cross-origin request handling | `corsHeaders` in shared |
| **Service Client** | Supabase admin client | `createClient()` with service role |

### Translation Examples
- "Create backend for X" → Create Edge Function
- "API endpoint for Y" → Create Edge Function with Handler
- "Reusable backend logic" → Add to Shared Utility
- "Log backend operation" → Use Edge Logger

---

## Layer 7: React Hooks

| Term | Definition | Example |
|------|------------|---------|
| **Data Hook** | Server state management | `useChats()`, `useModels()` |
| **Query Hook** | TanStack Query data fetching | `useQuery()` wrapper |
| **Mutation Hook** | TanStack Query data modification | `useMutation()` wrapper |
| **State Hook** | Local component state | `useState()`, `useReducer()` |
| **Effect Hook** | Side effect management | `useEffect()` |
| **Context Hook** | Context consumption | `useAuth()`, `useChat()` |
| **Custom Hook** | Reusable logic encapsulation | `useDebounce()`, `useLocalStorage()` |

### Translation Examples
- "Fetch X data" → Create/use Data Hook with Query
- "Save Y to server" → Use Mutation Hook
- "Share state across Z" → Create Context + Context Hook
- "Reusable logic for X" → Create Custom Hook

---

## Layer 8: Admin Layer

| Term | Definition | Example |
|------|------------|---------|
| **Admin Page** | Admin-only route | `src/pages/admin/AdminModels.tsx` |
| **Admin Tab** | Section within admin page | `UsersTab`, `ModelsTab` |
| **Admin Hook** | Admin-specific data hook | `useAdminUsers()` |
| **Admin Action** | Administrative operation | User role change, model config |
| **Admin Layout** | Admin page wrapper | `AdminLayout` |
| **System User** | Admin account (separate auth) | `system_users` table |

### Translation Examples
- "Admin needs to manage X" → Create Admin Page/Tab
- "Admin-only operation Y" → Create Admin Action via `admin-data` edge function
- "Admin dashboard for Z" → Create Admin Page with Tabs

---

## Layer 9: Integrations Layer

| Term | Definition | Example |
|------|------------|---------|
| **Provider** | External service definition | `external_providers` table entry |
| **Adapter** | Provider-specific API wrapper | `slackAdapter`, `googleAdapter` |
| **User Integration** | User's connected service | `user_integrations` table |
| **Workspace Integration** | Team's connected service | `workspace_integrations` table |
| **OAuth Flow** | Authentication handshake | `external-oauth-init`, `external-oauth-callback` |
| **Integration Call** | Authenticated external request | Via `external-integration-call` |

### Translation Examples
- "Connect to X service" → Add Provider + Adapter
- "User links their Y account" → Implement OAuth Flow
- "Call X API" → Use Integration Call through COSMO

---

## Layer 10: Launchpad (App Store)

| Term | Definition | Example |
|------|------------|---------|
| **Tool** | Single-function capability | Image generator, web search |
| **Assistant** | Persona-based conversational AI | Custom chat assistant |
| **Agent** | Autonomous multi-step executor | Planning agent |
| **Tool Package** | Tool definition + code | `spork_tools` entry |
| **Tool Installation** | User/workspace tool activation | `spork_tool_installations` |
| **Tool Manifest** | Tool metadata & capabilities | JSON config in tool definition |
| **Tool API** | Runtime interface for tools | `SporkToolAPI` |

### Translation Examples
- "Create an app for X" → Create Tool Package
- "Add capability Y" → Create Tool with manifest
- "Install Z for workspace" → Create Tool Installation

---

## Layer 11: Queue Layer

| Term | Definition | Example |
|------|------------|---------|
| **Queue Entry** | Pending request record | `cosmo_request_queue` row |
| **Queue Manager** | Queue operations handler | `queueManager.ts` |
| **Priority** | Request urgency level | `critical`, `high`, `normal`, `low` |
| **Worker** | Queue processor | Queue processing in orchestrator |
| **Batch** | Grouped similar requests | `cosmo_request_batches` |
| **Batch Manager** | Batch operations handler | `batchManager.ts` |

### Translation Examples
- "Queue X for processing" → Create Queue Entry via `cosmo-enqueue`
- "Process queued requests" → Worker logic in COSMO
- "Group similar requests" → Use Batch Manager

---

## Layer 12: Storage Layer

| Term | Definition | Example |
|------|------------|---------|
| **Bucket** | Storage container | `app-media`, `knowledge-base` |
| **Object** | Stored file | Image, document in bucket |
| **Storage Policy** | Access rules for bucket | RLS on `storage.objects` |
| **Upload Handler** | File upload logic | Upload edge function |
| **Storage Path** | File location format | `{user_id}/{filename}` |

### Translation Examples
- "Store files for X" → Create/use Bucket with Policy
- "Upload Y" → Use Upload Handler
- "User's files" → Store in user-scoped Storage Path

---

## Layer 13: Email Layer

| Term | Definition | Example |
|------|------------|---------|
| **Email Provider** | Email service config | `email_providers` entry |
| **Email Template** | Reusable email format | `email_templates` entry |
| **Email Rule** | Automated send trigger | `email_rules` entry |
| **Email Log** | Send history record | `email_logs` entry |
| **Event Type** | Triggering action | `user.signup`, `workspace.invite` |

### Translation Examples
- "Send email when X" → Create Email Rule + Template
- "Email template for Y" → Create Email Template
- "Track email delivery" → Use Email Log

---

## Layer 14: Logging & Observability

| Term | Definition | Example |
|------|------------|---------|
| **Activity Log** | User action record | `activity_log` entry |
| **Debug Log** | COSMO operation trace | `cosmo_debug_logs` entry |
| **Audit Log** | Security-relevant event | `system_audit_log` entry |
| **Logger** | Logging utility | `logger.ts`, `edgeLogger.ts` |
| **Trace ID** | Request correlation ID | UUID through pipeline |
| **Log Level** | Severity indicator | `info`, `warn`, `error`, `debug` |

### Translation Examples
- "Log user action X" → Create Activity Log entry
- "Debug COSMO decision" → Check Debug Log
- "Track security event" → Create Audit Log entry

---

## Layer 15: Billing Layer

| Term | Definition | Example |
|------|------------|---------|
| **Subscription Tier** | Plan definition | `subscription_tiers` entry |
| **User Subscription** | User's active plan | `user_subscriptions` entry |
| **Usage Tracking** | Consumption record | `usage_tracking` entry |
| **Usage Event** | Single usage instance | `usage_events` entry |
| **Quota** | Usage limit | Requests per period |
| **Credit** | Usage currency | Purchased/allocated credits |

### Translation Examples
- "Check user's plan" → Query User Subscription
- "Track X usage" → Create Usage Event
- "Enforce limits" → Check Quota via `check-quota`

---

## Layer 16: Knowledge Base Layer

| Term | Definition | Example |
|------|------------|---------|
| **Document** | Uploaded knowledge file | `knowledge_base` entry |
| **Chunk** | Document segment for retrieval | Stored in `chunks` JSONB |
| **Knowledge Query** | Document search | RAG retrieval |
| **Document Parser** | Content extraction | PDF/DOCX processing |

### Translation Examples
- "Upload document for AI" → Create Document entry
- "AI should know about X" → Add to Knowledge Base
- "Search documents" → Use Knowledge Query

---

## Layer 17: Testing & Maintenance

| Term | Definition | Example |
|------|------------|---------|
| **Test Suite** | Collection of tests | Vitest test files |
| **Test Run** | Execution record | `test_runs` entry |
| **Scheduled Job** | Cron task definition | `cron.job` entry |
| **Cleanup Job** | Maintenance task | `cleanup-orphaned-files` |
| **Job Result** | Execution outcome | `cleanup_job_results` entry |
| **Health Check** | System status verification | Maintenance endpoint |

### Translation Examples
- "Test X functionality" → Create Test Suite
- "Run Y daily" → Create Scheduled Job
- "Clean up Z" → Create Cleanup Job

---

## Quick Reference: Common Request Translations

| You Say | I Understand |
|---------|--------------|
| "Create a function for X" | **Clarify**: COSMO Module, Edge Function, DB Function, or React Hook? |
| "Add X to the database" | Create Table + RLS + Migration |
| "Show X to users" | Create Presentation Component/Page |
| "Backend for X" | Create Edge Function |
| "Fetch X data" | Create Data Hook (Query) |
| "Save X" | Create Mutation Hook + Edge Function if needed |
| "Admin manages X" | Create Admin Page/Tab + Admin Hook |
| "Connect to X service" | Create Integration Provider + Adapter |
| "COSMO handles X" | Add logic to COSMO Module in pipeline |
| "Secure X" | Add RLS Policy + Permission Validator |
| "Log X" | Use appropriate Logger (Activity/Debug/Audit) |
| "Schedule X" | Create Scheduled Job |
| "Test X" | Create Test Suite |

---

## Confirmation Format

When requests are ambiguous, I will confirm using this format:

```
I understand you want: [interpreted request]

This involves:
- [Layer]: [Component Type] - [specific action]
- [Layer]: [Component Type] - [specific action]

Files affected:
- [file path] - [change description]

Is this correct?
```

---

## Cross-Layer Communication Patterns

### Allowed Patterns
- **Presentation → Hook → Edge Function → Database**
- **COSMO Module → COSMO Module** (within pipeline)
- **Edge Function → COSMO Core** (delegation)
- **Any Layer → Logger**

### Prohibited Patterns
- **Presentation → Database** (direct queries)
- **Presentation → COSMO Core** (client-side orchestration)
- **Edge Function → Edge Function** (direct calls)
- **Any Layer → Reserved Schemas** (auth, storage internals)

---

## Naming Conventions

| Layer | File Pattern | Example |
|-------|--------------|---------|
| COSMO Module | `camelCase.ts` | `intentAnalyzer.ts` |
| Edge Function | `kebab-case/index.ts` | `check-quota/index.ts` |
| Page | `PascalCase.tsx` | `Dashboard.tsx` |
| Component | `PascalCase.tsx` | `ChatInput.tsx` |
| Hook | `use[Name].ts(x)` | `useChats.ts` |
| UI Type | `PascalCase` | `UIMessage`, `ChatContext` |
| Table | `snake_case` | `chat_messages` |
| RLS Policy | `"Descriptive sentence"` | `"Users can view own chats"` |
