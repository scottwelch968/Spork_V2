/**
 * External OAuth Callback Edge Function
 * 
 * Handles OAuth callback from external providers.
 * Exchanges authorization code for tokens and stores integration.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ExternalIntegrationHandler } from '../_shared/cosmo/externalIntegration.ts';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('external-oauth-callback');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get query parameters
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth error from provider
    if (error) {
      logger.error('OAuth provider error', { error, errorDescription });
      return generateErrorRedirect(error, errorDescription || 'OAuth authorization failed');
    }

    // Validate required parameters
    if (!code || !state) {
      return generateErrorRedirect('missing_params', 'Missing code or state parameter');
    }

    // Create integration handler
    const handler = new ExternalIntegrationHandler(supabaseUrl, supabaseServiceKey);

    // Handle the callback
    const result = await handler.handleOAuthCallback(code, state);

    if (!result.success) {
      logger.error('OAuth callback failed', { error: result.error });
      return generateErrorRedirect('callback_failed', result.error || 'Failed to complete OAuth flow');
    }

    logger.info('OAuth callback successful', { integrationId: result.integrationId });

    // Redirect to success page
    // In production, this would redirect to the app's integrations page
    const successUrl = new URL('/settings/integrations', supabaseUrl.replace('supabase.co', 'lovable.app'));
    successUrl.searchParams.set('connected', 'true');
    successUrl.searchParams.set('integrationId', result.integrationId || '');

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': successUrl.toString(),
      },
    });

  } catch (error) {
    logger.fail(error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return generateErrorRedirect('internal_error', errorMessage);
  }
});

/**
 * Generate a redirect to an error page
 */
function generateErrorRedirect(code: string, message: string): Response {
  // In production, redirect to app's error page
  const errorHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Integration Error</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 { color: #e11d48; margin-bottom: 0.5rem; }
          p { color: #6b7280; }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Connection Failed</h1>
          <p>${message}</p>
          <p style="font-size: 0.875rem; color: #9ca3af;">Error code: ${code}</p>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
    </html>
  `;

  return new Response(errorHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
