/**
 * External OAuth Init Edge Function
 * 
 * Initiates OAuth flow for connecting external providers.
 * Generates authorization URL with CSRF protection.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ExternalIntegrationHandler } from '../_shared/cosmo/externalIntegration.ts';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('external-oauth-init');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { providerKey, workspaceId, scopes, redirectUri, appItemId } = await req.json();

    if (!providerKey) {
      return new Response(
        JSON.stringify({ error: 'providerKey is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine redirect URI
    const callbackUri = redirectUri || `${supabaseUrl}/functions/v1/external-oauth-callback`;

    // Create integration handler
    const handler = new ExternalIntegrationHandler(supabaseUrl, supabaseServiceKey);

    // Generate authorization URL
    const authUrl = await handler.generateAuthUrl(
      providerKey,
      user.id,
      workspaceId,
      callbackUri,
      scopes
    );

    logger.info('OAuth init completed', {
      providerKey,
      userId: user.id,
      workspaceId,
      hasScopes: !!scopes,
    });

    return new Response(
      JSON.stringify({
        authUrl,
        provider: providerKey,
        message: 'Redirect user to authUrl to complete OAuth flow',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
