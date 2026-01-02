import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, type CosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tool-id, x-workspace-id',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('spork-tool-api');
  logger.start();
  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tool and workspace IDs from headers
    const toolId = req.headers.get('x-tool-id');
    const workspaceId = req.headers.get('x-workspace-id');
    const authHeader = req.headers.get('authorization');

    if (!toolId || !workspaceId) {
      logger.warn('Missing required headers', { toolId: !!toolId, workspaceId: !!workspaceId });
      return new Response(
        JSON.stringify({ error: 'Missing tool ID or workspace ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify tool is installed in workspace
    const { data: installation, error: installError } = await supabase
      .from('spork_tool_installations')
      .select('*, tool:spork_tools(*)')
      .eq('tool_id', toolId)
      .eq('workspace_id', workspaceId)
      .eq('is_enabled', true)
      .single();

    if (installError || !installation) {
      logger.warn('Tool not installed or disabled', { toolId, workspaceId });
      return new Response(
        JSON.stringify({ error: 'Tool not installed or disabled in this workspace' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tool = installation.tool;
    const permissions = tool?.permissions || [];

    // Parse request body
    const body = await req.json();
    const { action, params } = body;

    logger.info('Processing tool API action', { toolId, action, workspaceId });

    // Route API calls based on action
    let result: any;

    switch (action) {
      // Workspace APIs
      case 'workspace.getCurrent':
        if (!permissions.includes('workspace')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have workspace permission');
        }
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id, name, description, created_at')
          .eq('id', workspaceId)
          .single();
        result = workspace;
        break;

      case 'workspace.getMembers':
        if (!permissions.includes('workspace')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have workspace permission');
        }
        const { data: members } = await supabase
          .from('workspace_members')
          .select('user_id, role, profiles(email, first_name, last_name)')
          .eq('workspace_id', workspaceId);
        result = members;
        break;

      case 'workspace.getActivity':
        if (!permissions.includes('workspace')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have workspace permission');
        }
        const { data: activity } = await supabase
          .from('workspace_activity')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(params?.limit || 20);
        result = activity;
        break;

      // File APIs
      case 'files.list':
        if (!permissions.includes('files')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have files permission');
        }
        const { data: files } = await supabase
          .from('workspace_files')
          .select('id, file_name, file_type, file_size, created_at')
          .eq('workspace_id', workspaceId);
        result = files;
        break;

      // Storage APIs (tool-specific key-value store)
      case 'storage.get':
        if (!permissions.includes('storage')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have storage permission');
        }
        // Store in installation config
        result = installation.config?.[params?.key] || null;
        break;

      case 'storage.set':
        if (!permissions.includes('storage')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have storage permission');
        }
        const newConfig = { ...(installation.config || {}), [params?.key]: params?.value };
        await supabase
          .from('spork_tool_installations')
          .update({ config: newConfig })
          .eq('id', installation.id);
        result = { success: true };
        break;

      case 'storage.delete':
        if (!permissions.includes('storage')) {
          throw createCosmoError('PERMISSION_DENIED', 'Tool does not have storage permission');
        }
        const updatedConfig = { ...(installation.config || {}) };
        delete updatedConfig[params?.key];
        await supabase
          .from('spork_tool_installations')
          .update({ config: updatedConfig })
          .eq('id', installation.id);
        result = { success: true };
        break;

      default:
        throw createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    }

    logger.complete(Date.now() - startTime, { action, toolId });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
