import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('space-management');
  
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
    logger.info('Space management operation', { action, userId: user.id });

    if (action === 'get_members') {
      const { spaceId } = params;
      
      // Get workspace owner
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select(`owner_id, created_at, profiles_safe:owner_id (first_name, last_name, avatar_url)`)
        .eq('id', spaceId)
        .single();

      if (workspaceError) throw workspaceError;

      // Get members
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`*, profiles_safe:user_id (first_name, last_name, avatar_url)`)
        .eq('workspace_id', spaceId)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Build response
      const ownerMember = {
        id: `owner-${workspace.owner_id}`,
        user_id: workspace.owner_id,
        workspace_id: spaceId,
        role: 'owner',
        created_at: workspace.created_at,
        profiles: workspace.profiles_safe,
      };

      const mappedMembers = (members || []).map((m: any) => ({
        ...m,
        profiles: m.profiles_safe,
      }));

      return new Response(JSON.stringify({ data: [ownerMember, ...mappedMembers] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_member_role') {
      const { memberId, role } = params;
      const { error } = await supabase
        .from('workspace_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'remove_member') {
      const { memberId } = params;
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leave_space') {
      const { spaceId } = params;
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', spaceId)
        .eq('user_id', user.id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_invitations') {
      const { spaceId } = params;
      const { data, error } = await supabase
        .from('workspace_invitations')
        .select('*')
        .eq('workspace_id', spaceId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel_invitation') {
      const { invitationId } = params;
      const { error } = await supabase
        .from('workspace_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_activity') {
      const { spaceId, limit = 50 } = params;
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('workspace_id', spaceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch profiles for activities
      const activities = await Promise.all(
        (data || []).map(async (activity: any) => {
          if (activity.actor_id) {
            const { data: profile } = await supabase
              .from('profiles_safe')
              .select('first_name, last_name')
              .eq('id', activity.actor_id)
              .single();
            
            return {
              ...activity,
              user_id: activity.actor_id,
              profiles: profile || undefined,
            };
          }
          return { ...activity, user_id: activity.actor_id };
        })
      );

      return new Response(JSON.stringify({ data: activities }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==================== CHAT SHARING ====================
    if (action === 'share_chat') {
      const { chatId, memberIds } = params;
      const { error } = await supabase
        .from('chats')
        .update({ shared_with: memberIds })
        .eq('id', chatId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unshare_chat') {
      const { chatId } = params;
      const { error } = await supabase
        .from('chats')
        .update({ shared_with: [] })
        .eq('id', chatId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_shared_chats') {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('shared_with', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
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
