import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('track-usage');
  logger.start();
  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      userId,
      eventType,
      modelUsed,
      tokensInput = 0,
      tokensOutput = 0,
      tokensReasoning = 0,
      costUsd = 0,
      openrouterGenerationId,
      requestId,
      responseTimeMs,
    } = await req.json();

    if (!userId || !eventType) {
      logger.warn('Missing required fields', { userId, eventType });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, eventType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info('Processing usage event', { userId, eventType, modelUsed });

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, tier_id, subscription_tiers!inner(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      logger.warn('Error fetching subscription', { error: subError.message });
    }

    // Log usage event
    const { error: eventError } = await supabase
      .from('usage_events')
      .insert({
        user_id: userId,
        subscription_id: subscription?.id || null,
        event_type: eventType,
        model_used: modelUsed,
        openrouter_generation_id: openrouterGenerationId,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        tokens_reasoning: tokensReasoning,
        cost_usd: costUsd,
        request_id: requestId,
        response_time_ms: responseTimeMs,
      });

    if (eventError) {
      logger.error('Error logging usage event', { error: eventError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to log usage event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create usage tracking record
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dailyResetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Get current usage tracking record
    const { data: usageTracking, error: trackingError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart.toISOString())
      .maybeSingle();

    if (trackingError && trackingError.code !== 'PGRST116') {
      logger.warn('Error fetching usage tracking', { error: trackingError.message });
    }

    // Prepare update data based on event type
    let updateData: any = {
      last_usage_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Check if daily reset is needed
    const needsDailyReset = !usageTracking?.daily_reset_at || 
      new Date(usageTracking.daily_reset_at) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (needsDailyReset) {
      updateData.daily_tokens_input_used = 0;
      updateData.daily_tokens_output_used = 0;
      updateData.daily_images_used = 0;
      updateData.daily_videos_used = 0;
      updateData.daily_reset_at = dailyResetAt.toISOString();
    }

    // Check quotas and deduct from credits if over subscription quota
    const inputQuota = (subscription?.subscription_tiers as any)?.monthly_token_input_quota || 0;
    const outputQuota = (subscription?.subscription_tiers as any)?.monthly_token_output_quota || 0;
    const imageQuota = (subscription?.subscription_tiers as any)?.monthly_image_quota || 0;
    const videoQuota = (subscription?.subscription_tiers as any)?.monthly_video_quota || 0;

    switch (eventType) {
      case 'text_generation':
        const inputUsed = usageTracking?.tokens_input_used || 0;
        const outputUsed = usageTracking?.tokens_output_used || 0;
        
        updateData.tokens_input_used = inputUsed + tokensInput;
        updateData.tokens_output_used = outputUsed + tokensOutput;
        updateData.daily_tokens_input_used = (needsDailyReset ? 0 : usageTracking?.daily_tokens_input_used || 0) + tokensInput;
        updateData.daily_tokens_output_used = (needsDailyReset ? 0 : usageTracking?.daily_tokens_output_used || 0) + tokensOutput;
        
        // Deduct from credits if over quota
        if (inputUsed + tokensInput > inputQuota || outputUsed + tokensOutput > outputQuota) {
          const tokensToDeduct = tokensInput + tokensOutput;
          const currentCredits = usageTracking?.token_credits_remaining || 0;
          updateData.token_credits_remaining = Math.max(0, currentCredits - tokensToDeduct);
        }
        break;
        
      case 'image_generation':
        const imagesUsed = usageTracking?.images_generated || 0;
        
        updateData.images_generated = imagesUsed + 1;
        updateData.daily_images_used = (needsDailyReset ? 0 : usageTracking?.daily_images_used || 0) + 1;
        
        // Deduct from credits if over quota
        if (imagesUsed >= imageQuota) {
          const currentCredits = usageTracking?.image_credits_remaining || 0;
          updateData.image_credits_remaining = Math.max(0, currentCredits - 1);
        }
        break;
        
      case 'video_generation':
        const videosUsed = usageTracking?.videos_generated || 0;
        
        updateData.videos_generated = videosUsed + 1;
        updateData.daily_videos_used = (needsDailyReset ? 0 : usageTracking?.daily_videos_used || 0) + 1;
        
        // Deduct from credits if over quota
        if (videosUsed >= videoQuota) {
          const currentCredits = usageTracking?.video_credits_remaining || 0;
          updateData.video_credits_remaining = Math.max(0, currentCredits - 1);
        }
        break;
        
      case 'document_parsing':
        updateData.documents_parsed = (usageTracking?.documents_parsed || 0) + 1;
        break;
    }

    if (usageTracking) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('usage_tracking')
        .update(updateData)
        .eq('id', usageTracking.id);

      if (updateError) {
        logger.warn('Error updating usage tracking', { error: updateError.message });
      }
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          subscription_id: subscription?.id || null,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_input_quota: (subscription?.subscription_tiers as any)?.monthly_token_input_quota,
          tokens_output_quota: (subscription?.subscription_tiers as any)?.monthly_token_output_quota,
          images_quota: (subscription?.subscription_tiers as any)?.monthly_image_quota,
          videos_quota: (subscription?.subscription_tiers as any)?.monthly_video_quota,
          documents_quota: (subscription?.subscription_tiers as any)?.monthly_document_parsing_quota,
          ...updateData,
        });

      if (insertError) {
        logger.warn('Error inserting usage tracking', { error: insertError.message });
      }
    }

    logger.complete(Date.now() - startTime, { eventType, userId });

    return new Response(
      JSON.stringify({ success: true, message: 'Usage tracked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
