import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('tool-operations');
  
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
    logger.info('Tool operation', { action, userId: user.id });

    if (action === 'get_published_tools') {
      const { data, error } = await supabase
        .from('spork_tools')
        .select(`*, creator:profiles!spork_tools_creator_id_fkey(email, first_name, last_name)`)
        .eq('status', 'published')
        .order('install_count', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_my_tools') {
      const { data, error } = await supabase
        .from('spork_tools')
        .select('*')
        .eq('creator_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_workspace_installations') {
      const { workspaceId } = params;
      const { data, error } = await supabase
        .from('spork_tool_installations')
        .select(`*, tool:spork_tools(*)`)
        .eq('workspace_id', workspaceId)
        .eq('install_context', 'workspace')
        .eq('is_enabled', true);

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_personal_installations') {
      const { data, error } = await supabase
        .from('spork_tool_installations')
        .select(`*, tool:spork_tools(*)`)
        .eq('user_id', user.id)
        .eq('install_context', 'personal')
        .eq('is_enabled', true);

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'install_to_workspace') {
      const { toolId, workspaceId } = params;
      
      // Get tool version
      const { data: tool, error: toolError } = await supabase
        .from('spork_tools')
        .select('current_version, install_count')
        .eq('id', toolId)
        .single();
      
      if (toolError) throw toolError;

      const { data, error } = await supabase
        .from('spork_tool_installations')
        .insert({
          tool_id: toolId,
          workspace_id: workspaceId,
          installed_by: user.id,
          installed_version: tool.current_version,
          install_context: 'workspace',
        })
        .select()
        .single();
      
      if (error) throw error;

      // Increment install count
      await supabase
        .from('spork_tools')
        .update({ install_count: (tool.install_count || 0) + 1 })
        .eq('id', toolId);

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'install_to_personal') {
      const { toolId } = params;
      
      const { data: tool, error: toolError } = await supabase
        .from('spork_tools')
        .select('current_version, install_count')
        .eq('id', toolId)
        .single();
      
      if (toolError) throw toolError;

      const { data, error } = await supabase
        .from('spork_tool_installations')
        .insert({
          tool_id: toolId,
          user_id: user.id,
          installed_by: user.id,
          installed_version: tool.current_version,
          install_context: 'personal',
        })
        .select()
        .single();
      
      if (error) throw error;

      await supabase
        .from('spork_tools')
        .update({ install_count: (tool.install_count || 0) + 1 })
        .eq('id', toolId);

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'uninstall_from_workspace') {
      const { toolId, workspaceId } = params;
      const { error } = await supabase
        .from('spork_tool_installations')
        .delete()
        .eq('tool_id', toolId)
        .eq('workspace_id', workspaceId)
        .eq('install_context', 'workspace');

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'uninstall_from_personal') {
      const { toolId } = params;
      const { error } = await supabase
        .from('spork_tool_installations')
        .delete()
        .eq('tool_id', toolId)
        .eq('user_id', user.id)
        .eq('install_context', 'personal');

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== ADMIN OPERATIONS ====================

    if (action === 'get_all_tools') {
      const { data, error } = await supabase
        .from('spork_tools')
        .select(`*, creator:profiles!spork_tools_creator_id_fkey(email, first_name, last_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'publish_tool') {
      const { toolId, changelog } = params;
      
      // Get current tool data
      const { data: tool, error: toolError } = await supabase
        .from('spork_tools')
        .select('current_version')
        .eq('id', toolId)
        .single();
      
      if (toolError) throw toolError;

      // Get tool files
      const { data: files, error: filesError } = await supabase
        .from('spork_tool_files')
        .select('file_path, content')
        .eq('tool_id', toolId);
      
      if (filesError) throw filesError;

      // Create version snapshot
      const filesSnapshot: Record<string, string> = {};
      files?.forEach(f => {
        filesSnapshot[f.file_path] = f.content;
      });

      // Create version record
      const { error: versionError } = await supabase
        .from('spork_tool_versions')
        .insert({
          tool_id: toolId,
          version: tool.current_version,
          changelog: changelog || null,
          files_snapshot: filesSnapshot,
          published_by: user.id,
        });
      
      if (versionError) throw versionError;

      // Update tool status
      const { error: updateError } = await supabase
        .from('spork_tools')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', toolId);
      
      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_tool_status') {
      const { toolId, status } = params;
      
      const { error } = await supabase
        .from('spork_tools')
        .update({ status })
        .eq('id', toolId);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle_featured') {
      const { toolId, isFeatured } = params;
      
      const { error } = await supabase
        .from('spork_tools')
        .update({ is_featured: isFeatured })
        .eq('id', toolId);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_tool_appearance') {
      const { toolId, display_mode, icon, image_url, color_code } = params;
      
      const { error } = await supabase
        .from('spork_tools')
        .update({ display_mode, icon, image_url, color_code })
        .eq('id', toolId);
      
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_tool') {
      const { toolId } = params;
      
      const { error } = await supabase
        .from('spork_tools')
        .delete()
        .eq('id', toolId);
      
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
