import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const logger = createLogger('purchase-credits');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { packageId, discountCode } = await req.json();

    if (!packageId) {
      return new Response(
        JSON.stringify({ error: 'Package ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch credit package
    const { data: creditPackage, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (packageError || !creditPackage) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive credit package' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate final price
    let finalPrice = creditPackage.price_usd;
    let discountAmount = 0;
    let appliedDiscountCode = null;

    // Apply discount code if provided
    if (discountCode) {
      const { data: discount, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', discountCode)
        .eq('is_active', true)
        .maybeSingle();

      if (discount) {
        // Check validity
        const now = new Date();
        const validFrom = discount.valid_from ? new Date(discount.valid_from) : null;
        const validUntil = discount.valid_until ? new Date(discount.valid_until) : null;

        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          (!discount.max_uses || discount.current_uses < discount.max_uses)
        ) {
          // Apply discount
          if (discount.discount_type === 'percentage') {
            discountAmount = (finalPrice * discount.discount_value) / 100;
          } else if (discount.discount_type === 'fixed') {
            discountAmount = Math.min(discount.discount_value, finalPrice);
          }
          finalPrice -= discountAmount;
          appliedDiscountCode = discountCode;

          // Increment discount code usage
          await supabase
            .from('discount_codes')
            .update({ current_uses: discount.current_uses + 1 })
            .eq('id', discount.id);
        }
      }
    }

    // Create credit purchase record
    const totalCredits = creditPackage.credits_amount + (creditPackage.bonus_credits || 0);
    
    const { data: purchase, error: purchaseError } = await supabase
      .from('credit_purchases')
      .insert({
        user_id: user.id,
        package_id: packageId,
        credit_type: creditPackage.credit_type,
        credits_purchased: totalCredits,
        credits_remaining: totalCredits,
        amount_paid: finalPrice,
        currency: 'usd',
        discount_code: appliedDiscountCode,
        discount_amount: discountAmount,
      })
      .select()
      .single();

    if (purchaseError) {
      logger.error('Error creating purchase', { error: purchaseError.message });
      return new Response(
        JSON.stringify({ error: 'Failed to create purchase record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update usage_tracking with new credits
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current usage tracking
    const { data: usageTracking, error: trackingError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_start', periodStart.toISOString())
      .maybeSingle();

    let updateData: any = {};
    
    // Map credit type to appropriate column
    switch (creditPackage.credit_type) {
      case 'tokens':
        updateData.token_credits_remaining = (usageTracking?.token_credits_remaining || 0) + totalCredits;
        break;
      case 'images':
        updateData.image_credits_remaining = (usageTracking?.image_credits_remaining || 0) + totalCredits;
        break;
      case 'videos':
        updateData.video_credits_remaining = (usageTracking?.video_credits_remaining || 0) + totalCredits;
        break;
      case 'universal':
        // Universal credits add to all types
        updateData.token_credits_remaining = (usageTracking?.token_credits_remaining || 0) + totalCredits;
        updateData.image_credits_remaining = (usageTracking?.image_credits_remaining || 0) + totalCredits;
        updateData.video_credits_remaining = (usageTracking?.video_credits_remaining || 0) + totalCredits;
        break;
    }

    if (usageTracking) {
      // Update existing record
      await supabase
        .from('usage_tracking')
        .update(updateData)
        .eq('id', usageTracking.id);
    } else {
      // Create new record if doesn't exist
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          ...updateData,
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        purchase,
        message: `Successfully purchased ${totalCredits} ${creditPackage.credit_type} credits`
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
