# Deploying Spork to External Supabase

This guide explains how to migrate your Spork installation from Lovable Cloud to your own Supabase project.

## Prerequisites

1. A Supabase account (https://supabase.com)
2. Supabase CLI installed (`npm install -g supabase`)
3. Node.js 18+ installed

## Step 1: Create a New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization and set project name/password
4. Wait for project to be ready

## Step 2: Export Database from Lovable Cloud

1. In your Spork admin panel, go to **Environment Management → Export**
2. Select all export options (Schema, Functions, RLS, Data)
3. Click "Generate SQL Export"
4. Download the `.sql` file

## Step 3: Import Database to New Project

1. Go to your new Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the contents of your exported `.sql` file
5. Run the query (this may take a few minutes)

## Step 4: Configure Secrets

In your Supabase dashboard, go to **Settings → Edge Functions → Secrets** and add:

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for AI models | Yes |
| `RESEND_API_KEY` | Your Resend API key for emails | Yes |
| `REPLICATE_API_KEY` | Your Replicate API key for image/video | Optional |
| `LOVABLE_API_KEY` | Lovable AI gateway key (fallback) | Optional |

## Step 5: Deploy Edge Functions

From your project root directory:

```bash
# Login to Supabase
supabase login

# Link to your new project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all edge functions
supabase functions deploy

# Or deploy individual functions:
supabase functions deploy chat
supabase functions deploy generate-image
supabase functions deploy send-email
# ... etc
```

## Step 6: Update Frontend Configuration

Update your `.env` file with new Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

## Step 7: Configure Authentication

1. Go to **Authentication → Providers** in Supabase dashboard
2. Enable Email provider
3. (Optional) Configure Google OAuth with your own credentials
4. Update redirect URLs to point to your domain

## Step 8: Configure Storage

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `knowledge-base` (private)
   - `app-media` (public)
   - `user-files` (public)
3. Set appropriate bucket policies

## Step 9: Deploy Frontend

Build and deploy your frontend to your preferred hosting:

```bash
npm run build
# Deploy dist/ folder to Vercel, Netlify, or your own server
```

## Troubleshooting

### Database Import Errors

If you get foreign key errors during import, run the schema import first (without data), then import data separately.

### Edge Function Errors

Check that all required secrets are configured. View function logs in Supabase dashboard under **Edge Functions → Logs**.

### Authentication Issues

Ensure your site URL and redirect URLs are correctly configured in **Authentication → URL Configuration**.

## Support

For issues specific to Spork, check the project documentation.
For Supabase-specific issues, see https://supabase.com/docs
