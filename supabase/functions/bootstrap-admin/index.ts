import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Password hashing using Web Crypto API (same format as system-auth)
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

serve(async (req) => {
  const logger = createLogger('bootstrap-admin');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use anon key for initial request validation, service key for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { email, password, first_name, last_name } = await req.json();

    if (!email || !password) {
      logger.warn('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Checking for existing super admin');

    // Check if any super_admin already exists
    const { data: existingAdmins } = await supabase
      .from('system_user_roles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      logger.warn('Super admin already exists');
      return new Response(
        JSON.stringify({ error: 'A super admin already exists. Use the admin panel to create additional users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('system_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      // Update existing user with proper password hash
      logger.info('Updating existing user', { email });
      const passwordHash = await hashPassword(password);
      
      const { error: updateError } = await supabase
        .from('system_users')
        .update({
          password_hash: passwordHash,
          first_name: first_name || 'System',
          last_name: last_name || 'Administrator',
          is_active: true
        })
        .eq('id', existingUser.id);

      if (updateError) {
        throw updateError;
      }

      // Ensure super_admin role exists
      await supabase
        .from('system_user_roles')
        .upsert({
          system_user_id: existingUser.id,
          role: 'super_admin'
        }, { onConflict: 'system_user_id,role' });

      logger.complete(Date.now() - startTime, { action: 'update', email });
      return new Response(
        JSON.stringify({ success: true, message: 'Existing admin user updated with new password' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user
    logger.info('Creating new super admin', { email });
    const passwordHash = await hashPassword(password);

    const { data: newUser, error: createError } = await supabase
      .from('system_users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: first_name || 'System',
        last_name: last_name || 'Administrator',
        is_active: true
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    // Assign super_admin role
    const { error: roleError } = await supabase
      .from('system_user_roles')
      .insert({
        system_user_id: newUser.id,
        role: 'super_admin'
      });

    if (roleError) {
      throw roleError;
    }

    // Log the action
    await supabase.from('system_audit_log').insert({
      system_user_id: newUser.id,
      action: 'bootstrap_admin_created',
      details: { email }
    });

    logger.complete(Date.now() - startTime, { action: 'create', email });
    return new Response(
      JSON.stringify({ success: true, message: 'Super admin created successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.fail(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
