/**
 * Provider Configuration
 * 
 * Centralized provider endpoint and API key management.
 * All provider-specific logic should use these helpers instead of hard-coding values.
 */

/**
 * Provider endpoint mapping
 */
const PROVIDER_ENDPOINTS: Record<string, string> = {
  'openrouter': 'https://openrouter.ai/api/v1/chat/completions',
};

/**
 * Get API endpoint for a provider
 * Defaults to OpenRouter if provider not found
 */
export function getProviderEndpoint(provider: string): string {
  const normalized = provider?.toLowerCase() || 'openrouter';
  return PROVIDER_ENDPOINTS[normalized] || PROVIDER_ENDPOINTS['openrouter'];
}

/**
 * Get API key for a provider from environment
 * Requires OPENROUTER_API_KEY to be set
 */
export function getProviderApiKey(provider: string): string | undefined {
  const normalized = provider?.toLowerCase() || 'openrouter';
  
  if (normalized === 'openrouter') {
    const key = Deno.env.get('OPENROUTER_API_KEY');
    if (!key) {
      throw new Error('OPENROUTER_API_KEY is required but not set. Please configure it in Supabase Edge Function secrets.');
    }
    return key;
  }
  
  // Unknown provider - default to OpenRouter
  const key = Deno.env.get('OPENROUTER_API_KEY');
  if (!key) {
    throw new Error(`Provider "${provider}" is not supported. OPENROUTER_API_KEY is required.`);
  }
  return key;
}

/**
 * Get default headers for a provider
 */
export function getProviderHeaders(provider: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  
  if (provider?.toLowerCase() === 'openrouter') {
    headers['HTTP-Referer'] = 'https://spork.app';
    headers['X-Title'] = 'Spork AI';
  }
  
  return headers;
}

/**
 * Check if a provider is OpenRouter (default provider)
 */
export function isOpenRouterProvider(provider: string): boolean {
  const normalized = provider?.toLowerCase() || 'openrouter';
  return normalized === 'openrouter' || normalized === '';
}
