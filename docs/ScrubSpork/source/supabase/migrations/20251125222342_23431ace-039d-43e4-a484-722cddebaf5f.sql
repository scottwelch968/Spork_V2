-- Create model category enum
CREATE TYPE model_category AS ENUM (
  'conversation',
  'coding', 
  'research',
  'writing',
  'image_generation',
  'image_understanding',
  'video_understanding',
  'general'
);

-- Create ai_models table
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Categorization
  best_for model_category NOT NULL DEFAULT 'general',
  best_for_description TEXT,
  
  -- Capabilities
  context_length INTEGER DEFAULT 128000,
  max_completion_tokens INTEGER DEFAULT 4096,
  input_modalities JSONB DEFAULT '["text"]',
  output_modalities JSONB DEFAULT '["text"]',
  
  -- Pricing (per million tokens)
  pricing_prompt DECIMAL(10, 6) DEFAULT 0,
  pricing_completion DECIMAL(10, 6) DEFAULT 0,
  
  -- Model Parameters
  default_temperature DECIMAL(3, 2) DEFAULT 0.7,
  default_top_p DECIMAL(3, 2) DEFAULT 0.95,
  default_top_k INTEGER DEFAULT 0,
  default_max_tokens INTEGER DEFAULT 2048,
  default_frequency_penalty DECIMAL(3, 2) DEFAULT 0,
  default_presence_penalty DECIMAL(3, 2) DEFAULT 0,
  supported_parameters JSONB DEFAULT '["temperature", "top_p", "max_tokens"]',
  
  -- Rate Limits
  rate_limit_rpm INTEGER DEFAULT 60,
  rate_limit_tpm INTEGER DEFAULT 100000,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  requires_api_key BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_category ON ai_models(best_for);
CREATE INDEX idx_ai_models_provider ON ai_models(provider);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage models" 
ON ai_models 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active models" 
ON ai_models 
FOR SELECT 
USING (is_active = true);

-- Seed Lovable AI models
INSERT INTO ai_models (model_id, name, provider, description, best_for, best_for_description, context_length, max_completion_tokens, pricing_prompt, pricing_completion, default_temperature, default_max_tokens, is_active, is_default, display_order) VALUES
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'Lovable AI', 'Fast, efficient workhorse for everyday chat tasks', 'conversation', 'Balanced choice: less cost & latency than Pro, still good on multimodal + reasoning', 1000000, 8192, 0, 0, 0.7, 2048, true, true, 1),
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'Lovable AI', 'Top-tier model with superior reasoning and multimodal capabilities', 'research', 'Strongest at handling image-text + big context + complex reasoning', 2000000, 8192, 0, 0, 0.7, 2048, true, false, 2),
('google/gemini-3-pro-preview', 'Gemini 3 Pro Preview', 'Lovable AI', 'Next-generation model with state-of-the-art capabilities', 'research', 'Next-generation with enhanced reasoning and 1M+ context', 1000000, 8192, 0, 0, 0.7, 2048, true, false, 3),
('google/gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite', 'Lovable AI', 'Ultra-low latency model for simple tasks', 'conversation', 'Fastest + cheapest. Good for classification, summarization, simple workloads', 1000000, 8192, 0, 0, 0.7, 2048, true, false, 4),
('google/gemini-2.5-flash-image', 'Gemini Flash Image', 'Lovable AI', 'State-of-the-art image generation from text prompts', 'image_generation', 'High-quality image generation with natural language prompts', 128000, 4096, 0, 0, 0.7, 1024, true, false, 5),
('google/gemini-3-pro-image-preview', 'Gemini 3 Pro Image Preview', 'Lovable AI', 'Next-generation image generation model', 'image_generation', 'Latest image generation with improved quality and control', 128000, 4096, 0, 0, 0.7, 1024, true, false, 6),
('openai/gpt-5', 'GPT-5', 'Lovable AI', 'Powerful all-rounder with excellent reasoning', 'general', 'Excellent reasoning, long context, multimodal. Best when accuracy matters', 200000, 16384, 0, 0, 0.7, 2048, true, false, 7),
('openai/gpt-5-mini', 'GPT-5 Mini', 'Lovable AI', 'Balanced performance and cost', 'conversation', 'Lower cost & latency than standard but keeps most reasoning strengths', 200000, 16384, 0, 0, 0.7, 2048, true, false, 8),
('openai/gpt-5-nano', 'GPT-5 Nano', 'Lovable AI', 'Fastest and most cost-effective option', 'conversation', 'Designed for speed & cost saving. Very efficient for high-volume tasks', 200000, 16384, 0, 0, 0.7, 2048, true, false, 9);

