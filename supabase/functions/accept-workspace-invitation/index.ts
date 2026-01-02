import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('accept-workspace-invitation');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      logger.warn('Unauthorized access attempt');
      const error = createCosmoError('UNAUTHORIZED', 'User not authenticated');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invitation_token } = await req.json();

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', invitation_token)
      .single();

    if (inviteError || !invitation) {
      logger.warn('Invalid invitation token', { token: invitation_token?.substring(0, 8) });
      const error = createCosmoError('INVALID_PAYLOAD', 'Invalid invitation token');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      logger.warn('Invitation already accepted', { invitationId: invitation.id });
      const error = createCosmoError('INVALID_PAYLOAD', 'Invitation already accepted');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      logger.warn('Invitation expired', { invitationId: invitation.id });
      const error = createCosmoError('INTEGRATION_EXPIRED', 'Invitation expired');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify email matches
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profile?.email !== invitation.email) {
      logger.warn('Email mismatch', { userId: user.id });
      const error = createCosmoError('PERMISSION_DENIED', 'Email mismatch');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user to workspace
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    await supabase
      .from('workspace_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // Log activity
    await supabase.from('workspace_activity').insert({
      workspace_id: invitation.workspace_id,
      user_id: user.id,
      action: 'member_joined',
      details: { role: invitation.role },
    });

    logger.complete(Date.now() - startTime, { 
      userId: user.id, 
      workspaceId: invitation.workspace_id 
    });

    return new Response(
      JSON.stringify({
        success: true,
        workspace_id: invitation.workspace_id,
        message: 'Successfully joined workspace',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(
      JSON.stringify({ error: cosmoError.message, code: cosmoError.code }),
      { status: cosmoError.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
