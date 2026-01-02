import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  const logger = createLogger('report-test-results');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret if configured
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('TEST_WEBHOOK_SECRET');
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      logger.warn('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    logger.info('Received test results', { 
      runId: body.run_id, 
      status: body.status, 
      totalTests: body.total_tests 
    });

    const {
      run_id,
      branch,
      commit_sha,
      commit_message,
      triggered_by = 'ci',
      started_at,
      completed_at,
      duration_ms,
      total_tests = 0,
      passed = 0,
      failed = 0,
      skipped = 0,
      coverage_statements,
      coverage_branches,
      coverage_functions,
      coverage_lines,
      failed_tests = [],
      coverage_details = [],
      status = 'pending',
      error_message,
    } = body;

    if (!run_id) {
      logger.warn('Missing run_id');
      return new Response(
        JSON.stringify({ error: 'run_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert test run (update if run_id exists)
    const { data, error } = await supabase
      .from('test_runs')
      .upsert({
        run_id,
        branch,
        commit_sha,
        commit_message,
        triggered_by,
        started_at,
        completed_at,
        duration_ms,
        total_tests,
        passed,
        failed,
        skipped,
        coverage_statements,
        coverage_branches,
        coverage_functions,
        coverage_lines,
        failed_tests,
        coverage_details,
        status,
        error_message,
      }, { onConflict: 'run_id' })
      .select()
      .single();

    if (error) {
      logger.error('Database error', { error: error.message });
      throw error;
    }

    logger.complete(Date.now() - startTime, { 
      testRunId: data.id, 
      status 
    });

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
