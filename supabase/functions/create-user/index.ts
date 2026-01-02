import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('create-user');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { session_token, email, password, first_name, last_name, role } = await req.json();

    // Validate session token for system user authentication
    if (!session_token) {
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
      logger.error('Session validation error', { error: sessionError?.message });
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(session.expires_at) < new Date()) {
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
      return new Response(JSON.stringify({ error: 'Unauthorized - User not found or inactive' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only admin role can create users
    if (systemUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update profile with additional info
    if (newUser?.user) {
      await supabaseAdmin
        .from('profiles')
        .update({
          first_name,
          last_name,
        })
        .eq('id', newUser.user.id);

      // Set user role if specified
      if (role && role !== 'user') {
        await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: newUser.user.id,
            role: role,
          }, { onConflict: 'user_id,role' });
      }
    }

    logger.info('User created successfully', { email, createdBy: systemUser.id });

    return new Response(JSON.stringify({ success: true, user: newUser.user }), {
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
