import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      data,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    const newHashBytes = new Uint8Array(derivedBits);
    
    if (storedHashBytes.length !== newHashBytes.length) return false;
    for (let i = 0; i < storedHashBytes.length; i++) {
      if (storedHashBytes[i] !== newHashBytes[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '');
}

serve(async (req) => {
  const logger = createLogger('system-auth');
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = req.method === 'POST' ? await req.json() : {};
    const action = body.action || 'unknown';
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    logger.start({ action, clientIp });

    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = body;
      
      if (!email || !password) {
        logger.warn('Login attempt without credentials');
        return new Response(
          JSON.stringify({ error: 'Email and password required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find system user
      const { data: user, error: userError } = await supabase
        .from('system_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (userError || !user) {
        // Log failed attempt
        await supabase.from('system_audit_log').insert({
          action: 'failed_login',
          details: { email, reason: 'user_not_found' },
          ip_address: clientIp,
        });
        
        logger.warn('Login failed - user not found', { email });
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        await supabase.from('system_audit_log').insert({
          system_user_id: user.id,
          action: 'login_blocked',
          details: { reason: 'account_locked', locked_until: user.locked_until },
          ip_address: clientIp,
        });
        
        logger.warn('Login blocked - account locked', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'Account is locked. Try again later.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if account is active
      if (!user.is_active) {
        logger.warn('Login failed - account deactivated', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'Account is deactivated' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password
      const passwordValid = await verifyPassword(password, user.password_hash);
      
      if (!passwordValid) {
        const newAttempts = (user.failed_login_attempts || 0) + 1;
        const updateData: Record<string, unknown> = { failed_login_attempts: newAttempts };
        
        // Lock account after 5 failed attempts for 15 minutes
        if (newAttempts >= 5) {
          updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        
        await supabase
          .from('system_users')
          .update(updateData)
          .eq('id', user.id);
        
        await supabase.from('system_audit_log').insert({
          system_user_id: user.id,
          action: 'failed_login',
          details: { reason: 'invalid_password', attempts: newAttempts },
          ip_address: clientIp,
        });
        
        logger.warn('Login failed - invalid password', { userId: user.id, attempts: newAttempts });
        return new Response(
          JSON.stringify({ error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user roles
      const { data: roles } = await supabase
        .from('system_user_roles')
        .select('role')
        .eq('system_user_id', user.id);

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

      await supabase.from('system_user_sessions').insert({
        system_user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIp,
        user_agent: userAgent,
      });

      // Reset failed attempts and update last login
      await supabase
        .from('system_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      // Log successful login
      await supabase.from('system_audit_log').insert({
        system_user_id: user.id,
        action: 'login',
        details: { user_agent: userAgent },
        ip_address: clientIp,
      });

      logger.complete(Date.now() - startTime, { action: 'login', userId: user.id });
      return new Response(
        JSON.stringify({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            roles: roles?.map((r: { role: string }) => r.role) || [],
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LOGOUT
    if (action === 'logout' && req.method === 'POST') {
      const { session_token } = body;
      
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'Session token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find and delete session
      const { data: session } = await supabase
        .from('system_user_sessions')
        .select('system_user_id')
        .eq('session_token', session_token)
        .single();

      if (session) {
        await supabase
          .from('system_user_sessions')
          .delete()
          .eq('session_token', session_token);

        await supabase.from('system_audit_log').insert({
          system_user_id: session.system_user_id,
          action: 'logout',
          ip_address: clientIp,
        });
      }

      logger.complete(Date.now() - startTime, { action: 'logout' });
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VALIDATE SESSION
    if (action === 'validate' && req.method === 'POST') {
      const { session_token } = body;
      
      if (!session_token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Session token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session, error: sessionError } = await supabase
        .from('system_user_sessions')
        .select(`
          *,
          system_users (
            id,
            email,
            first_name,
            last_name,
            is_active
          )
        `)
        .eq('session_token', session_token)
        .single();

      if (sessionError || !session) {
        logger.warn('Session validation failed - invalid session');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if session expired
      if (new Date(session.expires_at) < new Date()) {
        await supabase
          .from('system_user_sessions')
          .delete()
          .eq('session_token', session_token);
        
        logger.warn('Session validation failed - expired');
        return new Response(
          JSON.stringify({ valid: false, error: 'Session expired' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is still active
      if (!session.system_users?.is_active) {
        logger.warn('Session validation failed - account deactivated');
        return new Response(
          JSON.stringify({ valid: false, error: 'Account deactivated' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get roles
      const { data: roles } = await supabase
        .from('system_user_roles')
        .select('role')
        .eq('system_user_id', session.system_user_id);

      // Update last activity
      await supabase
        .from('system_user_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('session_token', session_token);

      logger.complete(Date.now() - startTime, { action: 'validate', valid: true });
      return new Response(
        JSON.stringify({
          valid: true,
          user: {
            id: session.system_users.id,
            email: session.system_users.email,
            first_name: session.system_users.first_name,
            last_name: session.system_users.last_name,
            roles: roles?.map((r: { role: string }) => r.role) || [],
          },
          expires_at: session.expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REFRESH SESSION
    if (action === 'refresh' && req.method === 'POST') {
      const { session_token } = body;
      
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'Session token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session } = await supabase
        .from('system_user_sessions')
        .select('*')
        .eq('session_token', session_token)
        .single();

      if (!session || new Date(session.expires_at) < new Date()) {
        logger.warn('Session refresh failed - invalid or expired');
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extend session by 20 minutes
      const newExpiresAt = new Date(Date.now() + 20 * 60 * 1000);
      
      await supabase
        .from('system_user_sessions')
        .update({
          expires_at: newExpiresAt.toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('session_token', session_token);

      logger.complete(Date.now() - startTime, { action: 'refresh' });
      return new Response(
        JSON.stringify({
          success: true,
          expires_at: newExpiresAt.toISOString(),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.warn('Unknown action requested', { action });
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
