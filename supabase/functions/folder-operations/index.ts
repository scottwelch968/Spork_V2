/**
 * Folder Operations Edge Function
 * 
 * Handles CRUD operations for folders and chat_folders.
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

async function verifyWorkspaceAccess(supabase: any, userId: string, workspaceId: string): Promise<boolean> {
  // Check if user owns the workspace
  const { data: ownedWorkspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .single();
  
  if (ownedWorkspace) return true;
  
  // Check if user is a member
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  
  return !!membership;
}

serve(async (req) => {
  const logger = createLogger('folder-operations');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Authorization header required');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      const error = createCosmoError('UNAUTHORIZED', 'User not authenticated');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, workspace_id, ...params } = await req.json();
    logger.info('Processing action', { action, workspaceId: workspace_id, userId: user.id });

    // Verify workspace access for operations that need it
    if (workspace_id) {
      const hasAccess = await verifyWorkspaceAccess(supabase, user.id, workspace_id);
      if (!hasAccess) {
        const error = createCosmoError('PERMISSION_DENIED', 'Not authorized to access this workspace');
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let result;

    switch (action) {
      case 'list_folders': {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('workspace_id', workspace_id)
          .order('name', { ascending: true });

        if (error) throw error;
        result = { folders: data };
        break;
      }

      case 'create_folder': {
        const { name, color } = params;
        const { data, error } = await supabase
          .from('folders')
          .insert({
            name,
            color: color || null,
            workspace_id,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        result = { folder: data };
        break;
      }

      case 'update_folder': {
        const { folder_id, name, color } = params;
        const { data, error } = await supabase
          .from('folders')
          .update({ name, color })
          .eq('id', folder_id)
          .eq('workspace_id', workspace_id)
          .select()
          .single();

        if (error) throw error;
        result = { folder: data };
        break;
      }

      case 'delete_folder': {
        const { folder_id } = params;
        
        // First, remove all chat associations
        await supabase.from('chat_folders').delete().eq('folder_id', folder_id);

        // Then delete the folder
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', folder_id)
          .eq('workspace_id', workspace_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'add_chat_to_folder': {
        const { chat_id, folder_id } = params;
        
        // Remove chat from any existing folders first
        await supabase.from('chat_folders').delete().eq('chat_id', chat_id);

        // Add to new folder
        const { error } = await supabase
          .from('chat_folders')
          .insert({ chat_id, folder_id });

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'remove_chat_from_folder': {
        const { chat_id } = params;
        const { error } = await supabase
          .from('chat_folders')
          .delete()
          .eq('chat_id', chat_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_chat_folder': {
        const { chat_id } = params;
        const { data, error } = await supabase
          .from('chat_folders')
          .select('folder_id')
          .eq('chat_id', chat_id)
          .maybeSingle();

        if (error) throw error;
        result = { folder_id: data?.folder_id || null };
        break;
      }

      case 'get_folder_chats': {
        const { folder_id } = params;
        const { data, error } = await supabase
          .from('chat_folders')
          .select('chat_id')
          .eq('folder_id', folder_id);

        if (error) throw error;
        result = { chat_ids: data?.map((item: any) => item.chat_id) || [] };
        break;
      }

      default: {
        const error = createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
        return new Response(
          JSON.stringify({ error: error.message, code: error.code }),
          { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    logger.complete(Date.now() - startTime, { action });

    return new Response(
      JSON.stringify(result),
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
