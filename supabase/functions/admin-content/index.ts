import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('admin-content');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();
    logger.info('Admin content operation', { action });

    // ==================== CREDIT PACKAGES ====================
    if (action === 'get_credit_packages') {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_credit_package') {
      const { packageData } = params;
      const { data, error } = await supabase
        .from('credit_packages')
        .insert(packageData)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_credit_package') {
      const { packageId, updates } = params;
      const { data, error } = await supabase
        .from('credit_packages')
        .update(updates)
        .eq('id', packageId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_credit_package') {
      const { packageId } = params;
      const { error } = await supabase
        .from('credit_packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== ADMIN DOCUMENTATION ====================
    if (action === 'get_documentation') {
      const { category } = params;
      let query = supabase
        .from('admin_documentation')
        .select('*')
        .order('display_order');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_documentation') {
      const { docData } = params;
      const { data, error } = await supabase
        .from('admin_documentation')
        .insert(docData)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_documentation') {
      const { docId, updates } = params;
      const { data, error } = await supabase
        .from('admin_documentation')
        .update(updates)
        .eq('id', docId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_documentation') {
      const { docId } = params;
      const { error } = await supabase
        .from('admin_documentation')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const error = createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    return new Response(JSON.stringify({ error: error.message, code: error.code }), {
      status: error.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
