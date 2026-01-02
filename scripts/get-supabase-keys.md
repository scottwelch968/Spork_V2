# Getting Your Supabase Credentials

To switch from Lovable's Supabase to your own, you need:

## Required Credentials:

1. **Project Reference ID** - Found in:
   - Supabase Dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Or from Admin Panel > Supabase > Settings (if already configured)

2. **Anon Key (Publishable Key)** - Found in:
   - Supabase Dashboard > Project Settings > API > `anon` `public` key
   - This is the key used for frontend/client-side operations

3. **Service Role Key** (Optional for frontend, but needed for admin operations):
   - Supabase Dashboard > Project Settings > API > `service_role` `secret` key

## Quick Setup Options:

### Option 1: If you've already configured Admin Panel
1. Open your app in browser
2. Go to Admin > Supabase > Settings
3. Click "Export Config" button
4. Save the JSON file
5. Run: `node scripts/setup-supabase-env.js` (it will read the exported file)

### Option 2: Manual Setup
1. Get your Project Reference ID from Supabase Dashboard URL
2. Get your Anon Key from Project Settings > API
3. Create `.env` file in project root:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE
   VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
   ```
4. Update `supabase/config.toml` line 1:
   ```toml
   project_id = "YOUR_PROJECT_REF"
   ```

### Option 3: Use the setup script
```bash
node scripts/setup-supabase-env.js YOUR_PROJECT_REF YOUR_ANON_KEY
```

