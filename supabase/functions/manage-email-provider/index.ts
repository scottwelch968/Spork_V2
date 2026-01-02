import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  const logger = createLogger('manage-email-provider');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Missing authorization header');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.httpStatus,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const error = createCosmoError('UNAUTHORIZED', 'User not found');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.httpStatus,
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      const error = createCosmoError('PERMISSION_DENIED', 'Admin access required');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.httpStatus,
      });
    }

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case "list":
        result = await listProviders(supabase);
        break;
      case "create":
        result = await createProvider(supabase, params);
        break;
      case "update":
        result = await updateProvider(supabase, params);
        break;
      case "delete":
        result = await deleteProvider(supabase, params);
        break;
      case "activate":
        result = await activateProvider(supabase, params);
        break;
      case "test":
        result = await testProvider(supabase, params);
        break;
      default:
        const error = createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: error.httpStatus,
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: cosmoError.httpStatus,
    });
  }
});

async function listProviders(supabase: any) {
  const { data, error } = await supabase
    .from("email_providers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { providers: data };
}

async function createProvider(supabase: any, params: any) {
  const { data, error } = await supabase
    .from("email_providers")
    .insert({
      name: params.name,
      provider_type: params.provider_type,
      description: params.description,
      logo_url: params.logo_url,
      documentation_url: params.documentation_url,
      sdk_package: params.sdk_package,
      api_endpoint: params.api_endpoint,
      config_schema: params.config_schema || [],
      config_values: {},
      is_active: false,
    })
    .select()
    .single();

  if (error) throw error;
  return { provider: data };
}

async function updateProvider(supabase: any, params: any) {
  const { id, ...updates } = params;

  const { data, error } = await supabase
    .from("email_providers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return { provider: data };
}

async function deleteProvider(supabase: any, params: any) {
  const { error } = await supabase
    .from("email_providers")
    .delete()
    .eq("id", params.id);

  if (error) throw error;
  return { success: true };
}

async function activateProvider(supabase: any, params: any) {
  // Deactivate all providers first
  await supabase
    .from("email_providers")
    .update({ is_active: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  // Activate the selected provider
  const { data, error } = await supabase
    .from("email_providers")
    .update({ is_active: true })
    .eq("id", params.id)
    .select()
    .single();

  if (error) throw error;
  return { provider: data };
}

async function testProvider(supabase: any, params: any) {
  const { data: provider, error } = await supabase
    .from("email_providers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) throw error;

  try {
    // Attempt to initialize the provider's SDK or make a test API call
    switch (provider.provider_type) {
      case "resend":
        const { Resend } = await import("https://esm.sh/resend@2.0.0");
        const resend = new Resend(provider.config_values.api_key);
        // Resend doesn't have a dedicated test endpoint, so we just verify the key exists
        if (!provider.config_values.api_key) {
          throw createCosmoError('CONFIG_MISSING', "API key not configured");
        }
        break;

      case "mailtrap":
        if (!provider.config_values.api_token) {
          throw createCosmoError('CONFIG_MISSING', "API token not configured");
        }
        break;

      case "notificationapi":
        if (!provider.config_values.client_id || !provider.config_values.client_secret) {
          throw createCosmoError('CONFIG_MISSING', "Client credentials not configured");
        }
        break;

      case "sendgrid":
      case "mailgun":
        if (!provider.config_values.api_key) {
          throw createCosmoError('CONFIG_MISSING', "API key not configured");
        }
        break;

      case "custom":
        if (!provider.api_endpoint) {
          throw createCosmoError('CONFIG_MISSING', "API endpoint not configured");
        }
        // Test custom endpoint
        const response = await fetch(provider.api_endpoint, {
          method: "HEAD",
          headers: provider.config_values.headers || {},
        });
        if (!response.ok) {
          throw createCosmoError('FUNCTION_FAILED', `API endpoint returned ${response.status}`);
        }
        break;

      default:
        throw createCosmoError('INVALID_PAYLOAD', "Unknown provider type");
    }

    return { success: true, message: "Provider configuration is valid" };
  } catch (error: any) {
    if (isCosmoError(error)) {
      return { success: false, message: error.message, code: error.code };
    }
    return { success: false, message: error.message };
  }
}