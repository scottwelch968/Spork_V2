# Migration Guide: Lovable to Supabase

This guide will help you migrate your application from Lovable's managed database to your own Supabase instance.

## Prerequisites

1. **Supabase Project Setup**
   - Create a new Supabase project at https://supabase.com
   - Note your project URL and API keys (anon key and service role key)
   - Ensure you have admin access to the Supabase dashboard

2. **Database Schema**
   - All database migrations should be applied first
   - Check that all tables exist in your Supabase instance
   - Verify the schema matches the expected structure

3. **Required Secrets**
   - `OPENROUTER_API_KEY` - Required for AI functionality
   - `RESEND_API_KEY` - Required for email functionality (optional but recommended)
   - `REPLICATE_API_KEY` - Required for image generation (optional)

## Migration Steps

### Step 1: Apply Database Schema

All database migrations should already be in your `supabase/migrations/` directory. These should be applied automatically by Supabase, but verify they're all applied:

```bash
# Check migration status in Supabase Dashboard
# Go to: Database > Migrations
```

### Step 2: Apply RLS Policies

**File:** `apply-rls-policies.sql`

This script sets up Row-Level Security policies for all tables. It includes:
- Security functions (`has_role`, `is_workspace_member`)
- RLS policies for all tables
- Schema introspection functions

**How to Apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `apply-rls-policies.sql`
3. Execute the script
4. Verify with: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

### Step 3: Apply Database Triggers

**File:** `apply-triggers.sql`

This script creates all database triggers and functions:
- User creation handler (creates profile, workspace, defaults)
- Workspace creation handler
- Updated_at triggers for all tables
- Protection triggers (prevent deletion of defaults)

**How to Apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `apply-triggers.sql`
3. Execute the script
4. Verify triggers exist: `SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid::regclass::text NOT LIKE 'pg_%';`

### Step 4: Setup Storage Buckets

**File:** `apply-storage-buckets.sql`

This script creates all required storage buckets with RLS policies:
- `knowledge-base` (private) - Document storage
- `user-files` (public) - User uploads
- `app-media` (public) - Generated content
- `template-images` (public) - Template images

**How to Apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `apply-storage-buckets.sql`
3. Execute the script
4. Verify in Supabase Dashboard: Storage > Buckets

**Alternative:** You can also use the Supabase Admin panel we built:
- Go to Admin > Supabase > Storage tab
- Create buckets manually using the UI

### Step 5: Seed System Data

**File:** `seed-system-data.sql`

This script populates initial system data:
- Persona categories (25 categories)
- Prompt categories (25 categories)
- Default templates
- System settings

**How to Apply:**
1. Open Supabase SQL Editor
2. Copy and paste the contents of `seed-system-data.sql`
3. Execute the script
4. Verify data: `SELECT COUNT(*) FROM persona_categories;` (should be 25)

### Step 6: Configure Secrets

**File:** `verify-secrets.sh`

Before deploying edge functions, configure all required secrets:

**Required Secrets:**
- `OPENROUTER_API_KEY` - AI model access

**Optional but Recommended:**
- `RESEND_API_KEY` - Email sending
- `REPLICATE_API_KEY` - Image generation

**How to Configure:**
1. Go to Supabase Dashboard > Project Settings > Edge Functions > Secrets
2. Add each secret with its value
3. Or use Supabase CLI: `supabase secrets set OPENROUTER_API_KEY=your_key`

### Step 7: Deploy Edge Functions

**File:** `deploy-edge-functions.sh`

This script deploys all 64 edge functions to your Supabase instance.

**Prerequisites:**
- Supabase CLI installed: `npm install -g supabase`
- Authenticated with Supabase: `supabase login`
- Linked to your project: `supabase link --project-ref your-project-ref`

**How to Deploy:**
```bash
# Deploy all functions
./docs/migrate/deploy-edge-functions.sh --all

# Or deploy specific functions
./docs/migrate/deploy-edge-functions.sh chat generate-image

# Verify secrets first
./docs/migrate/deploy-edge-functions.sh --verify
```

**Alternative Manual Deployment:**
1. Go to Supabase Dashboard > Edge Functions
2. Deploy each function individually
3. Or use the Supabase Admin panel we built:
   - Go to Admin > Supabase > Edge Functions tab
   - Deploy functions using the UI

### Step 8: Verify Migration

**Files:** `verify-rls.sh`, `verify-secrets.sh`

Run verification scripts to ensure everything is set up correctly:

```bash
# Verify RLS policies
./docs/migrate/verify-rls.sh

# Verify secrets
./docs/migrate/verify-secrets.sh
```

## Migration Checklist

- [ ] Database schema migrations applied
- [ ] RLS policies applied (`apply-rls-policies.sql`)
- [ ] Database triggers applied (`apply-triggers.sql`)
- [ ] Storage buckets created (`apply-storage-buckets.sql`)
- [ ] System data seeded (`seed-system-data.sql`)
- [ ] Required secrets configured
- [ ] Edge functions deployed
- [ ] RLS policies verified
- [ ] Secrets verified
- [ ] Test user creation
- [ ] Test workspace creation
- [ ] Test AI chat functionality
- [ ] Test file uploads
- [ ] Test edge functions

## Using the Supabase Admin Panel

We've built a comprehensive Supabase admin panel that can help with migration:

1. **Settings Tab**
   - Configure Supabase credentials
   - Test connection

2. **Database Tab**
   - View database schema
   - Run parity tests
   - Sync schema
   - Generate SQL for missing/extra items

3. **Storage Tab**
   - Create/manage storage buckets
   - Upload files
   - Manage RLS policies

4. **Edge Functions Tab**
   - Deploy edge functions
   - View function code
   - Test functions

5. **Auth & Users Tab**
   - Manage users
   - Configure auth settings
   - Assign roles

## Troubleshooting

### RLS Policies Not Working
- Verify policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
- Check RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- Verify security functions exist: `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('has_role', 'is_workspace_member');`

### Triggers Not Firing
- Check triggers exist: `SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid::regclass::text NOT LIKE 'pg_%';`
- Verify functions exist: `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;`

### Edge Functions Failing
- Check secrets are set: Use `verify-secrets.sh`
- Check function logs in Supabase Dashboard
- Verify function code is correct

### Storage Issues
- Verify buckets exist: Check in Supabase Dashboard > Storage
- Check RLS policies on storage buckets
- Verify file size limits are appropriate

## Post-Migration

After migration is complete:

1. **Update Application Configuration**
   - Update environment variables to point to your Supabase instance
   - Update API endpoints
   - Test all functionality

2. **Data Migration** (if needed)
   - Export data from Lovable
   - Import into Supabase
   - Verify data integrity

3. **Monitor**
   - Set up monitoring for edge functions
   - Monitor database performance
   - Set up alerts for errors

## Support

If you encounter issues during migration:
1. Check the Supabase logs
2. Review the verification scripts output
3. Use the Supabase Admin panel for debugging
4. Check Supabase documentation: https://supabase.com/docs



