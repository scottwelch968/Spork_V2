/**
 * External Integration Status Edge Function
 * 
 * Returns connection status for external providers.
 * Used by frontend to show which integrations are connected.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/edgeLogger.ts';
import { createCosmoError, errorFromException, isCosmoError } from '../_shared/cosmo/errors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationStatus {
  providerKey: string;
  connected: boolean;
  status: 'active' | 'expired' | 'error' | 'not_connected';
  source: 'user' | 'workspace' | null;
  externalAccountName?: string;
  externalAccountEmail?: string;
  scopes?: string[];
  lastUsedAt?: string;
  expiresAt?: string;
}

serve(async (req) => {
  const logger = createLogger('external-integration-status');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Authorization header required');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      const error = createCosmoError('UNAUTHORIZED', 'User not authenticated');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { providerKeys, workspaceId } = await req.json();

    // Get all enabled providers
    const { data: providers, error: providersError } = await supabase
      .from('external_providers')
      .select('provider_key, name, category, icon_url')
      .eq('is_enabled', true);

    if (providersError) {
      throw { code: 'FUNCTION_FAILED', message: `Failed to fetch providers: ${providersError.message}`, httpStatus: 500 };
    }

    // Filter providers if specific keys requested
    const targetProviders = providerKeys && providerKeys.length > 0
      ? providers.filter((p: any) => providerKeys.includes(p.provider_key))
      : providers;

    // Get user integrations
    const { data: userIntegrations, error: userIntError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id);

    if (userIntError) {
      throw { code: 'FUNCTION_FAILED', message: `Failed to fetch user integrations: ${userIntError.message}`, httpStatus: 500 };
    }

    // Get workspace integrations if workspace provided
    let workspaceIntegrations: any[] = [];
    if (workspaceId) {
      const { data, error } = await supabase
        .from('workspace_integrations')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (!error) {
        workspaceIntegrations = data || [];
      }
    }

    // Build status for each provider
    const statuses: IntegrationStatus[] = targetProviders.map((provider: any) => {
      // Check user integration first
      const userInt = userIntegrations?.find((i: any) => i.provider_key === provider.provider_key);
      
      if (userInt) {
        const isExpired = userInt.token_expires_at && new Date(userInt.token_expires_at) < new Date();
        return {
          providerKey: provider.provider_key,
          connected: userInt.status === 'active' && !isExpired,
          status: isExpired ? 'expired' : userInt.status,
          source: 'user' as const,
          externalAccountName: userInt.external_account_name,
          externalAccountEmail: userInt.external_account_email,
          scopes: userInt.oauth_scopes,
          lastUsedAt: userInt.last_used_at,
          expiresAt: userInt.token_expires_at,
        };
      }

      // Check workspace integration
      const workspaceInt = workspaceIntegrations.find((i: any) => i.provider_key === provider.provider_key);
      
      if (workspaceInt) {
        const isExpired = workspaceInt.token_expires_at && new Date(workspaceInt.token_expires_at) < new Date();
        return {
          providerKey: provider.provider_key,
          connected: workspaceInt.status === 'active' && !isExpired,
          status: isExpired ? 'expired' : workspaceInt.status,
          source: 'workspace' as const,
          externalAccountName: workspaceInt.external_workspace_name,
          scopes: workspaceInt.oauth_scopes,
          lastUsedAt: workspaceInt.last_used_at,
          expiresAt: workspaceInt.token_expires_at,
        };
      }

      // Not connected
      return {
        providerKey: provider.provider_key,
        connected: false,
        status: 'not_connected' as const,
        source: null,
      };
    });

    // Add provider metadata to response
    const response = {
      integrations: statuses,
      providers: targetProviders.map((p: any) => ({
        providerKey: p.provider_key,
        name: p.name,
        category: p.category,
        iconUrl: p.icon_url,
      })),
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(
      JSON.stringify({ error: cosmoError.message, code: cosmoError.code }),
      { status: cosmoError.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
