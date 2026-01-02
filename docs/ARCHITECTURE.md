# SPORK Architecture & Development Guide

> **Last Updated:** December 2024  
> **Version:** 2.0 - Post-COSMO Refactor

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [System Architecture](#system-architecture)
4. [Authentication Architecture](#authentication-architecture)
5. [Data Structure Patterns](#data-structure-patterns)
6. [Frontend Architecture](#frontend-architecture)
7. [Edge Function Patterns](#edge-function-patterns)
8. [Database Tables Reference](#database-tables-reference)
9. [Branding & Design Standards](#branding-design-standards)
10. [Critical Implementation Rules](#critical-implementation-rules)

---

## Overview

SPORK is a unified AI platform providing access to 100+ premium AI models through a single interface. The architecture follows a **function-first, database-driven** approach where behavior is configured through database tables rather than hardcoded in application code.

> **Conceptual Foundation**: Before diving into implementation details, review [AI-DEVELOPMENT.md](./AI-DEVELOPMENT.md) for the engineering-grade definitions of AI Tools, Assistants, and Agents that underpin SPORK's architecture.

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| COSMO as orchestration layer | Single entry point for all AI interactions with intelligent routing |
| Database-driven configuration | Admins can modify behavior without code deployment |
| Function-first chat system | Extensible, actor-agnostic function execution |
| Dual authentication contexts | Complete isolation between main app and admin users |
| User/Workspace independence | Personal content never leaks into workspace context |

---

## Core Principles

### 1. Top-Down Development Approach (MANDATORY)

Before implementing ANY feature:

1. **Full Impact Analysis** - Understand how changes affect all components
2. **Plan Complete Implementation** - Database schema, RLS, edge functions, UI, hooks, types
3. **Verify Data Flow** - End-to-end from UI through database and back
4. **Avoid Surface-Level Patches** - Address root causes, not symptoms
5. **Report with Transparency** - Acknowledge issues immediately

### 2. Pre-Implementation Protocol

For significant code changes:

1. **Historical Context Review** - Review last 12 hours of changes
2. **Issue Persistence Evaluation** - Confirm original issue still exists
3. **Root Cause Analysis** - Explain WHY previous fixes failed
4. **Strategy Re-evaluation** - Consider alternative solutions
5. **Implementation Plan Validation** - Present solution with explicit reasoning

### 3. Debugging Process (MANDATORY)

When debugging issues:

1. **FIRST** - Examine own recent code changes
2. **SECOND** - Verify if original problem still exists
3. **THIRD** - Analyze actual data flow through modified code
4. **ONLY THEN** - Consider database or configuration issues

> "Good coders always go back and see what code changes screwed up."

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   AuthGate  │  │  AppLayout  │  │   Context Providers     │  │
│  │  (Security) │  │    (UI)     │  │  (Auth, Chat, Query)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EDGE FUNCTIONS                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      COSMO                               │    │
│  │  Comprehensive Operating System Management Orchestrator  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │    │
│  │  │ Intent   │ │ Function │ │  Model   │ │ Prompt   │    │    │
│  │  │ Analyzer │ │ Selector │ │  Router  │ │ Enhancer │    │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │  Image   │ │  Video   │ │ Knowledge│ │   Admin Data     │    │
│  │   Gen    │ │   Gen    │ │   Base   │ │   (Service Key)  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Database   │  │   Storage   │  │      Auth               │  │
│  │  (Postgres) │  │  (Buckets)  │  │  (auth.users)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Hierarchy

```
system_settings (global defaults)
       │
       ▼
workspace_settings (workspace overrides)
       │
       ▼
user_preferences (user-specific, personal context only)
```

---

## Authentication Architecture

### Dual Context System

SPORK uses two completely isolated authentication systems:

| Context | Table | Use Case |
|---------|-------|----------|
| `AuthContext` | `auth.users` + `profiles` | Main application users |
| `SystemAuthContext` | `system_users` + `system_user_sessions` | Admin/Spork Editor users |

> **Deprecated:** `AdminAuthContext` and `SporkEditorAuthContext` were removed (Dec 2025). All admin authentication now uses `SystemAuthContext` exclusively.

### Critical Isolation Rules

1. **Main app initialization must proceed normally regardless of admin session keys**
2. **Admin session keys (`spork_admin_session`) in localStorage must NOT interfere with main app**
3. **Session state and callbacks must NOT be in useEffect dependency array**
4. **Use single AuthProvider instance via layout pattern to prevent re-mounting**

### AuthGate Pattern (MANDATORY)

```tsx
// AuthGate renders ONLY a minimal loader until auth is verified
const AuthGate = ({ children }) => {
  const { loading, user } = useAuth();
  
  if (loading) {
    return <CenteredLoader />; // NO app UI renders here
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children; // Only now does AppLayout render
};
```

### Session Management Rules

- Inactivity timeout: **20 minutes** (non-negotiable security requirement)
- Activity tracking debounce: **5 seconds minimum**
- Activity listeners: Only `click`, `keydown`, `visibilitychange` (never `mousemove`, `scroll`)
- Clear React Query cache on logout: `queryClient.clear()`

---

## Data Structure Patterns

### User/Workspace Independence (CRITICAL)

Users and workspaces are **completely independent architectural entities**:

```
PERSONAL (user_id)              WORKSPACE (workspace_id)
├── profiles                    ├── workspaces
├── chats                       ├── workspace_members
├── prompts                     ├── space_chats (via spaces)
├── personas                    ├── space_prompts
├── user_files                  ├── space_personas
└── credit_purchases            ├── workspace_files
                                └── knowledge_base
```

**Rules:**
- Personal content NEVER leaks into workspace context
- Workspace settings override user settings for context building
- Knowledge Base is workspace-only, not user-level

### Configuration Tables Pattern

All configuration stored in database, never hardcoded:

```typescript
// system_settings table structure
{
  setting_key: string,      // e.g., 'default_model', 'cosmo_routing_config'
  setting_value: JSONB,     // Flexible configuration object
  setting_type: string,     // 'ai', 'billing', 'email', etc.
  updated_at: timestamp
}
```

### Template Tables Pattern

All templates follow consistent structure:

```typescript
{
  id: uuid,
  name: string,
  description: string,
  category_id: uuid,        // FK to {type}_categories
  icon: string,             // Lucide icon name
  image_url: string,        // Optional uploaded image
  display_mode: 'icon' | 'image',
  is_active: boolean,
  is_featured: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Frontend Architecture

### Context Hierarchy

```tsx
<App>
  <RouterProvider>
    <QueryClientProvider>
      <ThemeProvider>
        {/* User Routes */}
        <AuthProvider>
          <ChatProvider>
            <ChatInputProvider>
              <Routes />
            </ChatInputProvider>
          </ChatProvider>
        </AuthProvider>
        
        {/* Admin Routes - Completely Separate */}
        <SystemAuthProvider>
          <AdminRoutes />
        </SystemAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </RouterProvider>
</App>
```

### Standard Hook Pattern

```typescript
export function useFeature(id?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Query with proper dependencies
  const query = useQuery({
    queryKey: ['feature', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('id', id);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
  });
  
  // Mutation with invalidation
  const mutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from('table')
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature'] });
      toast.success('Created successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  return { ...query, mutation };
}
```

### Component Organization

```
src/
├── components/
│   ├── ui/              # Shadcn base components
│   ├── chat/            # Chat-specific components
│   ├── workspace/       # Workspace components
│   └── admin/           # Admin panel components
├── hooks/
│   ├── use*.ts          # Feature hooks
│   └── queries/         # React Query hooks
├── lib/
│   ├── chatFunctions/   # Function-first chat system
│   └── utils/           # Utility functions
├── contexts/
│   ├── AuthContext.tsx
│   ├── ChatContext.tsx
│   └── SystemAuthContext.tsx
└── pages/               # Route pages
```

---

## Edge Function Patterns

### Standard Structure

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 3. Validate auth (if required)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Business logic
    const result = await performOperation(supabase, user);

    // 5. Return success
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // 6. Structured error response
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code || 'UNKNOWN',
        details: error.details || null,
        hint: error.hint || null,
      }),
      { status: error.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### COSMO Integration Pattern (Post-Refactor)

```typescript
// Edge functions become thin wrappers
import { handleChatRequest, corsHeaders } from '../_shared/cosmo/index.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  return handleChatRequest(req);
});
```

### Admin Data Pattern

All admin operations go through `admin-data` edge function:

```typescript
// Frontend hook
const { data } = useQuery({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    const response = await supabase.functions.invoke('admin-data', {
      body: { 
        action: 'list_users',
        session_token: sessionToken 
      }
    });
    if (response.error) throw response.error;
    return response.data;
  }
});
```

---

## Database Tables Reference

### AI & COSMO

| Table | Purpose |
|-------|---------|
| `ai_models` | Available AI models with pricing, capabilities |
| `fallback_models` | Fallback model configurations |
| `cosmo_intents` | Intent detection keywords and mappings |
| `cosmo_function_chains` | Function execution sequences |
| `cosmo_debug_logs` | Routing decision logs |

### Chat System

| Table | Purpose |
|-------|---------|
| `chats` | Chat sessions (personal) |
| `messages` | Chat messages with Cosmo metadata |
| `chat_functions` | Registered functions |
| `chat_actors` | Actor types and permissions |
| `chat_containers` | UI container configurations |

### Workspaces

| Table | Purpose |
|-------|---------|
| `workspaces` | Workspace entities |
| `workspace_members` | Member assignments |
| `spaces` | Workspace spaces/projects |
| `space_chats` | Workspace chat sessions |
| `space_prompts` | Workspace prompts |
| `space_personas` | Workspace personas |

### User Content

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `prompts` | Personal prompts |
| `personas` | Personal personas |
| `user_files` | Personal files |
| `knowledge_base` | Document storage (workspace-level) |

### Billing & Usage

| Table | Purpose |
|-------|---------|
| `subscription_tiers` | Plan definitions |
| `user_subscriptions` | User subscriptions |
| `usage_tracking` | Usage counters |
| `usage_logs` | Detailed usage events |
| `credit_purchases` | One-time purchases |

### Email Infrastructure

| Table | Purpose |
|-------|---------|
| `email_providers` | Provider configurations |
| `email_templates` | Email templates |
| `email_rules` | Automation rules |
| `email_logs` | Send history |

### Admin & System

| Table | Purpose |
|-------|---------|
| `system_settings` | Global configuration |
| `system_users` | Admin users |
| `system_user_sessions` | Admin sessions |
| `activity_log` | Activity tracking |

---

## Branding & Design Standards

### Non-Negotiable Rules

1. **Brand Name**: Always "Ai" with lowercase "i" (never "AI")
2. **Icons**: Use Lucide icons exclusively (NO EMOJIS EVER)
3. **Container Margins**: `container mx-auto max-w-7xl px-6`
4. **Featured Items**: Yellow color indicator (`text-yellow-500`)

### Color Usage

All colors must use CSS variables from design system:

```css
/* DO */
bg-background text-foreground
bg-primary text-primary-foreground
bg-muted text-muted-foreground

/* DON'T */
bg-white text-black
bg-[#464646]
```

### Component Patterns

```tsx
// Button variants via CVA
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // ... more variants
      }
    }
  }
);
```

---

## Critical Implementation Rules

> **📋 Production Release?** See [RELEASE-CHECKLIST.md](./RELEASE-CHECKLIST.md) for the Release Captain Checklist with GO/NO-GO gates.

### Security

1. **RLS Policies** - Design before writing code; test with different user roles
2. **Admin Operations** - Always use `admin-data` edge function with service role key
3. **Never Raw SQL** - Edge functions must use Supabase client methods only
4. **Inactivity Timeout** - 20 minutes, non-negotiable

### Performance

1. **Activity Debounce** - 5-second minimum for localStorage writes
2. **React Query Caching** - `staleTime: 5min`, `gcTime: 30min` for admin data
3. **Query Limits** - Supabase default is 1000 rows; check before assuming bugs
4. **Clear Cache on Logout** - `queryClient.clear()`

### Error Handling

All errors must be structured:

```typescript
{
  message: string,      // Human-readable
  code: string,         // PostgreSQL or custom code
  httpStatus: number,   // HTTP status
  details: string,      // Technical details
  hint: string          // Actionable suggestion
}
```

### TypeScript

1. **Strict Mode** - Non-negotiable in production
2. **Result Pattern** - Use `Result<T>` for error handling over exceptions
3. **Types Location** - Keep close to usage or in dedicated `types/` folder

---

## Related Documentation

- [COSMO Architecture](./COSMO.md) - Detailed COSMO module documentation
- [Chat Functions](./CHAT-FUNCTIONS.md) - Function-first architecture guide
- [Testing Guide](./TESTING.md) - Testing patterns and CI/CD integration

---

*This document serves as the authoritative reference for SPORK architecture decisions and implementation patterns.*
