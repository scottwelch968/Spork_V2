/**
 * Webhook Adapter
 * 
 * Converts external webhook payloads into NormalizedRequest.
 */

import { normalizeRequest } from '../normalizer';
import type { NormalizedRequest, CosmoPriority } from '../contracts';

export interface WebhookInput {
  payload: Record<string, unknown>;
  provider?: string;
  secret?: string;
  callbackUrl?: string;
  priority?: CosmoPriority;
}

/**
 * Convert webhook payload to NormalizedRequest
 */
export function fromWebhook(input: WebhookInput): NormalizedRequest {
  // Extract content from common webhook payload patterns
  const content = extractContentFromPayload(input.payload);
  
  return normalizeRequest(
    {
      content,
      messages: [],
      webhookPayload: input.payload,
      webhookSecret: input.secret,
      callbackUrl: input.callbackUrl,
      requestType: 'webhook',
      source: {
        type: 'webhook',
        name: input.provider,
        metadata: input.payload,
      },
      responseMode: 'batch',
      priority: input.priority || 'normal',
    }
  );
}

/**
 * Extract content string from various webhook payload formats
 */
function extractContentFromPayload(payload: Record<string, unknown>): string {
  // GitHub webhook
  if (payload.action && payload.repository) {
    return `GitHub: ${payload.action} on ${(payload.repository as Record<string, unknown>)?.full_name || 'repository'}`;
  }
  
  // Stripe webhook
  if (payload.type && payload.data) {
    return `Stripe: ${payload.type}`;
  }
  
  // Generic message field
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  
  // Generic content field
  if (typeof payload.content === 'string') {
    return payload.content;
  }
  
  // Generic text field
  if (typeof payload.text === 'string') {
    return payload.text;
  }
  
  // Fallback: stringify the payload type
  return `Webhook received: ${JSON.stringify(Object.keys(payload))}`;
}
