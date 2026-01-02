import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('update-user-password');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { session_token, user_id, new_password } = await req.json();

    // Validate session token for system user authentication
    if (!session_token) {
      logger.warn('No session token provided');
      return new Response(JSON.stringify({ error: 'Session token required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify system user session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('system_user_sessions')
      .select('system_user_id, expires_at')
      .eq('session_token', session_token)
      .single();

    if (sessionError || !session) {
      logger.warn('Session validation failed', { error: sessionError?.message });
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      logger.warn('Session expired');
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the system user exists and is active
    const { data: systemUser, error: userError } = await supabaseAdmin
      .from('system_users')
      .select('id, role, is_active')
      .eq('id', session.system_user_id)
      .single();

    if (userError || !systemUser || !systemUser.is_active) {
      logger.warn('User not found or inactive', { systemUserId: session.system_user_id });
      return new Response(JSON.stringify({ error: 'Unauthorized - User not found or inactive' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only admin role can update passwords
    if (systemUser.role !== 'admin') {
      logger.warn('Non-admin attempted password update', { systemUserId: systemUser.id });
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!user_id || !new_password) {
      logger.warn('Missing required fields');
      return new Response(JSON.stringify({ error: 'User ID and new password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new_password.length < 6) {
      logger.warn('Password too short');
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the user's password using admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      logger.error('Failed to update password', { error: updateError.message, userId: user_id });
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logger.complete(Date.now() - startTime, { 
      userId: user_id, 
      updatedBy: systemUser.id 
    });

    return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.fail(error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
