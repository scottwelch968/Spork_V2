# Spork Required Secrets

List of all environment variables and secrets required for the Spork application.

## Supabase Secrets

These are automatically provided by Supabase and must be configured in your project:

| Secret Name | Description | Required | Where Used |
|-------------|-------------|----------|------------|
| `SUPABASE_URL` | Your Supabase project URL | Yes | All edge functions, client config |
| `SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes | Client-side authentication |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | Yes | Edge functions requiring admin operations |
| `SUPABASE_DB_URL` | Direct database connection URL | Optional | Direct DB access if needed |
| `SUPABASE_PUBLISHABLE_KEY` | Alias for SUPABASE_ANON_KEY | Optional | Legacy compatibility |

## AI Provider Secrets

| Secret Name | Description | Required | Where Used |
|-------------|-------------|----------|------------|
| `LOVABLE_API_KEY` | API key for Lovable AI Gateway | Yes | chat, generate-image, query-knowledge-base |
| `OPENROUTER_API_KEY` | API key for OpenRouter | Yes | chat (fallback), sync-openrouter-models |
| `REPLICATE_API_KEY` | API key for Replicate (video generation) | Optional | Video generation features |

## Email Provider Secrets

| Secret Name | Description | Required | Where Used |
|-------------|-------------|----------|------------|
| `RESEND_API_KEY` | API key for Resend email service | Yes* | send-email function |
| `SENDGRID_API_KEY` | API key for SendGrid | Optional | send-email (if configured) |
| `MAILGUN_API_KEY` | API key for Mailgun | Optional | send-email (if configured) |

*At least one email provider API key is required for email functionality.

## Payment Provider Secrets

These are stored in the `payment_processors` database table, not as environment variables:

| Config Key | Description | Where Configured |
|------------|-------------|------------------|
| `stripe_secret_key` | Stripe secret API key | Admin > Billing > Payment Processors |
| `stripe_webhook_secret` | Stripe webhook signing secret | Admin > Billing > Payment Processors |
| `paypal_client_id` | PayPal client ID | Admin > Billing > Payment Processors |
| `paypal_client_secret` | PayPal client secret | Admin > Billing > Payment Processors |

---

## Setting Up Secrets

### In Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add each secret under **Secrets**

### Via Supabase CLI

```bash
# Set a secret
supabase secrets set OPENROUTER_API_KEY=your_api_key_here

# Set multiple secrets
supabase secrets set \
  LOVABLE_API_KEY=xxx \
  OPENROUTER_API_KEY=yyy \
  RESEND_API_KEY=zzz

# List secrets (names only)
supabase secrets list
```

### In Lovable Cloud

If using Lovable Cloud, secrets are managed through the Lovable interface:

1. Open your project in Lovable
2. Navigate to the secrets/environment panel
3. Add required secrets

---

## Frontend Environment Variables

These are public environment variables used in the frontend (stored in `.env`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Note:** These are PUBLIC keys and safe to expose in client-side code. Never expose service role keys or API secrets in frontend code.

---

## Obtaining API Keys

### Lovable AI Gateway
- Contact Lovable support for API access
- Used for Google (Gemini) and OpenAI models through Lovable's gateway

### OpenRouter
1. Create account at [openrouter.ai](https://openrouter.ai)
2. Navigate to Keys section
3. Create new API key
4. Copy and store securely

### Resend
1. Create account at [resend.com](https://resend.com)
2. Verify your domain
3. Navigate to API Keys
4. Create new key with appropriate permissions

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Navigate to Developers → API keys
3. Use test keys for development, live keys for production
4. Set up webhook endpoint and copy signing secret

### PayPal
1. Create developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create app in Dashboard
3. Copy Client ID and Secret

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`

2. **Rotate keys regularly**
   - Set up key rotation schedule
   - Update secrets in all environments

3. **Use least privilege**
   - Create API keys with minimal required permissions
   - Use separate keys for development and production

4. **Monitor usage**
   - Set up alerts for unusual API usage
   - Review access logs regularly

5. **Secure storage**
   - Store secrets in encrypted secret managers
   - Never log or display secret values
