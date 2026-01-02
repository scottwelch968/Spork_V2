import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from '../_shared/edgeLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  const logger = createLogger('billing-webhooks');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const processorType = req.headers.get('x-payment-processor') || 'stripe';

    logger.info('Webhook received', { processorType, eventType: payload.type });

    if (processorType === 'stripe') {
      return await handleStripeWebhook(supabase, payload);
    } else if (processorType === 'paypal') {
      return await handlePayPalWebhook(supabase, payload);
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported payment processor' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleStripeWebhook(supabase: any, event: any) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      
      // Find user by external subscription ID
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('external_subscription_id', subscription.id)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'suspended',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('external_subscription_id', subscription.id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscription.id);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      // Payment succeeded - log info
      // Log successful payment, update credits, etc.
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // Payment failed - suspend subscription
      
      // Suspend subscription on payment failure
      if (invoice.subscription) {
        await supabase
          .from('user_subscriptions')
          .update({ status: 'suspended' })
          .eq('external_subscription_id', invoice.subscription);
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePayPalWebhook(supabase: any, event: any) {
  switch (event.event_type) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'BILLING.SUBSCRIPTION.UPDATED': {
      const subscription = event.resource;
      
      await supabase
        .from('user_subscriptions')
        .update({
          status: subscription.status === 'ACTIVE' ? 'active' : 'suspended',
        })
        .eq('external_subscription_id', subscription.id);
      break;
    }

    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
      const subscription = event.resource;
      
      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('external_subscription_id', subscription.id);
      break;
    }

    case 'PAYMENT.SALE.COMPLETED': {
      // PayPal payment completed
      break;
    }

    default:
      // Unhandled PayPal event type
  }

  return new Response(
    JSON.stringify({ received: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
