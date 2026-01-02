import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jwtDecode } from 'https://esm.sh/jwt-decode@4.0.0';
import { createLogger } from "../_shared/edgeLogger.ts";
import { createCosmoError, errorFromException, isCosmoError } from "../_shared/cosmo/errors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuotaCheckResult {
  allowed: boolean;
  currentUsedMb: number;
  quotaMb: number | null;
  warningLevel: null | '80%' | '95%' | '100%';
  remainingMb: number | null;
  unlimited?: boolean;
  isSuperUser?: boolean;
}

interface JwtPayload {
  sub: string;
  exp: number;
  aud: string;
}

Deno.serve(async (req) => {
  const logger = createLogger('check-file-quota');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logger.warn('No authorization header');
      const error = createCosmoError('UNAUTHORIZED', 'No authorization header');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract and decode the JWT token directly
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        logger.warn('Token expired');
        const error = createCosmoError('UNAUTHORIZED', 'Token expired');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      userId = decoded.sub;
      if (!userId) {
        const error = createCosmoError('UNAUTHORIZED', 'No user ID in token');
        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
          status: error.httpStatus,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (decodeError) {
      logger.warn('Token decode error', { error: decodeError instanceof Error ? decodeError.message : 'Unknown' });
      const error = createCosmoError('UNAUTHORIZED', 'Invalid token');
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.httpStatus,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = { id: userId };

    // Check if user is an admin (super user) - bypass all quotas
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminRole) {
      // Get actual usage even for super users so they can see their storage
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('file_storage_used_bytes')
        .eq('user_id', user.id)
        .eq('period_start', `${currentMonth}-01`)
        .single();

      const currentUsedBytes = usage?.file_storage_used_bytes || 0;
      const currentUsedMb = currentUsedBytes / (1024 * 1024);

      logger.info('Super user quota check', { 
        userId: user.id, 
        usedMb: currentUsedMb.toFixed(2) 
      });
      
      const result: QuotaCheckResult = {
        allowed: true,
        currentUsedMb: Math.round(currentUsedMb * 100) / 100,
        quotaMb: null,
        warningLevel: null,
        remainingMb: null,
        unlimited: true,
        isSuperUser: true,
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileSizeBytes } = await req.json();

    // Get user's subscription to determine quota
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // Get quota from subscription tier
    let quotaMb: number | null = null;
    if (subscription?.tier_id) {
      const { data: tier } = await supabase
        .from('subscription_tiers')
        .select('monthly_file_storage_quota_mb')
        .eq('id', subscription.tier_id)
        .single();
      quotaMb = tier?.monthly_file_storage_quota_mb || null;
    }

    // Get current usage from usage_tracking
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('file_storage_used_bytes')
      .eq('user_id', user.id)
      .eq('period_start', `${currentMonth}-01`)
      .single();

    const currentUsedBytes = usage?.file_storage_used_bytes || 0;
    const currentUsedMb = currentUsedBytes / (1024 * 1024);
    
    // Calculate warning level and allowed status
    let warningLevel: null | '80%' | '95%' | '100%' = null;
    let allowed = true;
    let remainingMb: number | null = null;

    if (quotaMb !== null) {
      const projectedUsedMb = currentUsedMb + (fileSizeBytes || 0) / (1024 * 1024);
      const percentage = (currentUsedMb / quotaMb) * 100;
      remainingMb = Math.max(0, quotaMb - currentUsedMb);

      if (percentage >= 100 || projectedUsedMb > quotaMb) {
        warningLevel = '100%';
        allowed = fileSizeBytes ? projectedUsedMb <= quotaMb : false;
      } else if (percentage >= 95) {
        warningLevel = '95%';
      } else if (percentage >= 80) {
        warningLevel = '80%';
      }

      // Block if the upload would exceed quota
      if (fileSizeBytes && projectedUsedMb > quotaMb) {
        allowed = false;
      }
    }

    const result: QuotaCheckResult = {
      allowed,
      currentUsedMb: Math.round(currentUsedMb * 100) / 100,
      quotaMb,
      warningLevel,
      remainingMb: remainingMb !== null ? Math.round(remainingMb * 100) / 100 : null,
    };

    logger.complete(Date.now() - startTime, { 
      userId: user.id, 
      usedMb: currentUsedMb.toFixed(2), 
      quotaMb: quotaMb || 'unlimited',
      warning: warningLevel 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    logger.fail(error);
    const cosmoError = isCosmoError(error) ? error : errorFromException(error);
    return new Response(JSON.stringify({ error: cosmoError.message, code: cosmoError.code }), {
      status: cosmoError.httpStatus,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
