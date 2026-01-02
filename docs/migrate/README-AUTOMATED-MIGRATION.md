# Automated Migration Script

This automated migration script will handle the complete migration from Lovable to your Supabase instance.

## Prerequisites

1. **Supabase Project**: You must have a Supabase project with:
   - Project URL
   - Service Role Key (found in Settings > API)
   - Access Token (optional, for Management API operations)

2. **Node.js Environment**: 
   - Node.js 18+ installed
   - TypeScript and ts-node installed:
     ```bash
     npm install -g typescript ts-node
     ```

3. **Create exec_sql Function**: 
   - **IMPORTANT**: Before running the migration, you must create the `exec_sql` helper function
   - Go to Supabase SQL Editor
   - Run the SQL from `create-exec-sql-function.sql`
   - This function allows the script to execute SQL statements programmatically

## Quick Start

### Step 1: Create exec_sql Function

1. Open Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `create-exec-sql-function.sql`
3. Execute the SQL
4. Verify it was created:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'exec_sql';
   ```

### Step 2: Set Environment Variables

```bash
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ACCESS_TOKEN="your-access-token"  # Optional
```

Or on Windows PowerShell:
```powershell
$env:SUPABASE_URL="https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:SUPABASE_ACCESS_TOKEN="your-access-token"  # Optional
```

### Step 3: Run the Migration

```bash
ts-node docs/migrate/automated-migration.ts
```

## What the Script Does

The automated migration script performs these steps in order:

1. **Create exec_sql Helper Function** (if not exists)
   - Creates a function to execute SQL dynamically
   - Note: This may need to be created manually first

2. **Apply RLS Policies**
   - Enables Row-Level Security on all tables
   - Creates security functions (`has_role`, `is_workspace_member`)
   - Applies RLS policies for all tables
   - Verifies RLS is enabled

3. **Apply Database Triggers**
   - Creates `handle_new_user()` function
   - Creates `handle_new_workspace()` function
   - Creates `updated_at` triggers for all tables
   - Creates protection triggers (prevent deletion of defaults)
   - Verifies triggers exist

4. **Setup Storage Buckets**
   - Creates required storage buckets:
     - `knowledge-base` (private)
     - `user-files` (public)
     - `app-media` (public)
     - `template-images` (public)
   - Applies RLS policies for storage
   - Verifies buckets exist

5. **Seed System Data**
   - Inserts persona categories
   - Inserts prompt categories
   - Creates default templates
   - Sets up system settings
   - Verifies seed data exists

## Troubleshooting

### "exec_sql function does not exist"

**Solution**: Run `create-exec-sql-function.sql` in Supabase SQL Editor first.

### "DDL statements not supported via REST API"

**Solution**: Some SQL statements (CREATE TYPE, ALTER TABLE, etc.) cannot be executed via the REST API. The script will log these and you'll need to:
1. Copy the SQL statements from the log
2. Execute them manually in Supabase SQL Editor
3. Continue with the next steps

### "Connection failed"

**Solution**: 
- Verify your `SUPABASE_URL` is correct
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that your Supabase project is active

### "Storage bucket creation failed"

**Solution**: 
- Verify you have Storage API access
- Check that buckets don't already exist (this is OK, script will continue)
- Some buckets may need to be created manually via Supabase Dashboard

### "Verification failed"

**Solution**: 
- The migration step completed but verification couldn't confirm success
- Check the Supabase Dashboard manually
- Some verification functions may not exist yet (this is OK)

## Manual Steps (if needed)

If the automated script fails on certain steps, you can execute them manually:

1. **RLS Policies**: Copy `apply-rls-policies.sql` to Supabase SQL Editor
2. **Triggers**: Copy `apply-triggers.sql` to Supabase SQL Editor
3. **Storage**: Use Supabase Dashboard > Storage to create buckets manually
4. **Seed Data**: Copy `seed-system-data.sql` to Supabase SQL Editor

## Verification

After migration, verify everything is set up correctly:

```sql
-- Check RLS is enabled
SELECT tablename, relrowsecurity 
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public';

-- Check triggers exist
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid::regclass::text NOT LIKE 'pg_%';

-- Check storage buckets
-- (Use Supabase Dashboard > Storage)

-- Check seed data
SELECT COUNT(*) FROM persona_categories;
SELECT COUNT(*) FROM prompt_categories;
```

## Next Steps

After successful migration:

1. **Configure Secrets**: Set up environment variables in Supabase Dashboard:
   - `OPENROUTER_API_KEY`
   - `RESEND_API_KEY` (optional)
   - `REPLICATE_API_KEY` (optional)

2. **Deploy Edge Functions**: Use the Supabase Admin panel or CLI:
   ```bash
   supabase functions deploy
   ```

3. **Test the Application**: Verify all features work correctly

4. **Update Application Config**: Update your application to use the new Supabase instance

## Support

If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify each step manually in Supabase Dashboard
3. Review the SQL files to understand what each step does
4. Check Supabase documentation for API changes



