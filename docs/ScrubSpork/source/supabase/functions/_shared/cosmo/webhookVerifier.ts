/**
 * Webhook Signature Verification Module
 * 
 * Provides secure signature verification for external webhook integrations.
 * Supports Stripe, GitHub, and custom webhook providers.
 */

import { info, debug } from './logger.ts';

export type WebhookProvider = 'stripe' | 'github' | 'custom' | 'unknown';

export interface WebhookVerificationResult {
  verified: boolean;
  provider: WebhookProvider;
  error?: string;
  timestamp?: number;
}

interface VerificationContext {
  rawBody: string;
  signature: string;
  secret: string;
  timestamp?: number;
}

// ============= Utility Functions =============

/**
 * Timing-safe string comparison to prevent timing attacks
 */
async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    return false;
  }
  
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  
  return result === 0;
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmacSha256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const message = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============= Provider Detection =============

/**
 * Auto-detect webhook provider from request headers
 */
export function detectWebhookProvider(headers: Headers): WebhookProvider {
  if (headers.get('stripe-signature')) {
    return 'stripe';
  }
  if (headers.get('x-hub-signature-256')) {
    return 'github';
  }
  if (headers.get('x-webhook-signature') || headers.get('x-webhook-secret')) {
    return 'custom';
  }
  return 'unknown';
}

/**
 * Get the appropriate secret for a provider
 */
export function getProviderSecret(provider: WebhookProvider): string | null {
  switch (provider) {
    case 'stripe':
      return Deno.env.get('STRIPE_WEBHOOK_SECRET') || null;
    case 'github':
      return Deno.env.get('GITHUB_WEBHOOK_SECRET') || null;
    case 'custom':
      return Deno.env.get('TEST_WEBHOOK_SECRET') || null;
    default:
      return null;
  }
}

// ============= Provider-Specific Verification =============

/**
 * Verify Stripe webhook signature
 * Format: "t=1234567890,v1=abc123..."
 * Validates timestamp to prevent replay attacks (5 min tolerance)
 */
export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<WebhookVerificationResult> {
  try {
    // Parse the signature header
    const elements = signatureHeader.split(',');
    const signatureMap: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key && value) {
        signatureMap[key] = value;
      }
    }
    
    const timestamp = signatureMap['t'];
    const signature = signatureMap['v1'];
    
    if (!timestamp || !signature) {
      return {
        verified: false,
        provider: 'stripe',
        error: 'Invalid signature format: missing timestamp or signature',
      };
    }
    
    // Validate timestamp (5 minute tolerance)
    const timestampInt = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 5 * 60; // 5 minutes
    
    if (Math.abs(now - timestampInt) > tolerance) {
      return {
        verified: false,
        provider: 'stripe',
        error: 'Webhook timestamp outside tolerance window (possible replay attack)',
        timestamp: timestampInt,
      };
    }
    
    // Compute expected signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = await computeHmacSha256(secret, signedPayload);
    
    // Timing-safe comparison
    const verified = await timingSafeCompare(signature, expectedSignature);
    
    return {
      verified,
      provider: 'stripe',
      timestamp: timestampInt,
      error: verified ? undefined : 'Signature mismatch',
    };
  } catch (err) {
    return {
      verified: false,
      provider: 'stripe',
      error: `Stripe verification error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify GitHub webhook signature
 * Format: "sha256=abc123..."
 */
export async function verifyGitHubSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<WebhookVerificationResult> {
  try {
    // Parse the signature header
    if (!signatureHeader.startsWith('sha256=')) {
      return {
        verified: false,
        provider: 'github',
        error: 'Invalid signature format: must start with sha256=',
      };
    }
    
    const signature = signatureHeader.substring(7); // Remove "sha256=" prefix
    
    // Compute expected signature
    const expectedSignature = await computeHmacSha256(secret, rawBody);
    
    // Timing-safe comparison
    const verified = await timingSafeCompare(signature, expectedSignature);
    
    return {
      verified,
      provider: 'github',
      error: verified ? undefined : 'Signature mismatch',
    };
  } catch (err) {
    return {
      verified: false,
      provider: 'github',
      error: `GitHub verification error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Verify custom/generic webhook signature
 * Uses X-Webhook-Signature header with raw HMAC-SHA256
 */
export async function verifyGenericSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): Promise<WebhookVerificationResult> {
  try {
    // Handle potential "sha256=" prefix
    let signature = signatureHeader;
    if (signature.startsWith('sha256=')) {
      signature = signature.substring(7);
    }
    
    // Compute expected signature
    const expectedSignature = await computeHmacSha256(secret, rawBody);
    
    // Timing-safe comparison
    const verified = await timingSafeCompare(signature, expectedSignature);
    
    return {
      verified,
      provider: 'custom',
      error: verified ? undefined : 'Signature mismatch',
    };
  } catch (err) {
    return {
      verified: false,
      provider: 'custom',
      error: `Generic verification error: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

// ============= Main Verification Function =============

/**
 * Main webhook verification entry point
 * Auto-detects provider and verifies signature
 */
export async function verifyWebhookSignature(
  rawBody: string,
  headers: Headers
): Promise<WebhookVerificationResult> {
  const provider = detectWebhookProvider(headers);
  
  info('Webhook verification started', { provider });
  
  // If no provider detected and no signature headers, allow through (for testing)
  if (provider === 'unknown') {
    // Check if there's a secret header for custom verification
    const customSecret = headers.get('x-webhook-secret');
    if (customSecret) {
      const expectedSecret = Deno.env.get('TEST_WEBHOOK_SECRET');
      if (expectedSecret && customSecret === expectedSecret) {
        debug('Custom secret header matched');
        return {
          verified: true,
          provider: 'custom',
        };
      }
      return {
        verified: false,
        provider: 'custom',
        error: 'Invalid custom webhook secret',
      };
    }
    
    // No verification possible - check if verification is required
    const requireVerification = Deno.env.get('REQUIRE_WEBHOOK_VERIFICATION') === 'true';
    if (requireVerification) {
      return {
        verified: false,
        provider: 'unknown',
        error: 'Webhook verification required but no signature provided',
      };
    }
    
    // Allow through unverified (for development/testing)
    debug('No signature provided, allowing through (dev mode)');
    return {
      verified: true,
      provider: 'unknown',
    };
  }
  
  // Get the appropriate secret
  const secret = getProviderSecret(provider);
  if (!secret) {
    return {
      verified: false,
      provider,
      error: `No webhook secret configured for provider: ${provider}`,
    };
  }
  
  // Get the appropriate signature header
  let signatureHeader: string | null = null;
  switch (provider) {
    case 'stripe':
      signatureHeader = headers.get('stripe-signature');
      break;
    case 'github':
      signatureHeader = headers.get('x-hub-signature-256');
      break;
    case 'custom':
      signatureHeader = headers.get('x-webhook-signature');
      break;
  }
  
  if (!signatureHeader) {
    return {
      verified: false,
      provider,
      error: 'Signature header missing',
    };
  }
  
  // Verify based on provider
  switch (provider) {
    case 'stripe':
      return verifyStripeSignature(rawBody, signatureHeader, secret);
    case 'github':
      return verifyGitHubSignature(rawBody, signatureHeader, secret);
    case 'custom':
      return verifyGenericSignature(rawBody, signatureHeader, secret);
    default:
      return {
        verified: false,
        provider: 'unknown',
        error: 'Unknown provider',
      };
  }
}
