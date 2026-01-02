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
  'lovable ai': 'https://ai.gateway.lovable.dev/v1/chat/completions',
  'lovable': 'https://ai.gateway.lovable.dev/v1/chat/completions',
};

/**
 * Get API endpoint for a provider
 */
export function getProviderEndpoint(provider: string): string {
  const normalized = provider?.toLowerCase() || '';
  return PROVIDER_ENDPOINTS[normalized] || PROVIDER_ENDPOINTS['lovable ai'];
}

/**
 * Get API key for a provider from environment
 */
export function getProviderApiKey(provider: string): string | undefined {
  const normalized = provider?.toLowerCase() || '';
  
  switch (normalized) {
    case 'openrouter':
      return Deno.env.get('OPENROUTER_API_KEY');
    case 'lovable ai':
    case 'lovable':
    default:
      return Deno.env.get('LOVABLE_API_KEY');
  }
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
 * Check if a provider uses OpenRouter-style API
 */
export function isOpenRouterProvider(provider: string): boolean {
  return provider?.toLowerCase() === 'openrouter';
}

/**
 * Check if a provider is Lovable AI
 */
export function isLovableProvider(provider: string): boolean {
  const normalized = provider?.toLowerCase() || '';
  return normalized === 'lovable ai' || normalized === 'lovable' || normalized === '';
}
