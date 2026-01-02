// Re-export ModelCategory from canonical contracts
export type { ModelCategory } from '@/cosmo/contracts';
import type { ModelCategory } from '@/cosmo/contracts';

export interface FallbackModel {
  id: string;
  model_id: string;
  name: string;
  provider: string;
  description: string | null;
  
  // Categorization
  best_for: ModelCategory;
  best_for_description: string | null;
  
  // Capabilities
  context_length: number;
  max_completion_tokens: number;
  input_modalities: any;
  output_modalities: any;
  
  // Pricing
  pricing_prompt: number;
  pricing_completion: number;
  
  // Parameters
  default_temperature: number;
  default_top_p: number;
  default_top_k: number;
  default_max_tokens: number;
  default_frequency_penalty: number;
  default_presence_penalty: number;
  supported_parameters: any;
  
  // Rate Limits
  rate_limit_rpm: number;
  rate_limit_tpm: number;
  
  // Configuration
  is_active: boolean;
  is_default: boolean;
  is_free: boolean;
  requires_api_key: boolean;
  display_order: number;
  icon_url: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface CreateFallbackModelInput extends Omit<FallbackModel, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateFallbackModelInput extends Partial<Omit<FallbackModel, 'id' | 'created_at' | 'updated_at'>> {}
