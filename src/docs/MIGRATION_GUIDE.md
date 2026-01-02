# Spork Migration Guide

Step-by-step guide to recreate the Spork application in your own Supabase project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Supabase Project](#1-create-supabase-project)
3. [Run Database Migrations](#2-run-database-migrations)
4. [Create Storage Buckets](#3-create-storage-buckets)
5. [Configure Authentication](#4-configure-authentication)
6. [Set Up Secrets](#5-set-up-secrets)
7. [Deploy Edge Functions](#6-deploy-edge-functions)
8. [Seed Initial Data](#7-seed-initial-data)
9. [Configure Frontend](#8-configure-frontend)
10. [Testing](#9-testing)

---

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.land/) installed (for edge functions)
- Node.js 18+ installed
- Git installed
- Supabase account created

---

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name:** Spork (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
4. Click "Create new project"
5. Wait for project to be provisioned (~2 minutes)

Save your project details:
- **Project URL:** `https://[project-id].supabase.co`
- **Anon Key:** Found in Settings → API
- **Service Role Key:** Found in Settings → API (keep secret!)

---

## 2. Run Database Migrations

### Option A: Via SQL Editor (Recommended for External Supabase)

1. Go to your Supabase Dashboard → SQL Editor
2. Run migrations in order from the `DATABASE_SCHEMA.md` file:

**Step 1: Create Enums**
```sql
-- Run all enum creation statements from DATABASE_SCHEMA.md
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
-- ... continue with all enums
```

**Step 2: Create Core Tables**
```sql
-- Run table creation statements in order:
-- 1. profiles (depends on auth.users)
-- 2. user_roles
-- 3. user_settings
-- 4. workspaces
-- 5. workspace_members
-- ... continue in dependency order
```

**Step 3: Create Database Functions**
```sql
-- Run all function creation statements
CREATE OR REPLACE FUNCTION public.has_role(...)
CREATE OR REPLACE FUNCTION public.is_workspace_member(...)
CREATE OR REPLACE FUNCTION public.handle_updated_at(...)
CREATE OR REPLACE FUNCTION public.handle_new_user(...)
```

**Step 4: Create Triggers**
```sql
-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Step 5: Enable Row Level Security**
```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- ... continue for all tables
```

**Step 6: Create RLS Policies**
```sql
-- Run all policy creation statements from DATABASE_SCHEMA.md
```

### Option B: Via Supabase CLI

If you have the migration files:

```bash
# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

---

## 3. Create Storage Buckets

In the Supabase Dashboard → Storage:

### Create knowledge-base bucket

1. Click "New bucket"
2. Name: `knowledge-base`
3. Public bucket: **No** (unchecked)
4. Click "Create bucket"

Then add policies via SQL Editor:

```sql
-- Upload policy
CREATE POLICY "Users can upload knowledge base files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Select policy
CREATE POLICY "Users can view their knowledge base files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete policy
CREATE POLICY "Users can delete their knowledge base files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Create user-files bucket

1. Click "New bucket"
2. Name: `user-files`
3. Public bucket: **No** (unchecked)
4. Click "Create bucket"

Add policies:

```sql
-- Upload policy
CREATE POLICY "Users can upload their files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Select policy
CREATE POLICY "Users can view their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update policy
CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Delete policy
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 4. Configure Authentication

### Enable Email Auth

1. Go to Authentication → Providers
2. Enable **Email** provider
3. Configure settings:
   - **Confirm email:** Disabled (for development) or Enabled (for production)
   - **Secure email change:** Enabled
   - **Secure password change:** Enabled

### Enable Google OAuth (Optional)

1. Go to Authentication → Providers
2. Click on **Google**
3. Toggle **Enable Sign in with Google**
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Add authorized redirect URL to Google Console

### Configure Auth Settings

In Authentication → Settings:

```
Site URL: https://your-app-domain.com
Redirect URLs: 
  - https://your-app-domain.com/*
  - http://localhost:5173/* (for development)
```

### Auto-confirm Emails (Development Only)

Via SQL or API:
```sql
-- In your Supabase project settings
-- Or use the configure-auth tool if available
```

---

## 5. Set Up Secrets

### Via Supabase Dashboard

Go to Settings → Edge Functions → Secrets:

Add each secret:

| Name | Value |
|------|-------|
| `LOVABLE_API_KEY` | Your Lovable AI API key |
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `RESEND_API_KEY` | Your Resend API key |
| `REPLICATE_API_KEY` | Your Replicate API key (optional) |

### Via CLI

```bash
supabase secrets set LOVABLE_API_KEY=your_key_here
supabase secrets set OPENROUTER_API_KEY=your_key_here
supabase secrets set RESEND_API_KEY=your_key_here
```

---

## 6. Deploy Edge Functions

### Copy Edge Functions

Copy all files from `supabase/functions/` to your project:

```
supabase/functions/
├── chat/
│   └── index.ts
├── generate-image/
│   └── index.ts
├── check-quota/
│   └── index.ts
├── track-usage/
│   └── index.ts
├── query-knowledge-base/
│   └── index.ts
├── process-document/
│   └── index.ts
├── sync-openrouter-models/
│   └── index.ts
├── send-email/
│   └── index.ts
├── process-system-event/
│   └── index.ts
├── manage-email-template/
│   └── index.ts
├── manage-email-rule/
│   └── index.ts
├── manage-email-provider/
│   └── index.ts
├── send-workspace-invitation/
│   └── index.ts
├── accept-workspace-invitation/
│   └── index.ts
├── billing-webhooks/
│   └── index.ts
├── manage-subscription/
│   └── index.ts
└── purchase-credits/
    └── index.ts
```

### Update config.toml

Create/update `supabase/config.toml`:

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

### Deploy Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy chat
supabase functions deploy generate-image
# ... etc
```

---

## 7. Seed Initial Data

### Create Admin User

1. Sign up through your app
2. Run SQL to grant admin role:

```sql
-- Replace with your user's ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'admin');
```

### Seed Default AI Models

```sql
-- Insert default Lovable AI models
INSERT INTO public.ai_models (model_id, name, provider, best_for, is_active, is_default) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'lovable', 'conversation', true, true),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'lovable', 'research', true, false),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'lovable', 'general', true, false),
('openai/gpt-5', 'GPT-5', 'lovable', 'research', true, false),
('openai/gpt-5-mini', 'GPT-5 Mini', 'lovable', 'conversation', true, false);
```

### Seed System Settings

```sql
INSERT INTO public.system_settings (key, value, description) VALUES
('default_model', '"google/gemini-2.5-flash"', 'Default AI model for chat'),
('fallback_model', '""', 'Fallback model when primary fails'),
('image_model', '"google/gemini-2.5-flash-image"', 'Model for image generation'),
('knowledge_base_model', '"google/gemini-2.5-flash"', 'Model for knowledge base queries'),
('global_ai_instructions', '""', 'Global instructions applied to all chats'),
('auto_select_model', 'true', 'Enable intelligent model selection'),
('pre_message_config', '{"include_persona": true, "include_ai_instructions": true, "include_knowledge_base": true, "include_history": true, "max_history": 10}', 'Pre-message context configuration');
```

### Seed Default Categories

```sql
-- Persona categories
INSERT INTO public.persona_categories (name, slug, display_order) VALUES
('General', 'general', 1),
('Coding', 'coding', 2),
('Writing', 'writing', 3),
('Research', 'research', 4),
('Creative', 'creative', 5),
('Business', 'business', 6);

-- Prompt categories
INSERT INTO public.prompt_categories (name, slug, display_order) VALUES
('General', 'general', 1),
('Writing', 'writing', 2),
('Coding', 'coding', 3),
('Marketing', 'marketing', 4),
('Business', 'business', 5);

-- Space categories
INSERT INTO public.space_categories (name, slug, display_order) VALUES
('Marketing', 'marketing', 1),
('Engineering', 'engineering', 2),
('Sales', 'sales', 3),
('Support', 'support', 4),
('Legal', 'legal', 5),
('Operations', 'operations', 6);
```

### Seed Default Subscription Tiers

```sql
INSERT INTO public.subscription_tiers (name, tier_type, monthly_price, monthly_token_input_quota, monthly_image_quota, is_active) VALUES
('Free', 'trial', 0, 100000, 10, true),
('Solo', 'paid', 20, 1000000, 100, true),
('Team', 'paid', 40, 5000000, 500, true);
```

### Seed Email Event Types

```sql
INSERT INTO public.email_system_event_types (event_type, display_name, category, description, is_critical) VALUES
('user_signup', 'User Signup', 'authentication', 'Triggered when a new user registers', false),
('password_reset_request', 'Password Reset Request', 'authentication', 'Triggered when user requests password reset', true),
('payment_successful', 'Payment Successful', 'billing', 'Triggered when payment is completed', false),
('payment_failed', 'Payment Failed', 'billing', 'Triggered when payment fails', true),
('subscription_started', 'Subscription Started', 'billing', 'Triggered when subscription begins', false),
('subscription_cancelled', 'Subscription Cancelled', 'billing', 'Triggered when subscription is cancelled', false),
('usage_alert', 'Usage Alert', 'system', 'Triggered when usage threshold is reached', true),
('system_error', 'System Error', 'system', 'Triggered on system errors', true);
```

### Seed Email Provider (Resend)

```sql
INSERT INTO public.email_providers (name, provider_type, description, is_active, config_schema) VALUES
('Resend', 'resend', 'Modern email API for developers', true, '[{"key": "api_key", "label": "API Key", "type": "password", "required": true}]');
```

---

## 8. Configure Frontend

### Update Environment Variables

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Update Supabase Client

The client should already be configured in `src/integrations/supabase/client.ts`. Verify it uses environment variables:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Regenerate Types (Optional)

If you want TypeScript types for your schema:

```bash
supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts
```

---

## 9. Testing

### Test Database Connection

```sql
-- In SQL Editor, verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Test Authentication

1. Start your app: `npm run dev`
2. Navigate to signup page
3. Create a new account
4. Verify profile is created in `profiles` table
5. Verify workspace is created in `workspaces` table

### Test Edge Functions

```bash
# Test chat function
curl -X POST 'https://your-project.supabase.co/functions/v1/chat' \
  -H 'Content-Type: application/json' \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "userId": "test"}'
```

### Test Storage

1. Navigate to Files page in app
2. Upload a test file
3. Verify file appears in `user-files` bucket

---

## Troubleshooting

### Common Issues

**RLS Policy Errors:**
- Ensure all tables have RLS enabled
- Verify policies are created correctly
- Check that user is authenticated

**Edge Function Errors:**
- Check function logs: `supabase functions logs function-name`
- Verify all secrets are set
- Ensure function is deployed

**Auth Issues:**
- Verify Site URL is correct
- Check redirect URLs include your domain
- Ensure email provider is configured

**Database Errors:**
- Check migration order (some tables depend on others)
- Verify foreign key references exist
- Ensure enums are created before tables that use them

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

---

## Next Steps

After migration is complete:

1. **Set up monitoring** - Configure error tracking and analytics
2. **Configure backups** - Enable point-in-time recovery
3. **Set up CI/CD** - Automate deployments
4. **Security review** - Run security scan and fix any issues
5. **Performance testing** - Load test critical endpoints
