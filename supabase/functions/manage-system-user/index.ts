import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemUserSession {
  id: string;
  system_user_id: string;
  session_token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity_at: string;
}

interface SystemUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  totp_secret: string | null;
  totp_enabled: boolean;
  backup_codes: unknown | null;
  linked_web_user_id: string | null;
}

interface SystemUserRole {
  id: string;
  system_user_id: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

async function verifyAdminSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const { data: session, error } = await supabase
    .from('system_user_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single<SystemUserSession>();

  if (error || !session) {
    return { valid: false, error: 'Invalid session' };
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase
      .from('system_user_sessions')
      .delete()
      .eq('id', session.id);
    return { valid: false, error: 'Session expired' };
  }

  // Update last activity
  await supabase
    .from('system_user_sessions')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', session.id);

  return { valid: true, userId: session.system_user_id };
}

serve(async (req) => {
  const logger = createLogger('manage-system-user');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, session_token, ...data } = body;
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';

    // Verify admin session for all actions
    const authResult = await verifyAdminSession(supabase, session_token);
    if (!authResult.valid) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LIST SYSTEM USERS
    if (action === 'list') {
      const { data: users, error } = await supabase
        .from('system_users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          is_active,
          created_at,
          last_login_at,
          linked_web_user_id,
          totp_enabled,
          system_user_roles (role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ users }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE SYSTEM USER
    if (action === 'create') {
      const { email, password, first_name, last_name, roles } = data;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email and password required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ error: passwordValidation.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if email already exists
      const { data: existing } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Email already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      
      const { data: newUser, error: createError } = await supabase
        .from('system_users')
        .insert({
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name,
          last_name,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add roles
      if (roles && roles.length > 0) {
        const roleInserts = roles.map((role: string) => ({
          system_user_id: newUser.id,
          role,
        }));
        await supabase.from('system_user_roles').insert(roleInserts);
      }

      // Audit log
      await supabase.from('system_audit_log').insert({
        system_user_id: authResult.userId,
        action: 'create_system_user',
        details: { created_user_id: newUser.id, email: newUser.email },
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ user: newUser }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // UPDATE SYSTEM USER
    if (action === 'update') {
      const { user_id, email, first_name, last_name, is_active, roles, new_password, linked_web_user_id } = data;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: Record<string, unknown> = {};
      if (email !== undefined) updates.email = email.toLowerCase();
      if (first_name !== undefined) updates.first_name = first_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (is_active !== undefined) updates.is_active = is_active;
      if (linked_web_user_id !== undefined) updates.linked_web_user_id = linked_web_user_id;

      // Handle password change
      if (new_password) {
        const passwordValidation = validatePassword(new_password);
        if (!passwordValidation.valid) {
          return new Response(
            JSON.stringify({ error: passwordValidation.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updates.password_hash = await hashPassword(new_password);
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('system_users')
          .update(updates)
          .eq('id', user_id);

        if (updateError) throw updateError;
      }

      // Update roles if provided
      if (roles !== undefined) {
        await supabase
          .from('system_user_roles')
          .delete()
          .eq('system_user_id', user_id);

        if (roles.length > 0) {
          const roleInserts = roles.map((role: string) => ({
            system_user_id: user_id,
            role,
          }));
          await supabase.from('system_user_roles').insert(roleInserts);
        }
      }

      // Audit log
      await supabase.from('system_audit_log').insert({
        system_user_id: authResult.userId,
        action: 'update_system_user',
        details: { updated_user_id: user_id, fields: Object.keys(updates) },
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE SYSTEM USER
    if (action === 'delete') {
      const { user_id } = data;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-deletion
      if (user_id === authResult.userId) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user info for audit
      const { data: userToDelete } = await supabase
        .from('system_users')
        .select('email')
        .eq('id', user_id)
        .single();

      const { error: deleteError } = await supabase
        .from('system_users')
        .delete()
        .eq('id', user_id);

      if (deleteError) throw deleteError;

      // Audit log
      await supabase.from('system_audit_log').insert({
        system_user_id: authResult.userId,
        action: 'delete_system_user',
        details: { deleted_user_id: user_id, email: userToDelete?.email },
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET AUDIT LOG
    if (action === 'audit_log') {
      const { limit = 100, offset = 0 } = data;

      const { data: logs, error } = await supabase
        .from('system_audit_log')
        .select(`
          *,
          system_users (email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ logs }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET ACTIVE SESSIONS
    if (action === 'sessions') {
      const { user_id } = data;

      let query = supabase
        .from('system_user_sessions')
        .select(`
          *,
          system_users (email, first_name, last_name)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });

      if (user_id) {
        query = query.eq('system_user_id', user_id);
      }

      const { data: sessions, error } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ sessions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FORCE LOGOUT (invalidate session)
    if (action === 'force_logout') {
      const { session_id } = data;

      if (!session_id) {
        return new Response(
          JSON.stringify({ error: 'Session ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: deleteError } = await supabase
        .from('system_user_sessions')
        .delete()
        .eq('id', session_id);

      if (deleteError) throw deleteError;

      // Audit log
      await supabase.from('system_audit_log').insert({
        system_user_id: authResult.userId,
        action: 'force_logout',
        details: { session_id },
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
