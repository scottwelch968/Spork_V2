import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('check-quota');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      userId,
      actionType, // 'text_generation', 'image_generation', 'video_generation', 'document_parsing'
      tokensInput = 0,
      tokensOutput = 0,
    } = await req.json();

    if (!userId || !actionType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, actionType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is an admin (super user) - bypass all quotas
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminRole) {
      logger.info('Admin user bypassing quotas', { userId });
      return new Response(
        JSON.stringify({ 
          allowed: true,
          unlimited: true,
          isSuperUser: true,
          tokenCredits: Infinity,
          imageCredits: Infinity,
          videoCredits: Infinity,
          subscription: {
            tier: 'Super User',
            is_trial: false,
            trial_ends_at: null,
          },
          usage: {
            tokens_input: 0,
            tokens_output: 0,
            images: 0,
            videos: 0,
            documents: 0,
          },
          quotas: {
            tokens_input: null,
            tokens_output: null,
            images: null,
            videos: null,
            documents: null,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('id, tier_id, status, is_trial, trial_ends_at, subscription_tiers!inner(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      logger.error('Error fetching subscription', { error: subError.message, userId });
      return new Response(
        JSON.stringify({ allowed: false, reason: 'No active subscription found' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscription) {
      return new Response(
        JSON.stringify({ allowed: false, reason: 'No active subscription found' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if trial has expired
    if (subscription.is_trial && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at);
      if (trialEnd < new Date()) {
        await supabase
          .from('user_subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscription.id);

        return new Response(
          JSON.stringify({ allowed: false, reason: 'Trial period has expired' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get current usage tracking (with credit balances)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', periodStart.toISOString())
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') {
      logger.error('Error fetching usage', { error: usageError.message, userId });
    }

    const tier = subscription.subscription_tiers as any;

    // Credit balances
    const tokenCredits = usage?.token_credits_remaining || 0;
    const imageCredits = usage?.image_credits_remaining || 0;
    const videoCredits = usage?.video_credits_remaining || 0;

    // Check daily limits for trial users
    const needsDailyReset = !usage?.daily_reset_at || 
      new Date(usage.daily_reset_at) < new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dailyTokensInputUsed = needsDailyReset ? 0 : (usage?.daily_tokens_input_used || 0);
    const dailyTokensOutputUsed = needsDailyReset ? 0 : (usage?.daily_tokens_output_used || 0);
    const dailyImagesUsed = needsDailyReset ? 0 : (usage?.daily_images_used || 0);
    const dailyVideosUsed = needsDailyReset ? 0 : (usage?.daily_videos_used || 0);

    // Check quotas based on action type
    switch (actionType) {
      case 'text_generation': {
        // Check monthly quota
        const inputUsed = usage?.tokens_input_used || 0;
        const outputUsed = usage?.tokens_output_used || 0;
        const inputExceeded = tier.monthly_token_input_quota && inputUsed + tokensInput > tier.monthly_token_input_quota;
        const outputExceeded = tier.monthly_token_output_quota && outputUsed + tokensOutput > tier.monthly_token_output_quota;

        // If quota exceeded, check if user has credits
        if (inputExceeded || outputExceeded) {
          const tokensNeeded = tokensInput + tokensOutput;
          if (tokenCredits < tokensNeeded) {
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: 'Monthly token quota exceeded and insufficient credits',
                tokenCredits,
                usage: { input: inputUsed, output: outputUsed },
                quota: { input: tier.monthly_token_input_quota, output: tier.monthly_token_output_quota },
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Check daily limits (always enforced, even with credits)
        if (subscription.is_trial) {
          if (tier.daily_token_input_limit && 
              dailyTokensInputUsed + tokensInput > tier.daily_token_input_limit) {
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: 'Daily input token limit exceeded',
                usage: dailyTokensInputUsed,
                limit: tier.daily_token_input_limit,
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          if (tier.daily_token_output_limit && 
              dailyTokensOutputUsed + tokensOutput > tier.daily_token_output_limit) {
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: 'Daily output token limit exceeded',
                usage: dailyTokensOutputUsed,
                limit: tier.daily_token_output_limit,
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        break;
      }

      case 'image_generation': {
        const imagesUsed = usage?.images_generated || 0;
        
        // Check if exceeds subscription quota
        if (tier.monthly_image_quota && imagesUsed >= tier.monthly_image_quota) {
          // Check if user has image credits
          if (imageCredits < 1) {
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: 'Monthly image quota exceeded and no credits available',
                imageCredits,
                usage: imagesUsed,
                quota: tier.monthly_image_quota,
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Check daily limit (always enforced)
        if (subscription.is_trial && tier.daily_image_limit && 
            dailyImagesUsed >= tier.daily_image_limit) {
          return new Response(
            JSON.stringify({ 
              allowed: false, 
              reason: 'Daily image limit exceeded',
              usage: dailyImagesUsed,
              limit: tier.daily_image_limit,
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'video_generation': {
        const videosUsed = usage?.videos_generated || 0;
        
        // Check if exceeds subscription quota
        if (tier.monthly_video_quota && videosUsed >= tier.monthly_video_quota) {
          // Check if user has video credits
          if (videoCredits < 1) {
            return new Response(
              JSON.stringify({ 
                allowed: false, 
                reason: 'Monthly video quota exceeded and no credits available',
                videoCredits,
                usage: videosUsed,
                quota: tier.monthly_video_quota,
              }),
              { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Check daily limit (always enforced)
        if (subscription.is_trial && tier.daily_video_limit && 
            dailyVideosUsed >= tier.daily_video_limit) {
          return new Response(
            JSON.stringify({ 
              allowed: false, 
              reason: 'Daily video limit exceeded',
              usage: dailyVideosUsed,
              limit: tier.daily_video_limit,
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }

      case 'document_parsing': {
        if (tier.monthly_document_parsing_quota && 
            (usage?.documents_parsed || 0) >= tier.monthly_document_parsing_quota) {
          return new Response(
            JSON.stringify({ 
              allowed: false, 
              reason: 'Monthly document parsing quota exceeded',
              usage: usage?.documents_parsed || 0,
              quota: tier.monthly_document_parsing_quota,
            }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;
      }
    }

    // All checks passed
    return new Response(
      JSON.stringify({ 
        allowed: true,
        tokenCredits,
        imageCredits,
        videoCredits,
        subscription: {
          tier: tier.name,
          is_trial: subscription.is_trial,
          trial_ends_at: subscription.trial_ends_at,
        },
        usage: {
          tokens_input: usage?.tokens_input_used || 0,
          tokens_output: usage?.tokens_output_used || 0,
          images: usage?.images_generated || 0,
          videos: usage?.videos_generated || 0,
          documents: usage?.documents_parsed || 0,
        },
        quotas: {
          tokens_input: tier.monthly_token_input_quota,
          tokens_output: tier.monthly_token_output_quota,
          images: tier.monthly_image_quota,
          videos: tier.monthly_video_quota,
          documents: tier.monthly_document_parsing_quota,
        },
      }),
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