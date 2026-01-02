-- Add OpenRouter top-tier models to ai_models table
-- Models will be inserted with is_active=false by default for admin review

-- Anthropic Claude Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('anthropic/claude-3.7-sonnet', 'Claude 3.7 Sonnet', 'OpenRouter', 'Top performer for programming with advanced reasoning', 'coding', 'Best-in-class for complex programming tasks', 200000, 8192, '["text", "image"]', '["text"]', 3.00, 15.00, false, true, 100),
('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'OpenRouter', 'High-performance model for coding and analysis', 'coding', 'Excellent for software development', 200000, 8192, '["text", "image"]', '["text"]', 3.00, 15.00, false, true, 101),
('anthropic/claude-3.5-haiku', 'Claude 3.5 Haiku', 'OpenRouter', 'Fast and efficient Claude model', 'conversation', 'Quick responses with good quality', 200000, 8192, '["text", "image"]', '["text"]', 1.00, 5.00, false, true, 102),
('anthropic/claude-3-opus', 'Claude 3 Opus', 'OpenRouter', 'Most capable Claude model for complex tasks', 'research', 'Deep analysis and reasoning', 200000, 4096, '["text", "image"]', '["text"]', 15.00, 75.00, false, true, 103),
('anthropic/claude-3-haiku', 'Claude 3 Haiku', 'OpenRouter', 'Fast and cost-effective Claude model', 'conversation', 'Quick everyday tasks', 200000, 4096, '["text", "image"]', '["text"]', 0.25, 1.25, false, true, 104)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- OpenAI GPT Series  
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('openai/gpt-4o', 'GPT-4o', 'OpenRouter', 'OpenAI flagship model with 128K context', 'general', 'Versatile for all tasks', 128000, 16384, '["text", "image"]', '["text"]', 2.50, 10.00, false, true, 110),
('openai/gpt-4o-mini', 'GPT-4o Mini', 'OpenRouter', 'Cost-effective GPT-4 level model', 'conversation', 'Efficient everyday tasks', 128000, 16384, '["text", "image"]', '["text"]', 0.15, 0.60, false, true, 111),
('openai/gpt-oss-120b', 'GPT-OSS 120B', 'OpenRouter', 'OpenAI first open-weight model', 'general', 'Open source alternative', 128000, 8192, '["text"]', '["text"]', 1.00, 3.00, false, true, 112)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Google Gemini Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('google/gemini-2.5-pro', 'Gemini 2.5 Pro', 'OpenRouter', 'Multi-modal model with 1M token context', 'research', 'Large context window for deep analysis', 1000000, 8192, '["text", "image", "audio", "video"]', '["text"]', 1.25, 5.00, false, true, 120),
('google/gemini-2.5-flash', 'Gemini 2.5 Flash', 'OpenRouter', 'Lightweight model with 1M context', 'conversation', 'Fast responses with large context', 1000000, 8192, '["text", "image", "audio", "video"]', '["text"]', 0.075, 0.30, false, true, 121)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- xAI Grok Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('xai/grok-4.1-fast', 'Grok 4.1 Fast', 'OpenRouter', 'Fast xAI model with real-time data', 'conversation', 'Quick responses with current information', 128000, 8192, '["text"]', '["text"]', 2.00, 8.00, false, true, 130),
('xai/grok-4', 'Grok 4', 'OpenRouter', 'Advanced reasoning with real-time data', 'research', 'Deep analysis with current information', 128000, 8192, '["text"]', '["text"]', 5.00, 20.00, false, true, 131)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Amazon Nova Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('amazon/nova-premier-v1', 'Amazon Nova Premier v1', 'OpenRouter', 'Top-tier Amazon Nova model', 'general', 'High-performance multi-modal', 128000, 8192, '["text", "image"]', '["text"]', 3.00, 12.00, false, true, 140),
('amazon/nova-pro-v1', 'Amazon Nova Pro v1', 'OpenRouter', 'Balanced Amazon Nova model', 'conversation', 'Versatile for most tasks', 128000, 8192, '["text", "image"]', '["text"]', 1.50, 6.00, false, true, 141),
('amazon/nova-lite-v1', 'Amazon Nova Lite v1', 'OpenRouter', 'Lightweight Amazon Nova model', 'conversation', 'Fast and cost-effective', 128000, 8192, '["text"]', '["text"]', 0.50, 2.00, false, true, 142),
('amazon/nova-micro-1.0', 'Nova Micro 1.0', 'OpenRouter', 'Smallest ultra-fast model with 128K context', 'conversation', 'Ultra-fast responses', 128000, 8192, '["text"]', '["text"]', 0.10, 0.40, false, true, 143)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Mistral AI Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('mistralai/mistral-large-2411', 'Mistral Large 2411', 'OpenRouter', '123B model with 128K context', 'general', 'Large context for complex tasks', 128000, 8192, '["text"]', '["text"]', 2.00, 6.00, false, true, 150),
('mistralai/mistral-medium-3.1', 'Mistral Medium 3.1', 'OpenRouter', 'Balanced Mistral model', 'conversation', 'Good quality at reasonable cost', 128000, 8192, '["text"]', '["text"]', 0.70, 2.10, false, true, 151),
('mistralai/mistral-nemo', 'Mistral Nemo', 'OpenRouter', 'Compact efficient Mistral model', 'conversation', 'Fast everyday tasks', 128000, 8192, '["text"]', '["text"]', 0.30, 0.90, false, true, 152),
('mistralai/mixtral-8x22b-instruct', 'Mixtral 8x22B Instruct', 'OpenRouter', 'Mixture of experts model', 'general', 'High performance sparse model', 64000, 8192, '["text"]', '["text"]', 0.65, 0.65, false, true, 153),
('mistralai/codestral-2508', 'Codestral 2508', 'OpenRouter', 'Code-specialized Mistral model', 'coding', 'Optimized for programming', 128000, 8192, '["text"]', '["text"]', 0.30, 0.90, false, true, 154),
('mistralai/devstral-medium', 'Devstral Medium', 'OpenRouter', 'Development-focused model', 'coding', 'Software development tasks', 128000, 8192, '["text"]', '["text"]', 0.50, 1.50, false, true, 155)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- DeepSeek Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('deepseek/deepseek-v3-base', 'DeepSeek V3 Base', 'OpenRouter', 'Latest DeepSeek foundation model', 'general', 'Versatile base model', 128000, 8192, '["text"]', '["text"]', 0.27, 1.10, false, true, 160),
('aionlabs/aion-1.0', 'Aion 1.0', 'OpenRouter', '131K token MoE model', 'general', 'Large context mixture of experts', 131000, 8192, '["text"]', '["text"]', 1.50, 4.50, false, true, 161),
('aionlabs/aion-1.0-mini', 'Aion 1.0 Mini', 'OpenRouter', '32B efficient model', 'conversation', 'Compact high-performance', 131000, 8192, '["text"]', '["text"]', 0.50, 1.50, false, true, 162)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Meta Llama Series
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('meta-llama/llama-4-maverick', 'Llama 4 Maverick', 'OpenRouter', 'Latest Llama model', 'general', 'Open source flagship', 128000, 8192, '["text"]', '["text"]', 0.18, 0.18, false, true, 170),
('meta-llama/llama-3.1-405b-instruct', 'Llama 3.1 405B Instruct', 'OpenRouter', 'Largest Llama 3.1 model', 'research', 'Maximum capability open model', 128000, 8192, '["text"]', '["text"]', 0.30, 0.30, false, true, 171),
('meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B Instruct', 'OpenRouter', 'Balanced Llama 3.1 model', 'general', 'Good quality open model', 128000, 8192, '["text"]', '["text"]', 0.18, 0.18, false, true, 172),
('meta-llama/llama-3.1-8b-instruct', 'Llama 3.1 8B Instruct', 'OpenRouter', 'Compact Llama 3.1 model', 'conversation', 'Fast open model', 128000, 8192, '["text"]', '["text"]', 0.06, 0.06, false, true, 173)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Other Notable Models
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, requires_api_key, display_order
) VALUES
('mercury/mercury', 'Mercury', 'OpenRouter', 'Diffusion-based LLM up to 10x faster', 'conversation', 'Ultra-fast responses', 128000, 8192, '["text"]', '["text"]', 0.20, 0.60, false, true, 180),
('ai21/jamba-large', 'Jamba Large', 'OpenRouter', 'AI21 hybrid SSM-Transformer model', 'general', 'Long context efficiency', 256000, 8192, '["text"]', '["text"]', 2.00, 8.00, false, true, 181),
('ai21/jamba-mini', 'Jamba Mini', 'OpenRouter', 'Compact AI21 model', 'conversation', 'Fast hybrid architecture', 256000, 8192, '["text"]', '["text"]', 0.20, 0.40, false, true, 182),
('alibaba/tongyi-deepresearch', 'Tongyi DeepResearch', 'OpenRouter', 'Alibaba research-focused model', 'research', 'Deep analysis capabilities', 128000, 8192, '["text"]', '["text"]', 1.00, 3.00, false, true, 183),
('anthracite/magnum-v2-72b', 'Anthracite Magnum v2', 'OpenRouter', 'Enhanced roleplay model', 'conversation', 'Creative conversations', 128000, 8192, '["text"]', '["text"]', 0.40, 0.40, false, true, 184),
('anthracite/magnum-v4-72b', 'Anthracite Magnum v4', 'OpenRouter', 'Latest Anthracite model', 'conversation', 'Advanced roleplay', 128000, 8192, '["text"]', '["text"]', 0.40, 0.40, false, true, 185),
('nvidia/nemotron-nano-2-vl', 'NVIDIA Nemotron Nano 2 VL', 'OpenRouter', 'Vision-language model', 'image_understanding', 'Image and text analysis', 128000, 8192, '["text", "image"]', '["text"]', 0.30, 0.90, false, true, 186)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  updated_at = now();

-- Free Models
INSERT INTO ai_models (
  model_id, name, provider, description, best_for, best_for_description,
  context_length, max_completion_tokens, input_modalities, output_modalities,
  pricing_prompt, pricing_completion, is_active, is_free, requires_api_key, display_order
) VALUES
('apidog/optimus-alpha', 'Optimus Alpha', 'OpenRouter', 'Free model by Apidog', 'conversation', 'No-cost option', 32000, 4096, '["text"]', '["text"]', 0.00, 0.00, false, true, true, 190),
('apidog/quasar-alpha', 'Quasar Alpha', 'OpenRouter', 'Free model by Apidog', 'conversation', 'No-cost alternative', 32000, 4096, '["text"]', '["text"]', 0.00, 0.00, false, true, true, 191)
ON CONFLICT (model_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  context_length = EXCLUDED.context_length,
  max_completion_tokens = EXCLUDED.max_completion_tokens,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities,
  pricing_prompt = EXCLUDED.pricing_prompt,
  pricing_completion = EXCLUDED.pricing_completion,
  is_free = EXCLUDED.is_free,
  updated_at = now();