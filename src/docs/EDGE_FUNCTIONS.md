# Spork Edge Functions Documentation

Complete documentation for all Supabase Edge Functions in the Spork AI Chat application.

## Table of Contents

- [Overview](#overview)
- [Core AI Functions](#core-ai-functions)
- [Billing & Usage Functions](#billing--usage-functions)
- [Email Functions](#email-functions)
- [Workspace Functions](#workspace-functions)
- [Utility Functions](#utility-functions)

---

## Overview

All edge functions are deployed to Supabase and accessible at:
```
https://<project-id>.supabase.co/functions/v1/<function-name>
```

### Common Headers

All functions support CORS and require these headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Environment Variables

All functions have access to:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

---

## Core AI Functions

### chat

**Purpose:** Main AI chat endpoint with streaming support, provider-based routing, and intelligent model selection.

**Endpoint:** `POST /functions/v1/chat`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;           // Model ID or 'auto' for Auto Spork
  workspaceId?: string;     // For workspace context
  personaId?: string;       // Persona to use
  userId: string;           // Required for usage tracking
}
```

**Response:** Server-Sent Events (SSE) stream

**Features:**
- Provider-based routing (Lovable AI Gateway vs OpenRouter)
- Auto Spork intelligent model selection based on message intent
- Fallback model support when primary fails
- Pre-message context injection (persona, AI instructions, knowledge base)
- Usage tracking and cost logging
- Streaming responses

**Provider Routing Logic:**
```javascript
// Determine endpoint based on provider
const isLovableModel = model.provider === 'lovable' || 
                       model.model_id.startsWith('google/') || 
                       model.model_id.startsWith('openai/');

const endpoint = isLovableModel 
  ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
  : 'https://openrouter.ai/api/v1/chat/completions';

const apiKey = isLovableModel 
  ? Deno.env.get('LOVABLE_API_KEY')
  : Deno.env.get('OPENROUTER_API_KEY');
```

**Environment Variables:**
- `LOVABLE_API_KEY` - API key for Lovable AI Gateway
- `OPENROUTER_API_KEY` - API key for OpenRouter

---

### generate-image

**Purpose:** AI image generation using configurable models.

**Endpoint:** `POST /functions/v1/generate-image`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  prompt: string;          // Image description
  userId: string;          // Required for tracking
  workspaceId: string;     // Required for storage
  model?: string;          // Optional model override
}
```

**Response:**
```typescript
{
  url: string;             // Generated image URL
  model: string;           // Model used
}
```

**Features:**
- Configurable model from system_settings (image_model)
- Provider-based routing
- Usage tracking with cost logging
- Generated content saved to database

---

### query-knowledge-base

**Purpose:** Query uploaded documents using AI for intelligent answers.

**Endpoint:** `POST /functions/v1/query-knowledge-base`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  query: string;           // User's question
  workspaceId: string;     // Workspace to search
  userId: string;          // For tracking
  limit?: number;          // Max results (default: 5)
}
```

**Response:**
```typescript
{
  answer: string;          // AI-generated answer
  sources: Array<{
    title: string;
    content: string;
    score: number;
  }>;
}
```

**Features:**
- Keyword-based document search
- Chunk retrieval for relevant context
- AI-powered answer generation with citations
- Configurable model from system_settings

---

### process-document

**Purpose:** Process uploaded documents for knowledge base indexing.

**Endpoint:** `POST /functions/v1/process-document`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  documentId: string;      // Knowledge base document ID
  storagePath: string;     // Path in storage bucket
}
```

**Response:**
```typescript
{
  success: boolean;
  chunks: number;          // Number of chunks created
}
```

**Features:**
- Downloads file from Supabase storage
- Extracts and sanitizes text content
- Splits into searchable chunks
- Updates knowledge_base table with content and chunks
- Logs processing cost

---

### sync-openrouter-models

**Purpose:** Synchronize AI model catalog from OpenRouter API.

**Endpoint:** `POST /functions/v1/sync-openrouter-models`

**Authentication:** Public (verify_jwt = false)

**Request Body:** None required

**Response:**
```typescript
{
  synced: number;          // Models synced
  updated: number;         // Models updated
  added: number;           // New models added
}
```

**Features:**
- Fetches model list from OpenRouter API
- Updates pricing information
- Strips `:free` suffix from model IDs
- Preserves admin customizations
- Daily cron job recommended (1 AM CST)

**Environment Variables:**
- `OPENROUTER_API_KEY`

---

## Billing & Usage Functions

### check-quota

**Purpose:** Verify user has sufficient quota before processing requests.

**Endpoint:** `POST /functions/v1/check-quota`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  userId: string;
  actionType: 'text_generation' | 'image_generation' | 'video_generation' | 'document_parsing';
  estimatedTokens?: number;  // For text generation
}
```

**Response:**
```typescript
{
  allowed: boolean;
  remaining: {
    tokens_input: number;
    tokens_output: number;
    images: number;
    videos: number;
    documents: number;
  };
  message?: string;        // Error message if not allowed
}
```

**Error Codes:**
- `402` - Payment required (quota exceeded)
- `403` - Account suspended

---

### track-usage

**Purpose:** Log usage after successful AI operations.

**Endpoint:** `POST /functions/v1/track-usage`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  userId: string;
  workspaceId?: string;
  actionType: 'text_generation' | 'image_generation' | 'video_generation' | 'document_parsing';
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
  cost?: number;
  metadata?: object;
}
```

**Response:**
```typescript
{
  success: boolean;
  usage: {
    // Updated usage counters
  };
}
```

**Features:**
- Updates usage_tracking counters
- Logs to usage_logs for analytics
- Deducts from credit purchases if applicable
- Resets daily counters automatically

---

### manage-subscription

**Purpose:** CRUD operations for user subscriptions.

**Endpoint:** `POST /functions/v1/manage-subscription`

**Authentication:** Required (Authorization header)

**Request Body:**
```typescript
{
  action: 'create' | 'update' | 'cancel' | 'get';
  userId?: string;
  tierId?: string;
  // Additional fields based on action
}
```

---

### purchase-credits

**Purpose:** Process one-time credit purchases.

**Endpoint:** `POST /functions/v1/purchase-credits`

**Authentication:** Required (Authorization header)

**Request Body:**
```typescript
{
  packageId: string;
  paymentProcessorId: string;
  discountCode?: string;
}
```

---

### billing-webhooks

**Purpose:** Handle webhooks from Stripe and PayPal.

**Endpoint:** `POST /functions/v1/billing-webhooks`

**Authentication:** Public (uses webhook signatures)

**Supported Events:**

Stripe:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

PayPal:
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `PAYMENT.SALE.COMPLETED`

---

## Email Functions

### send-email

**Purpose:** Send emails through configured providers.

**Endpoint:** `POST /functions/v1/send-email`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  to: string;
  subject: string;
  html?: string;           // Direct HTML content
  text?: string;           // Plain text fallback
  templateId?: string;     // Use template instead
  variables?: object;      // Template variables
  providerId?: string;     // Specific provider (optional)
}
```

**Response:**
```typescript
{
  success: boolean;
  messageId?: string;
  provider: string;
}
```

**Supported Providers:**
- Resend (default)
- SendGrid
- Mailgun
- Mailtrap
- NotificationAPI

**Provider Selection Logic:**
1. Use specified `providerId` if provided
2. Fall back to active default provider
3. Error if no provider configured

**Environment Variables:**
- `RESEND_API_KEY` - For Resend provider

---

### process-system-event

**Purpose:** Process system events and trigger matching email rules.

**Endpoint:** `POST /functions/v1/process-system-event`

**Authentication:** Public (verify_jwt = false)

**Request Body:**
```typescript
{
  eventType: string;       // e.g., 'user_signup', 'payment_successful'
  userId?: string;
  email?: string;
  data: object;            // Event-specific data
}
```

**Response:**
```typescript
{
  processed: boolean;
  rulesMatched: number;
  emailsSent: number;
}
```

**Processing Logic:**
1. Find active email rules matching event_type
2. Evaluate rule conditions against event data
3. Check rate limits and deduplication
4. Render template with variables
5. Send email via send-email function
6. Log to email_rule_logs

**Supported Event Types:**
- `user_signup` - New user registration
- `password_reset_request` - Password reset initiated
- `payment_successful` - Payment completed
- `payment_failed` - Payment failed
- `subscription_started` - New subscription
- `subscription_cancelled` - Subscription cancelled
- `usage_alert` - Quota threshold reached
- `system_error` - System error occurred

---

### manage-email-template

**Purpose:** CRUD operations for email templates.

**Endpoint:** `POST /functions/v1/manage-email-template`

**Authentication:** Admin only

**Request Body:**
```typescript
{
  action: 'create' | 'update' | 'delete' | 'get' | 'list';
  templateId?: string;
  data?: {
    name: string;
    slug: string;
    category: string;
    subject_template: string;
    html_content: string;
    text_content?: string;
    variables?: string[];
    status?: 'draft' | 'active' | 'archived';
  };
}
```

---

### manage-email-rule

**Purpose:** CRUD operations for email automation rules.

**Endpoint:** `POST /functions/v1/manage-email-rule`

**Authentication:** Admin only

---

### manage-email-provider

**Purpose:** Configure email service providers.

**Endpoint:** `POST /functions/v1/manage-email-provider`

**Authentication:** Admin only

---

## Workspace Functions

### send-workspace-invitation

**Purpose:** Send workspace invitation emails.

**Endpoint:** `POST /functions/v1/send-workspace-invitation`

**Authentication:** Required (Authorization header)

**Request Body:**
```typescript
{
  email: string;           // Invitee email
  role: 'admin' | 'member' | 'viewer';
  workspace_id: string;
}
```

**Response:**
```typescript
{
  invitation: object;      // Created invitation record
  inviteUrl: string;       // URL for accepting invitation
  message: string;
}
```

**Features:**
- Verifies inviter has admin/owner permissions
- Generates unique token with 7-day expiry
- Creates invitation record
- Logs workspace activity

---

### accept-workspace-invitation

**Purpose:** Accept a workspace invitation.

**Endpoint:** `POST /functions/v1/accept-workspace-invitation`

**Authentication:** Required (Authorization header)

**Request Body:**
```typescript
{
  invitation_token: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  workspace: object;
  message: string;
}
```

**Validation:**
- Token must be valid and not expired
- Invitation must not be already accepted
- Email must match authenticated user's email
- Adds user to workspace_members

---

## Utility Functions

### Function Configuration

All edge functions are configured in `supabase/config.toml`:

```toml
[project]
id = "your-project-id"

[functions.chat]
verify_jwt = false

[functions.generate-image]
verify_jwt = false

[functions.check-quota]
verify_jwt = false

[functions.track-usage]
verify_jwt = false

[functions.query-knowledge-base]
verify_jwt = false

[functions.process-document]
verify_jwt = false

[functions.sync-openrouter-models]
verify_jwt = false

[functions.send-email]
verify_jwt = false

[functions.process-system-event]
verify_jwt = false

[functions.manage-email-provider]
verify_jwt = false

[functions.manage-email-rule]
verify_jwt = false

[functions.manage-email-template]
verify_jwt = false

[functions.send-workspace-invitation]
verify_jwt = false

[functions.accept-workspace-invitation]
verify_jwt = false

[functions.billing-webhooks]
verify_jwt = false

[functions.manage-subscription]
verify_jwt = false

[functions.purchase-credits]
verify_jwt = false
```

---

## Error Handling

All functions return standardized error responses:

```typescript
{
  error: string;           // Error message
  code?: string;           // Error code (optional)
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (missing/invalid auth)
- `402` - Payment required (quota exceeded)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limited
- `500` - Internal server error

---

## Calling Functions from Client

Use the Supabase client's `functions.invoke` method:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Example: Chat request
const { data, error } = await supabase.functions.invoke('chat', {
  body: {
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'auto',
    userId: user.id,
  },
});

// Example: With streaming
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      messages: [...],
      model: 'auto',
      userId: user.id,
    }),
  }
);

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Process SSE data
}
```

---

## Deployment

Edge functions are automatically deployed when code is pushed. To manually deploy:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy chat

# View logs
supabase functions logs chat
```
