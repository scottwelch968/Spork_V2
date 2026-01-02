/**
 * Space Operations Edge Function
 * 
 * Handles workspace and space prompt CRUD operations.
 * Enforces server-authoritative data access.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('space-operations');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Missing authorization header');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      const error = createCosmoError('UNAUTHORIZED', 'Invalid token');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, ...params } = await req.json();
    logger.info('Space operation', { action, userId: user.id });

    // ==================== WORKSPACE OPERATIONS ====================
    
    if (action === 'update_workspace') {
      const { workspace_id, ...updates } = params;
      
      const { error } = await supabase
        .from('workspaces')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', workspace_id);

      if (error) {
        logger.error('Update workspace error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete_workspace') {
      const { workspace_id } = params;
      
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspace_id);

      if (error) {
        logger.error('Delete workspace error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggle_archive') {
      const { workspace_id, is_archived } = params;
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          is_archived: !is_archived,
          archived_at: !is_archived ? new Date().toISOString() : null,
        })
        .eq('id', workspace_id);

      if (error) {
        logger.error('Toggle archive error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, newArchivedState: !is_archived }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'toggle_pin') {
      const { workspace_id, is_pinned } = params;
      
      // Check if default workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('is_default')
        .eq('id', workspace_id)
        .single();

      if (workspace?.is_default && is_pinned) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot unpin the default workspace');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabase
        .from('user_space_assignments')
        .upsert({
          user_id: user.id,
          space_id: workspace_id,
          is_pinned: !is_pinned,
        }, {
          onConflict: 'user_id,space_id',
        });

      if (error) {
        logger.error('Toggle pin error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== SPACE PROMPT OPERATIONS ====================

    if (action === 'get_space_prompts') {
      const { space_id } = params;
      
      const { data, error } = await supabase
        .from('space_prompts')
        .select('*')
        .eq('space_id', space_id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Get space prompts error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_space_prompt') {
      const { space_id, title, content, category } = params;
      
      const { data, error } = await supabase
        .from('space_prompts')
        .insert({
          space_id,
          title,
          content,
          category: category || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create space prompt error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update_space_prompt') {
      const { prompt_id, ...updates } = params;
      
      const { error } = await supabase
        .from('space_prompts')
        .update(updates)
        .eq('id', prompt_id);

      if (error) {
        logger.error('Update space prompt error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete_space_prompt') {
      const { prompt_id } = params;
      
      // Check if default prompt
      const { data: prompt } = await supabase
        .from('space_prompts')
        .select('is_default')
        .eq('id', prompt_id)
        .single();

      if (prompt?.is_default) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot delete the default prompt');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { error } = await supabase
        .from('space_prompts')
        .delete()
        .eq('id', prompt_id);

      if (error) {
        logger.error('Delete space prompt error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'track_prompt_usage') {
      const { prompt_id } = params;
      
      const { error } = await supabase
        .from('space_prompts')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', prompt_id);

      if (error) {
        logger.error('Track prompt usage error', { error: error.message });
        // Don't fail the request for usage tracking
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown action
    const error = createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    return new Response(JSON.stringify({ error: error.message, code: error.code }), {
      status: error.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
