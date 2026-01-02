import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('template-operations');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();
    logger.info('Template operation', { action });

    // ==================== PERSONA TEMPLATES ====================
    if (action === 'get_persona_templates') {
      const { data, error } = await supabase
        .from('persona_templates')
        .select(`*, category:persona_categories(name, slug, icon)`)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('use_count', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'increment_persona_template_use') {
      const { templateId } = params;
      const { data: template } = await supabase
        .from('persona_templates')
        .select('use_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await supabase
          .from('persona_templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', templateId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== PROMPT TEMPLATES ====================
    if (action === 'get_prompt_templates') {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select(`*, category:prompt_categories(name, slug, icon)`)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('use_count', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'increment_prompt_template_use') {
      const { templateId } = params;
      const { data: template } = await supabase
        .from('prompt_templates')
        .select('use_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await supabase
          .from('prompt_templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', templateId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== SPACE TEMPLATES ====================
    if (action === 'get_space_templates') {
      const { data, error } = await supabase
        .from('space_templates')
        .select(`*, category:space_categories(name, slug, icon)`)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('use_count', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'increment_space_template_use') {
      const { templateId } = params;
      const { data: template } = await supabase
        .from('space_templates')
        .select('use_count')
        .eq('id', templateId)
        .single();

      if (template) {
        await supabase
          .from('space_templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', templateId);
      }

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
