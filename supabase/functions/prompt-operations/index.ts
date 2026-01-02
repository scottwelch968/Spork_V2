import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('prompt-operations');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Authorization header required');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      const error = createCosmoError('UNAUTHORIZED', 'User not authenticated');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();
    logger.info('Prompt operation', { action, userId: user.id });

    // ==================== PERSONAL PROMPTS ====================
    if (action === 'get_personal_prompts') {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_personal_prompt') {
      const { title, content, category } = params;
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title,
          content,
          category,
          user_id: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_personal_prompt') {
      const { promptId, title, content, category } = params;
      const { data, error } = await supabase
        .from('prompts')
        .update({ title, content, category })
        .eq('id', promptId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_personal_prompt') {
      const { promptId } = params;
      
      // Check if default
      const { data: prompt } = await supabase
        .from('prompts')
        .select('is_default')
        .eq('id', promptId)
        .single();

      if (prompt?.is_default) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot delete the default prompt');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', promptId)
        .eq('user_id', user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'track_prompt_usage') {
      const { promptId } = params;
      const { error } = await supabase
        .from('prompts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', promptId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== SPACE PROMPTS ====================
    if (action === 'get_space_prompts') {
      const { spaceId } = params;
      const { data, error } = await supabase
        .from('space_prompts')
        .select('*')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_space_prompt') {
      const { spaceId, title, content, category } = params;
      const { data, error } = await supabase
        .from('space_prompts')
        .insert({
          space_id: spaceId,
          title,
          content,
          category,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_space_prompt') {
      const { promptId, title, content, category } = params;
      const { data, error } = await supabase
        .from('space_prompts')
        .update({ title, content, category })
        .eq('id', promptId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_space_prompt') {
      const { promptId } = params;
      
      const { data: prompt } = await supabase
        .from('space_prompts')
        .select('is_default')
        .eq('id', promptId)
        .single();

      if (prompt?.is_default) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot delete the default prompt');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('space_prompts')
        .delete()
        .eq('id', promptId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'track_space_prompt_usage') {
      const { promptId } = params;
      const { error } = await supabase
        .from('space_prompts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', promptId);

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
