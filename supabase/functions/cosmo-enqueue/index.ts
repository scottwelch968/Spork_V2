import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";
import type { CosmoPriority } from "../_shared/cosmo/contracts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnqueueRequest {
  workspace_id: string;
  request_payload: {
    messages: { role: string; content: string }[];
    context?: Record<string, unknown>;
  };
  priority?: CosmoPriority;
  callback_url?: string;
  idempotency_key?: string;
  request_type?: string;
}

const priorityScores: Record<CosmoPriority, number> = {
  critical: 100,
  high: 80,
  normal: 50,
  low: 20,
};

serve(async (req) => {
  const logger = createLogger('cosmo-enqueue');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logger.start();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth to verify token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      logger.error('Auth error', { error: authError?.message });
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: EnqueueRequest = await req.json();
    const {
      workspace_id,
      request_payload,
      priority = 'normal',
      callback_url,
      idempotency_key,
      request_type = 'chat',
    } = body;

    // Validate required fields
    if (!workspace_id) {
      return new Response(
        JSON.stringify({ error: 'workspace_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!request_payload?.messages || !Array.isArray(request_payload.messages)) {
      return new Response(
        JSON.stringify({ error: 'request_payload.messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate workspace membership using service role
    const { data: workspace, error: workspaceError } = await supabaseService
      .from('workspaces')
      .select('id, owner_id, is_suspended')
      .eq('id', workspace_id)
      .single();

    if (workspaceError || !workspace) {
      logger.error('Workspace lookup error', { error: workspaceError?.message, workspaceId: workspace_id });
      return new Response(
        JSON.stringify({ error: 'Workspace not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if workspace is suspended
    if (workspace.is_suspended) {
      return new Response(
        JSON.stringify({ error: 'Workspace is suspended' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is owner or member
    const isOwner = workspace.owner_id === user.id;
    
    let isMember = false;
    if (!isOwner) {
      const { data: membership } = await supabaseService
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', user.id)
        .single();
      
      isMember = !!membership;
    }

    if (!isOwner && !isMember) {
      return new Response(
        JSON.stringify({ error: 'Access denied to workspace' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check quota before enqueuing - BLOCKING enforcement
    const { data: quotaData, error: quotaInvokeError } = await supabaseService.functions.invoke('check-quota', {
      body: {
        user_id: user.id,
        workspace_id,
        action_type: request_type === 'image' ? 'image_generation' : 'text_generation',
      }
    });

    // Fail-closed: if quota service fails, reject the request
    if (quotaInvokeError) {
      logger.error('Quota service invocation failed', { error: quotaInvokeError.message });
      return new Response(
        JSON.stringify({ 
          error: 'Unable to verify quota. Please try again.',
          code: 'quota_service_unavailable',
          details: 'The quota verification service is temporarily unavailable.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate quota response
    if (!quotaData || typeof quotaData !== 'object') {
      logger.error('Invalid quota response', { quotaData });
      return new Response(
        JSON.stringify({ 
          error: 'Unable to verify quota. Please try again.',
          code: 'quota_response_invalid',
          details: 'Received invalid response from quota service.'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if quota was exceeded (check-quota returns allowed: false when exceeded)
    if (quotaData.allowed === false) {
      logger.warn('Quota exceeded', { userId: user.id, workspaceId: workspace_id, reason: quotaData.reason });
      return new Response(
        JSON.stringify({ 
          error: quotaData.reason || 'Quota exceeded',
          code: 'quota_exceeded',
          details: quotaData.details || 'You have exceeded your usage limits.',
          quota: {
            used: quotaData.usage?.used,
            limit: quotaData.usage?.limit,
            remaining: quotaData.usage?.remaining,
            resetsAt: quotaData.usage?.resetsAt,
            creditsAvailable: quotaData.credits?.available,
          },
          upgrade: {
            message: 'Upgrade your plan or purchase credits to continue.',
            path: '/settings/billing'
          }
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Quota check passed', { userId: user.id, allowed: quotaData.allowed });

    // Check idempotency - if key exists and request succeeded, return existing result
    if (idempotency_key) {
      const { data: existingRequest } = await supabaseService
        .from('cosmo_request_queue')
        .select('id, status, result_payload')
        .eq('callback_url', idempotency_key) // Using callback_url to store idempotency key
        .single();

      if (existingRequest) {
        return new Response(
          JSON.stringify({
            id: existingRequest.id,
            status: existingRequest.status,
            result: existingRequest.result_payload,
            idempotent: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calculate priority score
    const priority_score = priorityScores[priority] || priorityScores.normal;

    // Calculate expiration (24 hours from now)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    // Insert queue row using service role
    const { data: queueItem, error: insertError } = await supabaseService
      .from('cosmo_request_queue')
      .insert({
        user_id: user.id,
        workspace_id,
        request_type,
        request_payload,
        priority,
        priority_score,
        status: 'pending',
        callback_url: idempotency_key || callback_url || null,
        expires_at: expires_at.toISOString(),
        max_retries: 3,
        retry_count: 0,
      })
      .select('id, status, priority, priority_score, created_at')
      .single();

    if (insertError) {
      logger.error('Queue insert error', { error: insertError.message });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to enqueue request',
          details: insertError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Enqueued request', { requestId: queueItem.id, userId: user.id, workspaceId: workspace_id });

    return new Response(
      JSON.stringify({
        id: queueItem.id,
        status: queueItem.status,
        priority: queueItem.priority,
        priority_score: queueItem.priority_score,
        created_at: queueItem.created_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
