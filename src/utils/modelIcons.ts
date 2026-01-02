// AI Model Icon Mapping Utility
// Maps model providers/brands to their icon URLs using Simple Icons CDN

const SIMPLE_ICONS_CDN = 'https://cdn.simpleicons.org';

// Provider brand mappings to Simple Icons slugs
const PROVIDER_ICON_MAP: Record<string, string> = {
  // Major providers
  'anthropic': 'anthropic',
  'google': 'google',
  'openai': 'openai',
  'meta': 'meta',
  'mistral': 'mistralai',
  'amazon': 'amazon',
  'microsoft': 'microsoft',
  'nvidia': 'nvidia',
  'cohere': 'cohere',
  
  // Other providers
  'deepseek': 'deepseek',
  'qwen': 'alibabadotcom',
  'perplexity': 'perplexity',
  'together': 'togetherx',
  'groq': 'groq',
  
  // Fallback
  'default': 'openai',
};

// Model ID prefix to provider mapping
const MODEL_PREFIX_TO_PROVIDER: Record<string, string> = {
  'anthropic/': 'anthropic',
  'google/': 'google',
  'openai/': 'openai',
  'meta-llama/': 'meta',
  'meta/': 'meta',
  'mistralai/': 'mistral',
  'mistral/': 'mistral',
  'amazon/': 'amazon',
  'microsoft/': 'microsoft',
  'nvidia/': 'nvidia',
  'cohere/': 'cohere',
  'deepseek/': 'deepseek',
  'qwen/': 'qwen',
  'perplexity/': 'perplexity',
  'together/': 'together',
  'groq/': 'groq',
  'x-ai/': 'openai', // Grok - use generic
  'nousresearch/': 'openai', // Use generic
  '01-ai/': 'openai', // Yi models - use generic
  'databricks/': 'openai', // Use generic
  'cognitivecomputations/': 'openai', // Use generic
};

/**
 * Get the icon URL for a model based on its model_id
 * @param modelId - The model_id string (e.g., "anthropic/claude-4.5-sonnet")
 * @param color - Optional hex color for the icon (without #)
 * @returns The URL to the provider's icon
 */
export function getModelIconUrl(modelId: string, color?: string): string {
  // Handle special cases
  if (modelId === 'auto' || !modelId) {
    // Cosmo AI / Auto-select - use a sparkles/star icon
    return `${SIMPLE_ICONS_CDN}/openai${color ? `/${color}` : ''}`;
  }

  // Find the provider based on model ID prefix
  const provider = Object.entries(MODEL_PREFIX_TO_PROVIDER).find(
    ([prefix]) => modelId.toLowerCase().startsWith(prefix.toLowerCase())
  )?.[1] || 'default';

  const iconSlug = PROVIDER_ICON_MAP[provider] || PROVIDER_ICON_MAP['default'];
  
  return `${SIMPLE_ICONS_CDN}/${iconSlug}${color ? `/${color}` : ''}`;
}

/**
 * Get provider name from model ID
 * @param modelId - The model_id string
 * @returns The provider name
 */
export function getProviderFromModelId(modelId: string): string {
  if (modelId === 'auto' || !modelId) {
    return 'Spork';
  }

  const provider = Object.entries(MODEL_PREFIX_TO_PROVIDER).find(
    ([prefix]) => modelId.toLowerCase().startsWith(prefix.toLowerCase())
  )?.[1];

  return provider || 'AI';
}

/**
 * Get icon color based on provider for better visual distinction
 * @param modelId - The model_id string
 * @returns Hex color code (without #)
 */
export function getProviderIconColor(modelId: string): string {
  if (modelId === 'auto' || !modelId) {
    return '6366f1'; // Indigo for Cosmo AI
  }

  const provider = Object.entries(MODEL_PREFIX_TO_PROVIDER).find(
    ([prefix]) => modelId.toLowerCase().startsWith(prefix.toLowerCase())
  )?.[1];

  // Provider-specific colors
  const colors: Record<string, string> = {
    'anthropic': 'cc785c', // Anthropic orange/brown
    'google': '4285f4', // Google blue
    'openai': '412991', // OpenAI purple
    'meta': '0668e1', // Meta blue
    'mistral': 'ff7000', // Mistral orange
    'amazon': 'ff9900', // Amazon orange
    'deepseek': '536af5', // DeepSeek blue
    'cohere': '39594d', // Cohere green
    'perplexity': '20808d', // Perplexity teal
    'nvidia': '76b900', // Nvidia green
    'qwen': 'ff6a00', // Alibaba orange
  };

  return colors[provider || ''] || '6b7280'; // Default gray
}
