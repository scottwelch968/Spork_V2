import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const logger = createLogger('send-workspace-invitation');
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

    const { email, workspace_id } = await req.json();

    logger.info('Processing invitation', { email, workspaceId: workspace_id });

    // Verify user is the workspace owner
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, owner_id')
      .eq('id', workspace_id)
      .single();

    if (!workspace || workspace.owner_id !== user.id) {
      logger.warn('Non-owner attempted to invite', { userId: user.id, workspaceId: workspace_id });
      const error = createCosmoError('PERMISSION_DENIED', 'Only workspace owners can invite members');
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.httpStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation - always as 'member' role
    const { data: invitation, error: inviteError } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id,
        email,
        role: 'member', // Always invite as team member
        invited_by: user.id,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) throw inviteError;

    // Get inviter profile
    const { data: inviter } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviter?.first_name && inviter?.last_name 
      ? `${inviter.first_name} ${inviter.last_name}` 
      : inviter?.email || 'A team member';

    // Log activity
    await supabase.from('workspace_activity').insert({
      workspace_id,
      user_id: user.id,
      action: 'member_invited',
      details: { email, role: 'member' },
    });

    const inviteUrl = `${req.headers.get('origin')}/invite/${invitationToken}`;

    logger.info('Invitation created', { email, workspaceId: workspace_id });

    // Trigger workspace_invitation email event
    try {
      const { error: emailError } = await supabase.functions.invoke('process-system-event', {
        body: {
          event_type: 'workspace_invitation',
          user_id: user.id,
          data: {
            invitee_email: email,
            inviter_name: inviterName,
            inviter_email: inviter?.email || user.email,
            workspace_name: workspace.name,
            invite_link: inviteUrl,
            expires_at: expiresAt.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            }),
          },
        },
      });

      if (emailError) {
        logger.warn('Failed to trigger invitation email', { error: emailError.message });
        // Don't throw - invitation was still created successfully
      } else {
        logger.info('Invitation email triggered', { email });
      }
    } catch (emailErr) {
      logger.warn('Error triggering email event', { error: emailErr instanceof Error ? emailErr.message : 'Unknown' });
      // Don't throw - invitation was still created successfully
    }

    logger.complete(Date.now() - startTime, { 
      invitationId: invitation.id, 
      email 
    });

    return new Response(
      JSON.stringify({
        invitation,
        inviteUrl,
        message: 'Invitation sent successfully',
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
