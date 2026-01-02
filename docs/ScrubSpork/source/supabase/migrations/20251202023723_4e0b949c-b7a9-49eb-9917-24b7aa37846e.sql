-- Create fallback_models table for Lovable AI failover models
CREATE TABLE public.fallback_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  provider VARCHAR NOT NULL DEFAULT 'Lovable AI',
  description TEXT,
  best_for public.model_category NOT NULL DEFAULT 'general',
  best_for_description TEXT,
  context_length INTEGER DEFAULT 128000,
  max_completion_tokens INTEGER DEFAULT 4096,
  input_modalities JSONB DEFAULT '["text"]'::jsonb,
  output_modalities JSONB DEFAULT '["text"]'::jsonb,
  pricing_prompt NUMERIC DEFAULT 0,
  pricing_completion NUMERIC DEFAULT 0,
  default_temperature NUMERIC DEFAULT 0.7,
  default_top_p NUMERIC DEFAULT 0.95,
  default_top_k INTEGER DEFAULT 0,
  default_max_tokens INTEGER DEFAULT 2048,
  default_frequency_penalty NUMERIC DEFAULT 0,
  default_presence_penalty NUMERIC DEFAULT 0,
  supported_parameters JSONB DEFAULT '["temperature", "top_p", "max_tokens"]'::jsonb,
  rate_limit_rpm INTEGER DEFAULT 60,
  rate_limit_tpm INTEGER DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  requires_api_key BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fallback_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage fallback models"
ON public.fallback_models
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active fallback models"
ON public.fallback_models
FOR SELECT
USING (is_active = true);

-- Insert default Lovable AI fallback models
INSERT INTO public.fallback_models (model_id, name, provider, description, best_for, is_active, is_default) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Lovable AI', 'Fast, balanced model for general tasks', 'conversation', true, true),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Lovable AI', 'Top-tier reasoning and complex tasks', 'research', true, false),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Lovable AI', 'Fastest, cheapest option for simple tasks', 'general', true, false),
('google/gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Lovable AI', 'Next-generation Gemini model', 'research', true, false),
('google/gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', 'Lovable AI', 'Image generation model', 'image_generation', true, false),
('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'Lovable AI', 'Next-gen image generation', 'image_generation', true, false),
('openai/gpt-5', 'GPT-5', 'Lovable AI', 'Powerful all-rounder with excellent reasoning', 'conversation', true, false),
('openai/gpt-5-mini', 'GPT-5 Mini', 'Lovable AI', 'Cost-effective with strong performance', 'conversation', true, false),
('openai/gpt-5-nano', 'GPT-5 Nano', 'Lovable AI', 'Speed and cost optimized', 'general', true, false);

-- Delete any Lovable AI models from ai_models table (keep only OpenRouter)
DELETE FROM public.ai_models WHERE provider = 'Lovable AI';