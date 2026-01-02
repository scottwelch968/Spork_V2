/**
 * Chat Messages Edge Function
 * 
 * Handles CRUD operations for chats and messages.
 * Enforces server-authoritative data access.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, toExecutionError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('chat-messages');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      const error = createCosmoError('UNAUTHORIZED', 'Missing authorization header');
      return new Response(JSON.stringify(toExecutionError(error)), {
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
      return new Response(JSON.stringify(toExecutionError(error)), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, ...params } = await req.json();
    logger.info('Chat messages action', { action, userId: user.id });

    // ==================== CREATE CHAT ====================
    if (action === 'create_chat') {
      const { title, model, persona_id, workspace_id } = params;
      
      const { data: chat, error } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: title || 'New Chat',
          model: model || 'default',
          persona_id: persona_id || null,
          workspace_id: workspace_id || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create chat error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: chat }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== ADD MESSAGE ====================
    if (action === 'add_message') {
      const { chat_id, role, content, model } = params;
      
      if (!chat_id || !role || !content) {
        const error = createCosmoError('INVALID_PAYLOAD', 'chat_id, role, and content are required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id,
          role,
          content,
          model: model || null,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Add message error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== GET MESSAGES ====================
    if (action === 'get_messages') {
      const { chat_id } = params;
      
      if (!chat_id) {
        const error = createCosmoError('INVALID_PAYLOAD', 'chat_id is required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Get messages error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== DELETE CHAT ====================
    if (action === 'delete_chat') {
      const { chat_id } = params;
      
      if (!chat_id) {
        const error = createCosmoError('INVALID_PAYLOAD', 'chat_id is required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // First delete messages
      await supabase.from('messages').delete().eq('chat_id', chat_id);
      
      // Then delete chat
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chat_id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Delete chat error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== BATCH SAVE (for persistence queue) ====================
    if (action === 'batch_save') {
      const { operations } = params;
      
      if (!operations || !Array.isArray(operations)) {
        const error = createCosmoError('INVALID_PAYLOAD', 'operations array is required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const results = [];
      for (const op of operations) {
        const { table, data } = op;
        const { error } = await supabase.from(table).insert(data);
        results.push({ table, success: !error, error: error?.message });
      }

      return new Response(JSON.stringify({ data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== SPACE CHATS ====================
    if (action === 'create_space_chat') {
      const { space_id, title, model, persona_id } = params;
      
      const { data: chat, error } = await supabase
        .from('space_chats')
        .insert({
          space_id,
          user_id: user.id,
          title: title || 'New Chat',
          model: model || 'default',
          persona_id: persona_id || null,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create space chat error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: chat }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_space_chats') {
      const { space_id } = params;
      
      const { data: chats, error } = await supabase
        .from('space_chats')
        .select('*')
        .eq('space_id', space_id)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Get space chats error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: chats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update_space_chat') {
      const { chat_id, title } = params;
      
      const { error } = await supabase
        .from('space_chats')
        .update({ title })
        .eq('id', chat_id);

      if (error) {
        logger.error('Update space chat error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'delete_space_chat') {
      const { chat_id } = params;
      
      // Delete messages first
      await supabase.from('space_chat_messages').delete().eq('chat_id', chat_id);
      
      const { error } = await supabase
        .from('space_chats')
        .delete()
        .eq('id', chat_id);

      if (error) {
        logger.error('Delete space chat error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_space_chat_messages') {
      const { chat_id } = params;
      
      const { data: messages, error } = await supabase
        .from('space_chat_messages')
        .select('*, profiles:user_id (first_name, last_name)')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Get space chat messages error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'add_space_message') {
      const { chat_id, role, content, model } = params;
      
      const { data: message, error } = await supabase
        .from('space_chat_messages')
        .insert({
          chat_id,
          user_id: user.id,
          role,
          content,
          model: model || null,
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Add space message error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unknown action
    const error = createCosmoError('INVALID_PAYLOAD', `Unknown action: ${action}`);
    return new Response(JSON.stringify(toExecutionError(error)), {
      status: error.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.fail(error);
    const cosmoError = errorFromException(error);
    return new Response(JSON.stringify(toExecutionError(cosmoError)), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
