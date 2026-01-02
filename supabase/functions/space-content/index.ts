/**
 * Space Content Edge Function
 * 
 * Handles CRUD operations for space_personas and space_prompts.
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
  const logger = createLogger('space-content');
  
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
    logger.info('Space content action', { action, userId: user.id });

    // ==================== CREATE WORKSPACE ====================
    if (action === 'create_workspace') {
      const { name, description, color_code, ai_model, ai_instructions, compliance_rule, file_quota_mb } = params;
      
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          description: description || null,
          color_code: color_code || null,
          owner_id: user.id,
          subscription_tier: 'free',
          ai_model: ai_model || null,
          ai_instructions: ai_instructions || null,
          compliance_rule: compliance_rule || null,
          file_quota_mb: file_quota_mb || 1000,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create workspace error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create assignment for owner
      await supabase.from('user_space_assignments').insert({
        user_id: user.id,
        space_id: workspace.id,
        is_pinned: false,
      });

      return new Response(JSON.stringify({ data: workspace }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== CREATE PERSONA ====================
    if (action === 'create_persona') {
      const { space_id, name, description, system_prompt, icon, is_default } = params;
      
      const { data: persona, error } = await supabase
        .from('space_personas')
        .insert({
          space_id,
          name,
          description: description || null,
          system_prompt: system_prompt || null,
          icon: icon || null,
          is_default: is_default || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create persona error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: persona }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== BULK CREATE PERSONAS ====================
    if (action === 'bulk_create_personas') {
      const { personas } = params;
      
      if (!personas || !Array.isArray(personas)) {
        const error = createCosmoError('INVALID_PAYLOAD', 'personas array is required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const personasWithUser = personas.map(p => ({ ...p, created_by: user.id }));
      const { data, error } = await supabase.from('space_personas').insert(personasWithUser).select();

      if (error) {
        logger.error('Bulk create personas error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== CREATE PROMPT ====================
    if (action === 'create_prompt') {
      const { space_id, title, content, category, is_default } = params;
      
      const { data: prompt, error } = await supabase
        .from('space_prompts')
        .insert({
          space_id,
          title,
          content,
          category: category || null,
          is_default: is_default || false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create prompt error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data: prompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== BULK CREATE PROMPTS ====================
    if (action === 'bulk_create_prompts') {
      const { prompts } = params;
      
      if (!prompts || !Array.isArray(prompts)) {
        const error = createCosmoError('INVALID_PAYLOAD', 'prompts array is required');
        return new Response(JSON.stringify(toExecutionError(error)), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const promptsWithUser = prompts.map(p => ({ ...p, created_by: user.id }));
      const { data, error } = await supabase.from('space_prompts').insert(promptsWithUser).select();

      if (error) {
        logger.error('Bulk create prompts error', { error: error.message });
        const cosmoError = createCosmoError('FUNCTION_FAILED', error.message);
        return new Response(JSON.stringify(toExecutionError(cosmoError)), {
          status: cosmoError.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== CREATE SPACE ASSIGNMENT ====================
    if (action === 'create_assignment') {
      const { space_id, is_pinned } = params;
      
      const { error } = await supabase
        .from('user_space_assignments')
        .insert({
          user_id: user.id,
          space_id,
          is_pinned: is_pinned || false,
        });

      if (error) {
        logger.error('Create assignment error', { error: error.message });
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

    // ==================== COPY SPACE CONTENT (for remix) ====================
    if (action === 'copy_space_content') {
      const { source_space_id, target_space_id, copy_files, copy_chats, copy_tasks, copy_knowledge_base } = params;
      const results: Record<string, any> = {};

      // Copy files
      if (copy_files) {
        const { data: files } = await supabase
          .from('workspace_files')
          .select('*')
          .eq('workspace_id', source_space_id);

        if (files && files.length > 0) {
          const filesToInsert = files.map((f: any) => ({
            workspace_id: target_space_id,
            uploaded_by: user.id,
            file_name: f.file_name,
            original_name: f.original_name,
            file_type: f.file_type,
            file_size: f.file_size,
            storage_path: f.storage_path,
            is_favorite: false,
          }));
          const { error } = await supabase.from('workspace_files').insert(filesToInsert);
          results.files = { copied: files.length, error: error?.message };
        }
      }

      // Copy chats
      if (copy_chats) {
        const { data: chats } = await supabase
          .from('space_chats')
          .select('*, space_chat_messages(*)')
          .eq('space_id', source_space_id);

        if (chats && chats.length > 0) {
          let messagesCount = 0;
          for (const chat of chats) {
            const { data: newChat } = await supabase
              .from('space_chats')
              .insert({
                space_id: target_space_id,
                user_id: user.id,
                title: chat.title,
                model: chat.model,
                persona_id: null,
              })
              .select()
              .single();

            if (newChat && chat.space_chat_messages?.length > 0) {
              const messagesToInsert = chat.space_chat_messages.map((m: any) => ({
                chat_id: newChat.id,
                role: m.role,
                content: m.content,
                tokens_used: m.tokens_used,
              }));
              await supabase.from('space_chat_messages').insert(messagesToInsert);
              messagesCount += messagesToInsert.length;
            }
          }
          results.chats = { copied: chats.length, messages: messagesCount };
        }
      }

      // Copy tasks
      if (copy_tasks) {
        const { data: tasks } = await supabase
          .from('space_tasks')
          .select('*')
          .eq('space_id', source_space_id);

        if (tasks && tasks.length > 0) {
          const tasksToInsert = tasks.map(t => ({
            space_id: target_space_id,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
            assigned_to: null,
            created_by: user.id,
          }));
          const { error } = await supabase.from('space_tasks').insert(tasksToInsert);
          results.tasks = { copied: tasks.length, error: error?.message };
        }
      }

      // Copy knowledge base
      if (copy_knowledge_base) {
        const { data: kbDocs } = await supabase
          .from('knowledge_base')
          .select('*')
          .eq('workspace_id', source_space_id);

        if (kbDocs && kbDocs.length > 0) {
          const kbToInsert = kbDocs.map(doc => ({
            workspace_id: target_space_id,
            user_id: user.id,
            title: doc.title,
            file_name: doc.file_name,
            file_type: doc.file_type,
            file_size: doc.file_size,
            storage_path: doc.storage_path,
            content: doc.content,
            chunks: doc.chunks,
            metadata: doc.metadata,
          }));
          const { error } = await supabase.from('knowledge_base').insert(kbToInsert);
          results.knowledge_base = { copied: kbDocs.length, error: error?.message };
        }
      }

      return new Response(JSON.stringify({ data: results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==================== INCREMENT TEMPLATE USE COUNT ====================
    if (action === 'increment_template_use') {
      const { template_type, template_id, increment } = params;
      const table = template_type === 'persona' ? 'persona_templates' : 'prompt_templates';
      
      // Get current count
      const { data: template } = await supabase.from(table).select('use_count').eq('id', template_id).single();
      const newCount = (template?.use_count || 0) + (increment || 1);
      
      await supabase.from(table).update({ use_count: newCount }).eq('id', template_id);

      return new Response(JSON.stringify({ success: true }), {
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
