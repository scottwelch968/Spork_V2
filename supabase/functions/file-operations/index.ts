import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('file-operations');
  
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
    logger.info('File operation', { action, userId: user.id });

    // ==================== USER FILES ====================
    if (action === 'get_user_files') {
      const { folderId } = params;
      let query = supabase
        .from('user_files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (folderId !== undefined) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_workspace_files') {
      const { workspaceId } = params;
      const { data, error } = await supabase
        .from('workspace_files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_file_record') {
      const { tableName, fileData } = params;
      const { data, error } = await supabase
        .from(tableName)
        .insert(fileData)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_file') {
      const { tableName, fileId } = params;
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'move_file') {
      const { tableName, fileId, folderId } = params;
      const { error } = await supabase
        .from(tableName)
        .update({ folder_id: folderId })
        .eq('id', fileId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'rename_file') {
      const { tableName, fileId, newName } = params;
      const { error } = await supabase
        .from(tableName)
        .update({ original_name: newName })
        .eq('id', fileId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'toggle_favorite') {
      const { tableName, fileId, isFavorite } = params;
      const { error } = await supabase
        .from(tableName)
        .update({ is_favorite: !isFavorite })
        .eq('id', fileId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== FOLDERS ====================
    if (action === 'get_folders') {
      const { ownerType, workspaceId } = params;
      let query = supabase
        .from('file_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (ownerType === 'workspace' && workspaceId) {
        query = query.eq('owner_type', 'workspace').eq('workspace_id', workspaceId);
      } else {
        query = query.eq('owner_type', 'user');
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_folder') {
      const { name, parentId, ownerType, workspaceId } = params;
      const { data, error } = await supabase
        .from('file_folders')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId || null,
          parent_id: parentId || null,
          name,
          owner_type: ownerType || 'user',
          folder_type: 'custom',
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_folder') {
      const { folderId, tableName } = params;
      
      // Check if system folder
      const { data: folder } = await supabase
        .from('file_folders')
        .select('is_system_folder')
        .eq('id', folderId)
        .single();

      if (folder?.is_system_folder) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot delete system folder');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Move files out of folder
      await supabase
        .from(tableName)
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      const { error } = await supabase
        .from('file_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'rename_folder') {
      const { folderId, newName } = params;
      
      const { data: folder } = await supabase
        .from('file_folders')
        .select('is_system_folder')
        .eq('id', folderId)
        .single();

      if (folder?.is_system_folder) {
        const error = createCosmoError('PERMISSION_DENIED', 'Cannot rename system folder');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('file_folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_workspace_folders') {
      // Get workspaces user owns or is a member of
      const [ownedResult, memberResult] = await Promise.all([
        supabase
          .from('workspaces')
          .select('id, name, owner_id')
          .eq('owner_id', user.id),
        supabase
          .from('workspace_members')
          .select('workspace_id, workspaces!inner(id, name, owner_id)')
          .eq('user_id', user.id),
      ]);

      const workspaceMap = new Map();

      ownedResult.data?.forEach(ws => {
        workspaceMap.set(ws.id, {
          id: ws.id,
          workspace_id: ws.id,
          workspace_name: ws.name,
          owner_id: ws.owner_id,
          is_owner: true,
        });
      });

      memberResult.data?.forEach(m => {
        const ws = m.workspaces as any;
        if (ws && !workspaceMap.has(ws.id)) {
          workspaceMap.set(ws.id, {
            id: ws.id,
            workspace_id: ws.id,
            workspace_name: ws.name,
            owner_id: ws.owner_id,
            is_owner: false,
          });
        }
      });

      return new Response(JSON.stringify({ data: Array.from(workspaceMap.values()) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== KNOWLEDGE BASE OPERATIONS ====================

    if (action === 'get_knowledge_base') {
      const { workspace_id } = params;
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_knowledge_doc') {
      const { workspace_id, title, file_name, file_type, file_size, storage_path } = params;
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: user.id,
          workspace_id,
          title: title || file_name,
          file_name,
          file_type,
          file_size,
          storage_path,
          content: '',
          chunks: [],
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_knowledge_doc') {
      const { document_id } = params;
      
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', document_id);

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
