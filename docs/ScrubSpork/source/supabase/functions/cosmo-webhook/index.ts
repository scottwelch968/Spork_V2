/**
 * Cosmo Webhook Edge Function
 * Thin wrapper for external webhook triggers - delegates to COSMO orchestrator
 * 
 * Supports signature verification for:
 * - Stripe webhooks (Stripe-Signature header)
 * - GitHub webhooks (X-Hub-Signature-256 header)
 * - Custom webhooks (X-Webhook-Signature or X-Webhook-Secret headers)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { orchestrate, corsHeaders, verifyWebhookSignature, detectWebhookProvider } from "../_shared/cosmo/index.ts";
import type { CosmoRequest, WebhookVerificationResult } from "../_shared/cosmo/types.ts";
import { createLogger } from '../_shared/edgeLogger.ts';

serve(async (req) => {
  const logger = createLogger('cosmo-webhook');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Clone request to read body twice (for verification and parsing)
  const rawBody = await req.text();
  
  try {
    // Detect webhook provider for logging
    const provider = detectWebhookProvider(req.headers);
    logger.info('Received webhook', { provider });
    
    // Verify webhook signature
    const verificationResult: WebhookVerificationResult = await verifyWebhookSignature(
      rawBody,
      req.headers
    );
    
    logger.info('Verification result', {
      verified: verificationResult.verified,
      provider: verificationResult.provider,
      error: verificationResult.error,
    });
    
    // Reject if verification failed
    if (!verificationResult.verified) {
      logger.error('Signature verification failed', { error: verificationResult.error, provider: verificationResult.provider });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Webhook signature verification failed',
          details: verificationResult.error,
          provider: verificationResult.provider,
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Parse the body as JSON
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      logger.error('Failed to parse webhook body as JSON');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON payload',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logger.info('Processing verified webhook event', { event: body.event || 'unknown' });
    
    // Build Cosmo request for webhook
    const cosmoRequest: CosmoRequest = {
      content: (body.event as string) || 'webhook_trigger',
      messages: [],
      requestType: 'webhook',
      source: {
        type: 'webhook',
        name: (body.source as string) || verificationResult.provider,
        metadata: {
          ...body,
          verificationResult,
        },
      },
      responseMode: 'batch',
      webhookPayload: {
        event: body.event as string,
        data: (body.data as Record<string, unknown>) || body,
        timestamp: new Date().toISOString(),
        signature: req.headers.get('x-webhook-signature') || 
                   req.headers.get('stripe-signature') || 
                   req.headers.get('x-hub-signature-256') || 
                   undefined,
      },
    };

    // Orchestrate
    const result = await orchestrate(cosmoRequest);
    
    // Read the stream and return as JSON
    const reader = result.stream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const responseBody = new TextDecoder().decode(
      new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], [] as number[]))
    );

    // Include verification info in response
    let parsedResponse: Record<string, unknown>;
    try {
      parsedResponse = JSON.parse(responseBody);
    } catch {
      parsedResponse = { raw: responseBody };
    }
    
    const finalResponse = {
      ...parsedResponse,
      verificationResult: {
        verified: verificationResult.verified,
        provider: verificationResult.provider,
      },
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logger.fail(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
