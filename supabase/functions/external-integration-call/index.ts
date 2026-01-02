/**
 * External Integration Call Edge Function
 * 
 * Executes authenticated calls to external providers.
 * Used by App Store items (tools, assistants, agents) to interact with external services.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ExternalIntegrationHandler } from '../_shared/cosmo/externalIntegration.ts';
import { validateAppRequest, isOperationAllowed } from '../_shared/cosmo/appProtocol.ts';
import type { ExternalOperationRequest, CosmoAppRequest } from '../_shared/cosmo/types.ts';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('external-integration-call');
  
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
    const body = await req.json();
    const {
      providerKey,
      operation,
      payload,
      workspaceId,
      preferWorkspaceIntegration,
      requiredScopes,
      // App item context (if called from an app)
      appItemId,
      appItemType,
      appItemName,
      appPermissions,
    } = body;

    // Validate required fields
    if (!providerKey || !operation) {
      return new Response(
        JSON.stringify({ error: 'providerKey and operation are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If called from an app item, validate permissions
    if (appItemId && appItemType) {
      const appRequest: CosmoAppRequest = {
        appItemId,
        appItemType,
        appItemName: appItemName || 'Unknown App',
        workspaceId: workspaceId || '',
        userId: user.id,
        operation: 'external.call',
        payload: { providerKey, operation },
        context: {
          installedVersion: '1.0.0',
          permissions: appPermissions || [],
        },
      };

      const validationResult = validateAppRequest(appRequest);
      if (validationResult) {
        return new Response(
          JSON.stringify(validationResult),
          { 
            status: validationResult.denied?.httpStatus || 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create integration handler
    const handler = new ExternalIntegrationHandler(supabaseUrl, supabaseServiceKey);

    // Build external operation request
    const externalRequest: ExternalOperationRequest = {
      appItemId,
      appItemType,
      userId: user.id,
      workspaceId,
      providerKey,
      operation,
      payload: payload || {},
      preferWorkspaceIntegration: preferWorkspaceIntegration ?? false,
      requiredScopes,
    };

    // Execute the call
    const result = await handler.executeExternalCall(externalRequest);

    logger.info('External call completed', {
      providerKey,
      operation,
      userId: user.id,
      success: result.success,
      operationTimeMs: result.operationTimeMs,
    });

    const httpStatus = result.success ? 200 : 
                       result.error?.code === 'credential_missing' ? 404 :
                       result.error?.code === 'credential_expired' ? 401 :
                       result.error?.code === 'scope_insufficient' ? 403 :
                       result.error?.code === 'rate_limited' ? 429 : 500;

    return new Response(
      JSON.stringify(result),
      { status: httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'provider_error',
          message: errorMessage,
          requiresReauth: false,
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
