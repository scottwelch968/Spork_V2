# Spork Layer Architecture Specification

## Authority

This document defines the canonical layer architecture for Spork. All development must respect layer boundaries and responsibilities defined herein.

---

## Architecture Overview

Spork is organized into **17 distinct layers**, grouped into **5 domains**:

| Domain | Layers |
|--------|--------|
| **Core Intelligence** | COSMO |
| **Security** | COSMO Security, User Security |
| **Application** | Presentation, Admin, Launchpad |
| **Infrastructure** | Database, Storage, Queue, Email, Webhook, Maintenance |
| **Services** | Integrations, Billing, Knowledge Base, Logging, Testing |

---

## Layer Dependency Rules

```
┌─────────────────────────────────────────────────────────────────┐
│                         COSMO                                    │
│                    (Supreme Orchestrator)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ COSMO Security│    │ User Security │    │   Logging     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │
        ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYERS                            │
│         Presentation  │  Admin  │  Launchpad                     │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYERS                                │
│   Integrations │ Billing │ Knowledge Base │ Testing              │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYERS                           │
│   Database │ Storage │ Queue │ Email │ Webhook │ Maintenance     │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency Direction**: Upper layers may depend on lower layers. Lower layers MUST NOT depend on upper layers.

---

## Layer Definitions

### 1. COSMO Layer (Core Intelligence)

**Purpose**: Supreme orchestrator and decision-making engine for all system operations.

**Responsibilities**:
- Intent analysis and action routing
- Model selection and prompt enhancement
- Function chain orchestration
- Response processing and formatting
- Cost-performance optimization

**Location**: 
- `src/cosmo/` (client contracts, bridge)
- `supabase/functions/_shared/cosmo/` (core logic)

**Contracts**:
- `NormalizedRequest` - Inbound request format
- `CosmoContext` - Orchestration state
- `ExecutionResult` - Outbound result format

**Key Rule**: All system decisions flow through COSMO. No bypass paths.

---

### 2. COSMO Security Layer

**Purpose**: System-level security enforcement for COSMO operations.

**Responsibilities**:
- Database RLS policy enforcement
- Edge function authorization
- Integration credential management (Vault)
- Request validation and sanitization
- Rate limiting and abuse prevention

**Location**:
- `supabase/migrations/` (RLS policies)
- `supabase/functions/_shared/cosmo/webhookVerifier.ts`
- Database triggers and constraints

**Key Rule**: Security is server-authoritative. Never trust client-side checks.

---

### 3. User Security Layer

**Purpose**: User authentication and session management for presentation layer.

**Responsibilities**:
- User authentication (email/password, OAuth)
- Session management and persistence
- Inactivity timeout enforcement (20 minutes)
- Protected route access control
- Profile management

**Location**:
- `src/contexts/AuthContext.tsx`
- `src/components/auth/`
- `src/components/ProtectedRoute.tsx`

**Key Rule**: Auth state must be verified server-side before granting access.

---

### 4. Presentation Layer

**Purpose**: User interface rendering and interaction handling.

**Responsibilities**:
- UI component rendering
- User input handling
- Display state management
- Theme and styling
- Responsive design

**Location**:
- `src/components/` (UI components)
- `src/presentation/types/` (display-only types)
- `src/pages/` (route pages)

**Types** (display-only):
- `UIMessage`, `ChatContext`, `DebugEntry`
- `QueuedRequest`, `SpaceChat`, `SporkEditorMessage`

**Key Rule**: Presentation layer handles display only. No business logic.

---

### 5. Admin Layer

**Purpose**: Administrative interface for system management.

**Responsibilities**:
- User management and role assignment
- System configuration
- Model and AI function management
- COSMO Control Center
- Maintenance operations
- Analytics and monitoring

**Location**:
- `src/pages/admin/`
- `src/components/admin/`
- `supabase/functions/admin-data/`

**Key Rule**: Admin operations route through `admin-data` edge function to bypass RLS.

---

### 6. Launchpad Layer

**Purpose**: Development environment for productivity tools and integrations.

**Responsibilities**:
- Tool/Assistant/Agent development IDE
- Code editing and preview
- Tool deployment and versioning
- Testing sandbox
- Template management

**Location**:
- `src/pages/launchpad/`
- `src/components/launchpad/`
- `supabase/functions/spork-tool-api/`

**Key Rule**: Tools developed in Launchpad execute within COSMO's permission boundary.

---

### 7. Database Layer

**Purpose**: Data persistence and relational integrity.

**Responsibilities**:
- Schema management (89 tables)
- Data CRUD operations
- Referential integrity
- Indexing and performance
- Migration management

**Location**:
- `supabase/migrations/`
- `src/integrations/supabase/types.ts` (auto-generated)

**Tables**: 89 tables with RLS enabled across all domains.

**Key Rule**: All tables must have RLS enabled. No exceptions.

---

### 8. Storage Layer

**Purpose**: File and media storage management.

**Responsibilities**:
- File upload/download
- Bucket management
- Access control policies
- CDN optimization

**Location**:
- Supabase Storage buckets
- Storage RLS policies in migrations

**Buckets**:
- `app-media` (public) - AI-generated assets
- `knowledge-base` (private) - User documents
- `user-files` (public) - User uploads
- `template-images` (public) - System templates
- `appstore-images` (public) - Tool icons

**Key Rule**: Private buckets require authenticated access via RLS.

---

### 9. Queue Layer

**Purpose**: Asynchronous request processing and batching.

**Responsibilities**:
- Request queuing with priority
- Batch processing for similar requests
- Retry logic with exponential backoff
- Queue monitoring and management

**Location**:
- `supabase/functions/_shared/cosmo/queueManager.ts`
- `supabase/functions/_shared/cosmo/batchManager.ts`
- `supabase/functions/cosmo-enqueue/`
- `cosmo_request_queue` table

**Key Rule**: Queue writes are server-authoritative via `cosmo-enqueue`.

---

### 10. Email Layer

**Purpose**: Email infrastructure and notification delivery.

**Responsibilities**:
- Email template management
- Rule-based email triggers
- Provider integration (Resend)
- Delivery tracking and logging

**Location**:
- `supabase/functions/send-email/`
- `email_templates`, `email_rules`, `email_logs` tables

**Key Rule**: Emails sent only via edge functions, never client-side.

---

### 11. Webhook Layer

**Purpose**: External event ingestion and processing.

**Responsibilities**:
- Webhook signature verification
- Provider-specific handlers (GitHub, Stripe)
- Event routing to COSMO
- Replay attack prevention

**Location**:
- `supabase/functions/cosmo-webhook/`
- `supabase/functions/_shared/cosmo/webhookVerifier.ts`

**Supported Providers**: GitHub, Stripe, Custom HMAC

**Key Rule**: All webhooks verified before processing. 401 on failure.

---

### 12. Maintenance Layer

**Purpose**: System health and scheduled operations.

**Responsibilities**:
- Scheduled job execution (pg_cron)
- Cleanup operations
- Health monitoring
- Database maintenance

**Location**:
- `supabase/functions/cleanup-*`
- `scheduled_jobs`, `cleanup_job_results` tables
- Admin Maintenance UI

**Jobs**: sync-openrouter-models, cleanup-expired-images, cleanup-orphaned-files

**Key Rule**: Maintenance jobs run server-side via pg_cron.

---

### 13. Integrations Layer

**Purpose**: External service connections and API management.

**Responsibilities**:
- OAuth flow management
- Credential storage (Vault)
- Provider adapters (Slack, Google, Notion, HubSpot)
- Connection status tracking

**Location**:
- `supabase/functions/_shared/cosmo/externalIntegration.ts`
- `supabase/functions/external-oauth-*`
- `external_providers`, `user_integrations`, `workspace_integrations` tables

**Key Rule**: All external calls flow through COSMO validation.

---

### 14. Billing Layer

**Purpose**: Subscription management and usage tracking.

**Responsibilities**:
- Subscription tier management
- Usage tracking and metering
- Quota enforcement
- Payment webhook handling

**Location**:
- `supabase/functions/check-quota/`
- `supabase/functions/track-usage/`
- `subscription_tiers`, `user_subscriptions`, `usage_tracking` tables

**Key Rule**: Quota checked before every COSMO operation.

---

### 15. Knowledge Base Layer

**Purpose**: Document processing and contextual retrieval.

**Responsibilities**:
- Document upload and parsing
- Content chunking
- Context injection for AI
- Citation support

**Location**:
- `supabase/functions/knowledge-base/`
- `knowledge_base` table
- `knowledge-base` storage bucket

**Key Rule**: Knowledge base is workspace-scoped, not user-scoped.

---

### 16. Logging Layer

**Purpose**: Structured logging and error handling.

**Responsibilities**:
- Structured log formatting
- Trace ID correlation
- Error classification (CosmoError)
- Debug log persistence
- Activity logging

**Location**:
- `src/cosmo/logger.ts` (client)
- `supabase/functions/_shared/edgeLogger.ts` (edge)
- `cosmo_debug_logs`, `activity_log` tables

**Error Codes**: `RATE_LIMITED`, `QUOTA_EXCEEDED`, `MODEL_UNAVAILABLE`, `PERMISSION_DENIED`, etc.

**Key Rule**: All errors use `createCosmoError()`. No raw `throw new Error()`.

---

### 17. Testing Layer

**Purpose**: Test execution and CI/CD integration.

**Responsibilities**:
- Test result collection
- Coverage reporting
- CI/CD webhook integration
- Test dashboard display

**Location**:
- `supabase/functions/report-test-results/`
- `test_runs` table
- `src/tests/` (test files)

**Key Rule**: Test code is devDependencies-only, never in production builds.

---

## Cross-Layer Communication

### Allowed Communication Patterns

| From Layer | To Layer | Via |
|------------|----------|-----|
| Presentation | COSMO | Edge functions |
| COSMO | Database | Supabase client (service role) |
| COSMO | Integrations | External integration protocol |
| Admin | All | `admin-data` edge function |
| Webhook | COSMO | `cosmo-webhook` |
| Queue | COSMO | `cosmo-enqueue` |

### Prohibited Patterns

- ❌ Presentation → Database (direct writes)
- ❌ Presentation → Integrations (direct API calls)
- ❌ Any Layer → COSMO Config Tables (client writes)
- ❌ Lower Layer → Upper Layer (reverse dependency)

---

## Layer Boundaries Enforcement

### Compile-Time

- TypeScript import restrictions via `tsconfig.json` paths
- Separate type files per layer

### Runtime

- RLS policies on all database tables
- Edge function authorization checks
- COSMO permission validation

### Review-Time

- Architecture compliance in code review
- COSMO Coding Checklist verification

---

## Adding New Functionality

When adding new features:

1. **Identify Layer**: Determine which layer owns the functionality
2. **Respect Boundaries**: Use allowed communication patterns only
3. **Follow Contracts**: Use canonical types for the target layer
4. **Add Security**: Include RLS policies, validation, error handling
5. **Document**: Update relevant architecture documentation

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial layer architecture specification |
