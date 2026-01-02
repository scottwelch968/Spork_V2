-- Create admin_documentation table for editable documentation
CREATE TABLE public.admin_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_documentation ENABLE ROW LEVEL SECURITY;

-- Anyone can read published docs
CREATE POLICY "Anyone can read published docs" ON public.admin_documentation 
  FOR SELECT USING (is_published = true);

-- Admins can manage all docs
CREATE POLICY "Admins can manage docs" ON public.admin_documentation 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_documentation_updated_at
  BEFORE UPDATE ON public.admin_documentation
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed migration guide sections
INSERT INTO public.admin_documentation (title, slug, category, content, display_order) VALUES
('Prerequisites', 'migration-prerequisites', 'migration', '## Prerequisites

Before starting the migration, ensure you have:

- [ ] **Supabase CLI** installed (`npm install -g supabase`)
- [ ] **Deno** installed (for edge functions)
- [ ] **Node.js 18+** installed
- [ ] **Git** installed
- [ ] Access to your Lovable project source code
- [ ] A new Supabase account/project created

### Environment Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Install Deno (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# Verify installations
supabase --version
deno --version
```', 1),

('Create Supabase Project', 'migration-create-project', 'migration', '## Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details:
   - **Name**: Your project name
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

### Get Project Credentials

After creation, note these values from Project Settings > API:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

⚠️ **Never expose SERVICE_ROLE_KEY in client code**', 2),

('Run Database Migrations', 'migration-database', 'migration', '## Database Migrations

### Step 1: Create Enums

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create custom enums
CREATE TYPE public.app_role AS ENUM (''admin'', ''user'');
CREATE TYPE public.account_status_enum AS ENUM (''active'', ''suspended'', ''deleted'');
CREATE TYPE public.subscription_tier AS ENUM (''free'', ''solo'', ''team'');
CREATE TYPE public.content_type AS ENUM (''image'', ''video'', ''audio'');
CREATE TYPE public.model_category AS ENUM (''general'', ''coding'', ''research'', ''writing'', ''conversation'', ''image_generation'');
CREATE TYPE public.workspace_role AS ENUM (''owner'', ''member'');
CREATE TYPE public.payment_processor_enum AS ENUM (''stripe'', ''paypal'', ''manual'');
```

### Step 2: Run Table Migrations

Export migrations from your Lovable project and run sequentially:

```bash
supabase db push
```

Or manually run each migration file in order from `supabase/migrations/`', 3),

('Create Storage Buckets', 'migration-storage', 'migration', '## Storage Buckets

Create required storage buckets in Supabase Dashboard > Storage:

### Required Buckets

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `knowledge-base` | No | Document uploads for RAG |
| `app-media` | Yes | App assets, generated images |
| `user-files` | Yes | User uploaded files |

### Bucket Policies

```sql
-- Allow authenticated users to upload to user-files
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = ''user-files'' AND auth.uid() IS NOT NULL
);

-- Public read for app-media
CREATE POLICY "Public read for app-media" ON storage.objects
FOR SELECT USING (bucket_id = ''app-media'');
```', 4),

('Configure Authentication', 'migration-auth', 'migration', '## Authentication Setup

### Enable Email Auth

1. Go to Authentication > Providers
2. Enable "Email" provider
3. Configure settings:
   - **Enable email confirmations**: Off (for dev) / On (for prod)
   - **Enable email change confirmations**: On

### Configure Auth Settings

In Authentication > Settings:

```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/*
  - http://localhost:5173/* (for local dev)
```

### Optional: Google OAuth

1. Create OAuth credentials in Google Cloud Console
2. Add credentials in Authentication > Providers > Google
3. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`', 5),

('Set Up Secrets', 'migration-secrets', 'migration', '## Edge Function Secrets

Set required secrets in Supabase Dashboard > Project Settings > Edge Functions:

### Required Secrets

| Secret Name | Description |
|-------------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI models |
| `RESEND_API_KEY` | Resend API key for emails |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `REPLICATE_API_KEY` | For additional image generation |
| `LOVABLE_API_KEY` | Lovable AI Gateway fallback |

### Set Secrets via CLI

```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-...
supabase secrets set RESEND_API_KEY=re_...
```', 6),

('Deploy Edge Functions', 'migration-edge-functions', 'migration', '## Deploy Edge Functions

### List of Edge Functions

Deploy these functions from `supabase/functions/`:

- `chat` - Main AI chat handler
- `generate-image` - Image generation
- `process-document` - Document parsing for knowledge base
- `send-email` - Email sending
- `process-system-event` - Event-driven email automation
- `track-usage` - Usage tracking
- `check-quota` - Quota enforcement
- `sync-openrouter-models` - Model sync cron job

### Deploy All Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy chat
supabase functions deploy generate-image
```

### Verify Deployment

```bash
supabase functions list
```', 7),

('Seed Initial Data', 'migration-seed-data', 'migration', '## Seed Initial Data

### Required Seed Data

1. **AI Models** - Populate `ai_models` table with available models
2. **Fallback Models** - Configure backup models in `fallback_models`
3. **System Settings** - Initialize `system_settings` with defaults
4. **Email Event Types** - Populate `email_system_event_types`
5. **Pricing Tiers** - Set up subscription tiers

### Run Seed Script

```sql
-- Insert default pricing tiers
INSERT INTO pricing_tiers (tier_name, monthly_chat_tokens, monthly_image_generations)
VALUES 
  (''free'', 50000, 5),
  (''solo'', 500000, 50),
  (''team'', 2000000, 200);

-- Insert default system settings
INSERT INTO system_settings (key, value)
VALUES (''default_model'', ''anthropic/claude-3.5-sonnet'');
```', 8),

('Configure Frontend', 'migration-frontend', 'migration', '## Frontend Configuration

### Environment Variables

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

### Update Supabase Client

The client at `src/integrations/supabase/client.ts` should use env vars:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

### Build and Deploy

```bash
npm install
npm run build
# Deploy dist/ folder to your hosting provider
```', 9),

('Testing & Verification', 'migration-testing', 'migration', '## Testing Checklist

### Authentication
- [ ] User can sign up with email
- [ ] User can sign in
- [ ] Password reset works
- [ ] Session persists across refresh

### Core Features
- [ ] Chat sends messages and receives responses
- [ ] Image generation works
- [ ] File upload works
- [ ] Knowledge base document upload works

### Admin Functions
- [ ] Admin can access admin panel
- [ ] Model management works
- [ ] User management works
- [ ] Analytics display correctly

### Edge Functions
- [ ] `chat` function responds correctly
- [ ] `generate-image` returns images
- [ ] `track-usage` logs usage
- [ ] `send-email` sends emails

### RLS Policies
- [ ] Users can only see their own data
- [ ] Workspace members can access shared content
- [ ] Admins have full access', 10),

('Troubleshooting', 'migration-troubleshooting', 'migration', '## Common Issues

### "Permission denied" errors
- Check RLS policies are correctly configured
- Verify user has correct role in `user_roles` table
- Check JWT token is being sent with requests

### Edge function 500 errors
- Check function logs: `supabase functions logs <function-name>`
- Verify all secrets are set
- Check for missing environment variables

### CORS errors
- Add your domain to allowed origins in Supabase
- Check redirect URLs in Auth settings

### Database connection issues
```bash
# Test connection
supabase db reset --dry-run
```

### Missing types
Regenerate types after schema changes:
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```', 11);
