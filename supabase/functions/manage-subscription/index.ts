import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('manage-subscription');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      action,
      userId,
      tierId,
      externalSubscriptionId,
      paymentProcessor,
      isTrial = false,
      trialDurationDays,
    } = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'create': {
        if (!tierId) {
          return new Response(
            JSON.stringify({ error: 'Missing tierId for create action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get tier information
        const { data: tier, error: tierError } = await supabase
          .from('subscription_tiers')
          .select('*')
          .eq('id', tierId)
          .single();

        if (tierError) {
          return new Response(
            JSON.stringify({ error: 'Invalid tier ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const now = new Date();
        const periodStart = now;
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        
        let trialEnds = null;
        let trialStarted = null;
        
        if (isTrial && tier.trial_duration_days) {
          trialStarted = now;
          trialEnds = new Date(now);
          trialEnds.setDate(trialEnds.getDate() + tier.trial_duration_days);
        }

        // Create subscription
        const { data: subscription, error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            tier_id: tierId,
            status: 'active',
            is_trial: isTrial,
            trial_started_at: trialStarted?.toISOString(),
            trial_ends_at: trialEnds?.toISOString(),
            external_subscription_id: externalSubscriptionId,
            payment_processor: paymentProcessor,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .select()
          .single();

        if (subError) {
          logger.error('Error creating subscription', { error: subError.message, userId });
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create initial usage tracking record
        await supabase.from('usage_tracking').insert({
          user_id: userId,
          subscription_id: subscription.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          tokens_input_quota: tier.monthly_token_input_quota,
          tokens_output_quota: tier.monthly_token_output_quota,
          images_quota: tier.monthly_image_quota,
          videos_quota: tier.monthly_video_quota,
          documents_quota: tier.monthly_document_parsing_quota,
          daily_reset_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(),
        });

        return new Response(
          JSON.stringify({ success: true, subscription }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'cancel': {
        // Update subscription status
        const { error: cancelError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('status', 'active');

        if (cancelError) {
          logger.error('Error cancelling subscription', { error: cancelError.message, userId });
          return new Response(
            JSON.stringify({ error: 'Failed to cancel subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update profile account status to cancelled
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ account_status: 'cancelled' })
          .eq('id', userId);

        if (profileError) {
          logger.error('Error updating profile status', { error: profileError.message, userId });
        }

        // Sign out user from all sessions
        try {
          await supabase.auth.admin.signOut(userId, 'global');
        } catch (signOutError: any) {
          logger.error('Error signing out user', { error: signOutError?.message, userId });
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'suspend': {
        const { error: suspendError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'suspended' })
          .eq('user_id', userId)
          .eq('status', 'active');

        if (suspendError) {
          logger.error('Error suspending subscription', { error: suspendError.message, userId });
          return new Response(
            JSON.stringify({ error: 'Failed to suspend subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription suspended' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reactivate': {
        // Reactivate subscription
        const { error: reactivateError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('user_id', userId)
          .in('status', ['suspended', 'cancelled']);

        if (reactivateError) {
          logger.error('Error reactivating subscription', { error: reactivateError.message, userId });
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Reactivate profile account status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ account_status: 'active' })
          .eq('id', userId);

        if (profileError) {
          logger.error('Error updating profile status', { error: profileError.message, userId });
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription reactivated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