-- Seed top OpenRouter models
INSERT INTO ai_models (model_id, name, provider, description, best_for, best_for_description, context_length, max_completion_tokens, pricing_prompt, pricing_completion, default_temperature, default_max_tokens, is_active, requires_api_key, display_order) VALUES
('anthropic/claude-4.5-sonnet', 'Claude 4.5 Sonnet', 'OpenRouter', '11.3% market share, excellent for refactoring', 'coding', 'Top-tier coding model with excellent refactoring capabilities', 200000, 8192, 3.0, 15.0, 0.7, 4096, false, true, 20),
('anthropic/claude-4.5-haiku', 'Claude 4.5 Haiku', 'OpenRouter', 'Fast and cost-effective conversation model', 'conversation', 'Fastest Claude model with excellent cost/performance', 200000, 8192, 1.0, 5.0, 0.7, 4096, false, true, 21),
('anthropic/claude-opus-4.1', 'Claude Opus 4.1', 'OpenRouter', 'Most capable Claude for complex research tasks', 'research', 'Complex tasks, deep thinking, advanced reasoning', 200000, 8192, 15.0, 75.0, 0.7, 4096, false, true, 22),
('x-ai/grok-code-fast-1', 'Grok Code Fast 1', 'OpenRouter', '#1 coding model with 51.2% market share', 'coding', 'Leading coding model for development tasks', 131072, 32768, 5.0, 15.0, 0.7, 4096, false, true, 23),
('deepseek/deepseek-r1', 'DeepSeek R1', 'OpenRouter', 'Advanced reasoning with visible thought chains', 'research', 'Advanced reasoning chains for complex problem solving', 64000, 8192, 0.55, 2.19, 0.7, 4096, false, true, 24),
('deepseek/deepseek-chat-v3.1', 'DeepSeek Chat V3.1', 'OpenRouter', 'FREE strong general chat model', 'conversation', 'Cost-effective conversation model with strong capabilities', 64000, 8192, 0.27, 1.1, 0.7, 4096, false, true, 25),
('mistral/mistral-large-2411', 'Mistral Large 2411', 'OpenRouter', 'Multilingual powerhouse, 123B parameters', 'writing', 'Excellent for multilingual content and creative writing', 128000, 4096, 2.0, 6.0, 0.7, 2048, false, true, 26),
('meta-llama/llama-4-maverick', 'Llama 4 Maverick', 'OpenRouter', 'FREE 400B MoE coding specialist', 'coding', 'Large-scale coding model with strong performance', 128000, 4096, 0, 0, 0.7, 4096, false, true, 27),
('cohere/command-r-plus', 'Command R+', 'OpenRouter', 'Enterprise RAG and retrieval specialist', 'research', 'Optimized for retrieval-augmented generation', 128000, 4096, 2.5, 10.0, 0.7, 4096, false, true, 28),
('qwen/qwen3-coder-30b', 'Qwen3 Coder 30B', 'OpenRouter', 'Specialized code generation model', 'coding', 'Focused on code generation and completion', 32768, 8192, 0.2, 0.6, 0.7, 4096, false, true, 29);