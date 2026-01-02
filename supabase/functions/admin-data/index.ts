import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function categorizeFileType(mimeType: string | null): string {
  if (!mimeType) return 'Other';
  if (mimeType.startsWith('image/')) return 'Images';
  if (mimeType.startsWith('video/')) return 'Videos';
  if (mimeType.startsWith('audio/')) return 'Audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text/') || 
      mimeType.includes('spreadsheet') || mimeType.includes('presentation')) return 'Documents';
  return 'Other';
}

async function verifySession(supabase: any, sessionToken: string) {
  const { data: session, error } = await supabase
    .from('system_user_sessions')
    .select('system_user_id, expires_at')
    .eq('session_token', sessionToken)
    .single();

  if (error || !session) return null;
  if (new Date(session.expires_at) < new Date()) return null;
  
  return session.system_user_id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, session_token, ...params } = await req.json();

    // Verify admin session
    const userId = await verifySession(supabase, session_token);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== USERS ====================
    if (action === 'get_users') {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, user_roles(role), workspaces!workspaces_owner_id_fkey(id, name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete_user') {
      const { user_id } = params;
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('user_roles').delete().eq('user_id', user_id);
      const { error } = await supabase.from('profiles').delete().eq('id', user_id);

      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== WORKSPACES ====================
    if (action === 'get_workspaces') {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`*, profiles!workspaces_owner_id_fkey(first_name, last_name, email)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_all_spaces') {
      const { data: workspaces, error } = await supabase
        .from('workspaces')
        .select(`*, profiles!workspaces_owner_id_fkey(id, email, first_name, last_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: memberCounts } = await supabase.from('workspace_members').select('workspace_id');
      const { data: chatCounts } = await supabase.from('space_chats').select('space_id');
      const { data: fileUsage } = await supabase.from('workspace_files').select('workspace_id, file_size');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: tokenUsage } = await supabase
        .from('usage_logs')
        .select('workspace_id, tokens_used')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const enrichedWorkspaces = workspaces?.map(workspace => {
        const members = memberCounts?.filter((m: any) => m.workspace_id === workspace.id).length || 0;
        const chats = chatCounts?.filter((c: any) => c.space_id === workspace.id).length || 0;
        const storage = (fileUsage as any[])?.filter((f: any) => f.workspace_id === workspace.id)
          .reduce((sum: number, f: any) => sum + (f.file_size || 0), 0) || 0;
        const tokens = tokenUsage?.filter((u: any) => u.workspace_id === workspace.id)
          .reduce((sum: number, u: any) => sum + (u.tokens_used || 0), 0) || 0;

        return {
          ...workspace,
          memberCount: members,
          chatCount: chats,
          storageUsedMB: Math.round(storage / (1024 * 1024) * 100) / 100,
          tokenUsage30d: tokens,
        };
      }) || [];

      return new Response(
        JSON.stringify({ data: enrichedWorkspaces }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'suspend_space') {
      const { error } = await supabase.from('workspaces').update({ is_suspended: true, updated_at: new Date().toISOString() }).eq('id', params.spaceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'unsuspend_space') {
      const { error } = await supabase.from('workspaces').update({ is_suspended: false, updated_at: new Date().toISOString() }).eq('id', params.spaceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_space') {
      const { error } = await supabase.from('workspaces').delete().eq('id', params.spaceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'reassign_space') {
      const { error } = await supabase.from('workspaces').update({ owner_id: params.newOwnerId, updated_at: new Date().toISOString() }).eq('id', params.spaceId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== USAGE LOGS ====================
    if (action === 'get_usage_logs') {
      const limit = params.limit || 100;
      const { data, error } = await supabase
        .from('usage_logs')
        .select(`*, profiles!usage_logs_user_id_fkey(first_name, last_name, email), workspaces(name)`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== ANALYTICS ====================
    if (action === 'get_analytics') {
      const [
        { count: totalUsers },
        { count: totalWorkspaces },
        { count: totalChats },
        { count: totalMessages },
        { count: totalImages },
        { count: totalVideos },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('content_type', 'image'),
        supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('content_type', 'video'),
      ]);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentUsage } = await supabase
        .from('usage_logs')
        .select('created_at, action, tokens_used')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      return new Response(
        JSON.stringify({
          data: {
            totalUsers: totalUsers || 0,
            totalWorkspaces: totalWorkspaces || 0,
            totalChats: totalChats || 0,
            totalMessages: totalMessages || 0,
            totalImages: totalImages || 0,
            totalVideos: totalVideos || 0,
            recentUsage: recentUsage || [],
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_model_usage') {
      const days = params.period === 'daily' ? 7 : params.period === 'weekly' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('model, tokens_used, created_at')
        .gte('created_at', startDate.toISOString())
        .not('model', 'is', null);

      const { data: models } = await supabase
        .from('ai_models')
        .select('model_id, name, best_for');

      const modelMap = new Map(models?.map((m: any) => [m.model_id, m]) || []);

      const modelStats = usageLogs?.reduce((acc: any, log: any) => {
        const modelInfo = modelMap.get(log.model);
        if (!acc[log.model]) {
          acc[log.model] = {
            model_id: log.model,
            name: modelInfo?.name || log.model,
            category: modelInfo?.best_for || 'general',
            requests: 0,
            tokens: 0,
          };
        }
        acc[log.model].requests += 1;
        acc[log.model].tokens += log.tokens_used || 0;
        return acc;
      }, {}) || {};

      const categoryStats = Object.values(modelStats as Record<string, any>).reduce((acc: any, model: any) => {
        if (!acc[model.category]) {
          acc[model.category] = { category: model.category, value: 0 };
        }
        acc[model.category].value += model.requests;
        return acc;
      }, {} as Record<string, any>);

      return new Response(
        JSON.stringify({
          data: {
            modelData: Object.values(modelStats as Record<string, any>).sort((a: any, b: any) => b.requests - a.requests),
            categoryData: Object.values(categoryStats as Record<string, any>),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_token_analytics') {
      const days = params.period === 'daily' ? 7 : params.period === 'weekly' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('model, tokens_used, created_at')
        .gte('created_at', startDate.toISOString())
        .not('model', 'is', null)
        .order('created_at', { ascending: true });

      const { data: models } = await supabase
        .from('ai_models')
        .select('model_id, name, best_for');

      const modelMap = new Map(models?.map((m: any) => [m.model_id, m]) || []);

      const timeData = usageLogs?.reduce((acc: any[], log: any) => {
        const date = new Date(log.created_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.tokens += log.tokens_used || 0;
        } else {
          acc.push({ date, tokens: log.tokens_used || 0 });
        }
        return acc;
      }, []) || [];

      const modelStats = usageLogs?.reduce((acc: any, log: any) => {
        const modelInfo = modelMap.get(log.model);
        if (!acc[log.model]) {
          acc[log.model] = {
            model_id: log.model,
            name: modelInfo?.name || log.model,
            category: modelInfo?.best_for || 'general',
            tokens: 0,
            requests: 0,
          };
        }
        acc[log.model].tokens += log.tokens_used || 0;
        acc[log.model].requests += 1;
        return acc;
      }, {}) || {};

      return new Response(
        JSON.stringify({
          data: {
            timeData,
            modelData: Object.values(modelStats).sort((a: any, b: any) => b.tokens - a.tokens),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_cost_analytics') {
      const days = params.period === 'daily' ? 7 : params.period === 'weekly' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select('model, tokens_used, cost, created_at')
        .gte('created_at', startDate.toISOString())
        .not('model', 'is', null)
        .order('created_at', { ascending: true });

      const { data: models } = await supabase
        .from('ai_models')
        .select('model_id, name, best_for');

      const modelMap = new Map(models?.map((m: any) => [m.model_id, m]) || []);

      const timeData = usageLogs?.reduce((acc: any[], log: any) => {
        const date = new Date(log.created_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.cost += log.cost || 0;
        } else {
          acc.push({ date, cost: log.cost || 0 });
        }
        return acc;
      }, []) || [];

      const modelStats = usageLogs?.reduce((acc: any, log: any) => {
        const modelInfo = modelMap.get(log.model);
        if (!acc[log.model]) {
          acc[log.model] = {
            model_id: log.model,
            name: modelInfo?.name || log.model,
            category: modelInfo?.best_for || 'general',
            cost: 0,
            tokens: 0,
            requests: 0,
          };
        }
        acc[log.model].cost += log.cost || 0;
        acc[log.model].tokens += log.tokens_used || 0;
        acc[log.model].requests += 1;
        return acc;
      }, {}) || {};

      return new Response(
        JSON.stringify({
          data: {
            timeData,
            modelData: Object.values(modelStats).sort((a: any, b: any) => b.cost - a.cost),
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_user_cost_analytics') {
      const days = params.period === 'daily' ? 7 : params.period === 'weekly' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: usageLogs } = await supabase
        .from('usage_logs')
        .select(`user_id, action_type, cost, profiles!usage_logs_user_id_fkey(first_name, last_name, email)`)
        .gte('created_at', startDate.toISOString());

      const userStats = usageLogs?.reduce((acc: any, log: any) => {
        if (!acc[log.user_id]) {
          const profile = log.profiles;
          const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
          acc[log.user_id] = {
            user_id: log.user_id,
            user_name: displayName,
            user_email: profile?.email || 'Unknown',
            chat_cost: 0,
            image_cost: 0,
            video_cost: 0,
            doc_cost: 0,
            total_cost: 0,
            total_requests: 0,
          };
        }

        const cost = log.cost || 0;
        acc[log.user_id].total_cost += cost;
        acc[log.user_id].total_requests += 1;

        switch (log.action_type) {
          case 'chat': acc[log.user_id].chat_cost += cost; break;
          case 'image_generation': acc[log.user_id].image_cost += cost; break;
          case 'video_generation': acc[log.user_id].video_cost += cost; break;
          case 'document_parse': acc[log.user_id].doc_cost += cost; break;
        }

        return acc;
      }, {}) || {};

      return new Response(
        JSON.stringify({ data: Object.values(userStats) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==================== SPACE TEMPLATES ====================
    if (action === 'get_space_templates') {
      const { data, error } = await supabase
        .from('space_templates')
        .select(`*, space_categories (id, name, slug)`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_space_categories') {
      const { data, error } = await supabase
        .from('space_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_space_template') {
      const { error } = await supabase.from('space_templates').insert(params.template);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_space_template') {
      const { id, ...template } = params.template;
      const { error } = await supabase.from('space_templates').update(template).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_space_template') {
      const { error } = await supabase.from('space_templates').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_space_category') {
      const { error } = await supabase.from('space_categories').insert(params.category);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_space_category') {
      const { id, ...category } = params.category;
      const { error } = await supabase.from('space_categories').update(category).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_space_category') {
      const { error } = await supabase.from('space_categories').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== PERSONA TEMPLATES ====================
    if (action === 'get_persona_templates') {
      const { data, error } = await supabase
        .from('persona_templates')
        .select('*, persona_categories(name, slug, icon)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_persona_categories') {
      const { data, error } = await supabase
        .from('persona_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_persona_analytics') {
      const { data: templates, error } = await supabase.from('persona_templates').select('*');
      if (error) throw error;

      return new Response(JSON.stringify({
        data: {
          total: templates?.length || 0,
          active: templates?.filter((t: any) => t.is_active).length || 0,
          featured: templates?.filter((t: any) => t.is_featured).length || 0,
          totalUses: templates?.reduce((sum: number, t: any) => sum + (t.use_count || 0), 0) || 0,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_persona_template') {
      const { data, error } = await supabase.from('persona_templates').insert(params.template).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_persona_template') {
      const { id, updates } = params;
      const { error } = await supabase.from('persona_templates').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_persona_template') {
      const { error } = await supabase.from('persona_templates').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_persona_default_for_users') {
      await supabase.from('persona_templates').update({ is_default_for_users: false }).neq('id', params.id);
      const { error } = await supabase.from('persona_templates').update({ is_default_for_users: true }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_persona_default_for_spaces') {
      await supabase.from('persona_templates').update({ is_default_for_spaces: false }).neq('id', params.id);
      const { error } = await supabase.from('persona_templates').update({ is_default_for_spaces: true }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_persona_category') {
      const { error } = await supabase.from('persona_categories').insert(params.category);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_persona_category') {
      const { id, updates } = params;
      const { error } = await supabase.from('persona_categories').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_persona_category') {
      const { error } = await supabase.from('persona_categories').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== PROMPT TEMPLATES ====================
    if (action === 'get_prompt_templates') {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*, category:prompt_categories(name, slug, icon)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_prompt_categories') {
      const { data, error } = await supabase
        .from('prompt_categories')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_prompt_template') {
      const { data, error } = await supabase.from('prompt_templates').insert(params.template).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_prompt_template') {
      const { id, updates } = params;
      const { error } = await supabase.from('prompt_templates').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_prompt_template') {
      const { error } = await supabase.from('prompt_templates').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_prompt_category') {
      const { error } = await supabase.from('prompt_categories').insert(params.category);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_prompt_category') {
      const { id, updates } = params;
      const { error } = await supabase.from('prompt_categories').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_prompt_category') {
      const { error } = await supabase.from('prompt_categories').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== AI MODELS ====================
    if (action === 'get_ai_models') {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_ai_model') {
      const { error } = await supabase.from('ai_models').insert(params.model);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_ai_model') {
      const { id, updates } = params;
      const { error } = await supabase.from('ai_models').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_ai_model') {
      const { error } = await supabase.from('ai_models').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'toggle_ai_model_active') {
      const { error } = await supabase.from('ai_models').update({ is_active: params.is_active }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_default_ai_model') {
      await supabase.from('ai_models').update({ is_default: false }).eq('is_default', true);
      const { error } = await supabase.from('ai_models').update({ is_default: true }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'bulk_toggle_ai_models') {
      const { error } = await supabase.from('ai_models').update({ is_active: params.is_active }).in('id', params.ids);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== FALLBACK MODELS ====================
    if (action === 'get_fallback_models') {
      const { data, error } = await supabase
        .from('fallback_models')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_fallback_model') {
      const { data, error } = await supabase.from('fallback_models').insert(params.model).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_fallback_model') {
      const { id, updates } = params;
      const { data, error } = await supabase.from('fallback_models').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_fallback_model') {
      const { error } = await supabase.from('fallback_models').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'toggle_fallback_model_active') {
      const { error } = await supabase.from('fallback_models').update({ is_active: params.is_active }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_default_fallback_model') {
      await supabase.from('fallback_models').update({ is_default: false }).eq('is_default', true);
      const { error } = await supabase.from('fallback_models').update({ is_default: true }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== SYSTEM SETTINGS ====================
    if (action === 'get_system_settings') {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_system_setting') {
      const { key, value } = params;
      const { error } = await supabase
        .from('system_settings')
        .upsert({ setting_key: key, setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== SUBSCRIPTION TIERS ====================
    if (action === 'get_subscription_tiers') {
      const { data, error } = await supabase
        .from('subscription_tiers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_subscription_tier') {
      const { error } = await supabase.from('subscription_tiers').insert(params.tier);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_subscription_tier') {
      const { id, updates } = params;
      const { error } = await supabase.from('subscription_tiers').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_subscription_tier') {
      const { error } = await supabase.from('subscription_tiers').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== USER SUBSCRIPTIONS ====================
    if (action === 'get_user_subscriptions') {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`*, profiles (email, first_name, last_name), subscription_tiers (name, tier_type)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_user_subscription_status') {
      const { id, status } = params;
      const updates: any = { status };
      if (status === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
      const { error } = await supabase.from('user_subscriptions').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== PAYMENT PROCESSORS ====================
    if (action === 'get_payment_processors') {
      const { data, error } = await supabase
        .from('payment_processors')
        .select('*')
        .order('name');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_payment_processor') {
      const { error } = await supabase.from('payment_processors').insert(params.processor);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_payment_processor') {
      const { id, updates } = params;
      const { error } = await supabase.from('payment_processors').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_payment_processor') {
      const { error } = await supabase.from('payment_processors').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set_default_payment_processor') {
      await supabase.from('payment_processors').update({ is_default: false }).neq('id', params.id);
      const { error } = await supabase.from('payment_processors').update({ is_default: true }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== DISCOUNT CODES ====================
    if (action === 'get_discount_codes') {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_discount_code') {
      const { error } = await supabase.from('discount_codes').insert(params.code);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_discount_code') {
      const { id, updates } = params;
      const { error } = await supabase.from('discount_codes').update(updates).eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_discount_code') {
      const { error } = await supabase.from('discount_codes').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== EMAIL LOGS ====================
    if (action === 'get_email_logs') {
      let query = supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.status) query = query.eq('status', params.status);
      if (params.providerId) query = query.eq('provider_id', params.providerId);
      if (params.search) query = query.ilike('recipient_email', `%${params.search}%`);
      if (params.limit) query = query.limit(params.limit);

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== EMAIL RULES ====================
    if (action === 'get_email_rules') {
      let query = supabase
        .from('email_rules')
        .select('*, email_templates(name, status)')
        .order('priority', { ascending: true });

      if (params.event_type) query = query.eq('event_type', params.event_type);
      if (params.status) query = query.eq('status', params.status);

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_email_rule') {
      const { data, error } = await supabase.from('email_rules').insert(params.rule).select('*, email_templates(*)').single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_email_rule') {
      const { id, updates } = params;
      const { data, error } = await supabase.from('email_rules').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select('*, email_templates(*)').single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_email_rule') {
      const { error } = await supabase.from('email_rules').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== EMAIL TEMPLATES ====================
    if (action === 'get_email_templates') {
      let query = supabase.from('email_templates').select('*');
      if (params.category) query = query.eq('category', params.category);
      if (params.status) query = query.eq('status', params.status);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_email_template') {
      const { data, error } = await supabase.from('email_templates').insert(params.template).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_email_template') {
      const { id, updates } = params;
      const { data: current } = await supabase.from('email_templates').select('*').eq('id', id).single();
      
      if (current) {
        const versionHistory = current.version_history || [];
        versionHistory.push({
          version: current.version,
          timestamp: new Date().toISOString(),
          name: current.name,
          subject_template: current.subject_template,
          html_content: current.html_content,
          text_content: current.text_content,
        });

        const { data, error } = await supabase.from('email_templates')
          .update({ ...updates, version: current.version + 1, version_history: versionHistory, updated_at: new Date().toISOString() })
          .eq('id', id).select().single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const error = { code: 'NOT_FOUND', message: 'Template not found', httpStatus: 404 };
      return new Response(JSON.stringify({ error: error.message, code: error.code }), { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_email_template') {
      const { error } = await supabase.from('email_templates').update({ status: 'archived' }).eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== EMAIL PROVIDERS ====================
    if (action === 'get_email_providers') {
      const { data, error } = await supabase
        .from('email_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_email_provider') {
      const { data, error } = await supabase.from('email_providers').insert(params.provider).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_email_provider') {
      const { id, updates } = params;
      const { data, error } = await supabase.from('email_providers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_email_provider') {
      const { error } = await supabase.from('email_providers').delete().eq('id', params.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'activate_email_provider') {
      await supabase.from('email_providers').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      const { data, error } = await supabase.from('email_providers').update({ is_active: true }).eq('id', params.id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== TEST RUNS ====================
    if (action === 'get_test_runs') {
      const { limit = 10 } = params;
      const { data, error } = await supabase
        .from('test_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_latest_test_run') {
      const { data, error } = await supabase
        .from('test_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== CLEANUP JOBS ====================
    if (action === 'get_cleanup_jobs') {
      const { job_name, limit = 50 } = params;
      let query = supabase
        .from('cleanup_job_results')
        .select('*')
        .order('run_at', { ascending: false })
        .limit(limit);

      if (job_name) {
        query = query.eq('job_name', job_name);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== STORAGE ANALYTICS ====================
    if (action === 'get_storage_analytics') {
      // Get all files from storage.objects
      const { data: storageObjects, error: storageError } = await supabase
        .from('storage.objects' as any)
        .select('id, name, bucket_id, owner, created_at, metadata')
        .in('bucket_id', ['user-files', 'knowledge-base']);

      // Fallback: get from usage_tracking if storage.objects not accessible
      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('user_id, file_storage_used_bytes, file_count, profiles!usage_tracking_user_id_fkey(email, first_name, last_name)');

      if (usageError) throw usageError;

      // Calculate totals from usage_tracking
      let totalStorage = 0;
      let totalFiles = 0;
      const usersMap = new Map<string, { 
        user_id: string; 
        email: string; 
        first_name: string | null; 
        last_name: string | null;
        storage_used_bytes: number; 
        file_count: number; 
      }>();

      for (const usage of usageData || []) {
        const bytes = usage.file_storage_used_bytes || 0;
        const files = usage.file_count || 0;
        totalStorage += bytes;
        totalFiles += files;

        if (bytes > 0 || files > 0) {
          const profile = usage.profiles as any;
          usersMap.set(usage.user_id, {
            user_id: usage.user_id,
            email: profile?.email || 'Unknown',
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            storage_used_bytes: bytes,
            file_count: files,
          });
        }
      }

      // Convert to array and calculate percentages
      const users = Array.from(usersMap.values())
        .map(u => ({
          ...u,
          percentage: totalStorage > 0 ? (u.storage_used_bytes / totalStorage) * 100 : 0,
        }))
        .sort((a, b) => b.storage_used_bytes - a.storage_used_bytes);

      const activeUsers = users.length;
      const averagePerUser = activeUsers > 0 ? totalStorage / activeUsers : 0;

      // Get file type breakdown from user_files and workspace_files
      const { data: userFiles } = await supabase
        .from('user_files')
        .select('file_type, file_size');
      
      const { data: workspaceFiles } = await supabase
        .from('workspace_files')
        .select('file_type, file_size');

      const allFiles = [...(userFiles || []), ...(workspaceFiles || [])];
      
      const typeMap = new Map<string, { size: number; count: number }>();
      for (const file of allFiles) {
        const type = categorizeFileType(file.file_type);
        const existing = typeMap.get(type) || { size: 0, count: 0 };
        typeMap.set(type, {
          size: existing.size + (file.file_size || 0),
          count: existing.count + 1,
        });
      }

      const totalFileSize = Array.from(typeMap.values()).reduce((sum, t) => sum + t.size, 0);
      const fileTypes = Array.from(typeMap.entries())
        .map(([type, data]) => ({
          type,
          size_bytes: data.size,
          count: data.count,
          percentage: totalFileSize > 0 ? (data.size / totalFileSize) * 100 : 0,
        }))
        .sort((a, b) => b.size_bytes - a.size_bytes);

      // Get storage growth over last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentFiles } = await supabase
        .from('user_files')
        .select('created_at, file_size')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const { data: recentWorkspaceFiles } = await supabase
        .from('workspace_files')
        .select('created_at, file_size')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const allRecentFiles = [...(recentFiles || []), ...(recentWorkspaceFiles || [])];

      // Group by date
      const growthMap = new Map<string, number>();
      for (const file of allRecentFiles) {
        const date = file.created_at.split('T')[0];
        const existing = growthMap.get(date) || 0;
        growthMap.set(date, existing + (file.file_size || 0));
      }

      // Build cumulative growth data
      const sortedDates = Array.from(growthMap.keys()).sort();
      let cumulative = totalStorage - Array.from(growthMap.values()).reduce((sum, v) => sum + v, 0);
      const growth = sortedDates.map(date => {
        const daily = growthMap.get(date) || 0;
        cumulative += daily;
        return {
          date,
          cumulative_bytes: cumulative,
          daily_bytes: daily,
        };
      });

      return new Response(JSON.stringify({
        data: {
          total_storage_bytes: totalStorage,
          total_files: totalFiles,
          active_users: activeUsers,
          average_per_user_bytes: averagePerUser,
          users,
          file_types: fileTypes,
          growth,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== SCHEDULED JOBS ====================
    if (action === 'get_scheduled_jobs') {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create_scheduled_job') {
      const { job_data } = params;
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .insert(job_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_scheduled_job') {
      const { job_id, updates } = params;
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', job_id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_scheduled_job') {
      const { job_id } = params;
      const { error } = await supabase
        .from('scheduled_jobs')
        .delete()
        .eq('id', job_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO INTENTS ====================
    if (action === 'cosmo_get_intents') {
      const { data, error } = await supabase
        .from('cosmo_intents')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_create_intent') {
      const { intent_data } = params;
      const { data, error } = await supabase
        .from('cosmo_intents')
        .insert(intent_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_update_intent') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('cosmo_intents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_delete_intent') {
      const { id } = params;
      const { error } = await supabase
        .from('cosmo_intents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_toggle_intent') {
      const { id, is_active } = params;
      const { error } = await supabase
        .from('cosmo_intents')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO FUNCTION CHAINS ====================
    if (action === 'cosmo_get_chains') {
      const { data, error } = await supabase
        .from('cosmo_function_chains')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_create_chain') {
      const { chain_data } = params;
      const { data, error } = await supabase
        .from('cosmo_function_chains')
        .insert(chain_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_update_chain') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('cosmo_function_chains')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_delete_chain') {
      const { id } = params;
      const { error } = await supabase
        .from('cosmo_function_chains')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_toggle_chain') {
      const { id, is_active } = params;
      const { error } = await supabase
        .from('cosmo_function_chains')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO ACTION MAPPINGS ====================
    if (action === 'cosmo_get_action_mappings') {
      const { data, error } = await supabase
        .from('cosmo_action_mappings')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_create_action_mapping') {
      const { mapping_data } = params;
      const { data, error } = await supabase
        .from('cosmo_action_mappings')
        .insert(mapping_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_update_action_mapping') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('cosmo_action_mappings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_delete_action_mapping') {
      const { id } = params;
      const { error } = await supabase
        .from('cosmo_action_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_toggle_action_mapping') {
      const { id, is_active } = params;
      const { error } = await supabase
        .from('cosmo_action_mappings')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO QUEUE MANAGEMENT ====================
    if (action === 'cosmo_get_queue_items') {
      const { limit = 100, status } = params;
      let query = supabase
        .from('cosmo_request_queue')
        .select('*')
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_cancel_request') {
      const { id } = params;
      const { error } = await supabase
        .from('cosmo_request_queue')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', id)
        .in('status', ['pending', 'processing']);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_reprioritize_request') {
      const { id, priority } = params;
      const priorityScores: Record<string, number> = {
        critical: 100,
        high: 80,
        normal: 50,
        low: 20,
      };

      const { error } = await supabase
        .from('cosmo_request_queue')
        .update({ 
          priority, 
          priority_score: priorityScores[priority] || 50,
        })
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== CHAT FUNCTIONS ADMIN ====================
    if (action === 'chat_functions_get') {
      const { data, error } = await supabase
        .from('chat_functions')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_functions_create') {
      const { function_data } = params;
      const { data, error } = await supabase
        .from('chat_functions')
        .insert(function_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_functions_update') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('chat_functions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_functions_delete') {
      const { id } = params;
      const { error } = await supabase
        .from('chat_functions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== CHAT ACTORS ADMIN ====================
    if (action === 'chat_actors_get') {
      const { data, error } = await supabase
        .from('chat_actors')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_actors_create') {
      const { actor_data } = params;
      const { data, error } = await supabase
        .from('chat_actors')
        .insert(actor_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_actors_update') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('chat_actors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_actors_delete') {
      const { id } = params;
      // Check if system actor first
      const { data: actor } = await supabase
        .from('chat_actors')
        .select('is_system, name')
        .eq('id', id)
        .single();

      if (actor?.is_system) {
        return new Response(
          JSON.stringify({ error: `Cannot delete system actor: ${actor.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('chat_actors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== CHAT CONTAINERS ADMIN ====================
    if (action === 'chat_containers_get') {
      const { data, error } = await supabase
        .from('chat_containers')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_containers_create') {
      const { container_data } = params;
      const { data, error } = await supabase
        .from('chat_containers')
        .insert(container_data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_containers_update') {
      const { id, updates } = params;
      const { data, error } = await supabase
        .from('chat_containers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'chat_containers_delete') {
      const { id } = params;
      const { error } = await supabase
        .from('chat_containers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO CHAT FUNCTIONS (Reference) ====================
    if (action === 'cosmo_get_chat_functions') {
      const { data, error } = await supabase
        .from('chat_functions')
        .select('id, function_key, name, description, category, is_enabled, is_core, tags')
        .order('name');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ==================== COSMO DEBUG OPERATIONS ====================
    if (action === 'cosmo_debug_toggle_logging') {
      const { enabled } = params;
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: { enabled } })
        .eq('setting_key', 'cosmo_debug_enabled');

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, enabled }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_debug_clear_logs') {
      const { error } = await supabase
        .from('cosmo_debug_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'cosmo_get_debug_logs') {
      const { limit = 100, since_hours = 24 } = params;
      const since = new Date();
      since.setHours(since.getHours() - since_hours);

      const { data, error } = await supabase
        .from('cosmo_debug_logs')
        .select('id, created_at, detected_intent, selected_model, success, response_time_ms, error_message')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin data error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
