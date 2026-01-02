-- ===========================================
-- PHASE 1: Add Image Generation Models
-- ===========================================

INSERT INTO ai_models (model_id, name, provider, description, best_for, best_for_description, is_active, pricing_prompt, pricing_completion, context_length, max_completion_tokens, display_order, input_modalities, output_modalities) VALUES
('openai/dall-e-3', 'DALL-E 3', 'OpenRouter', 'OpenAI''s most advanced image generation model', 'image_generation', 'Best for photorealistic images, complex scenes, and text in images', true, 0.04, 0, 0, 0, 101, '["text"]'::jsonb, '["image"]'::jsonb),
('black-forest-labs/flux-1.1-pro', 'FLUX 1.1 Pro', 'OpenRouter', 'High-quality artistic image generation', 'image_generation', 'Best for artistic/stylized images and creative abstract work', true, 0.04, 0, 0, 0, 102, '["text"]'::jsonb, '["image"]'::jsonb),
('black-forest-labs/flux-schnell', 'FLUX Schnell', 'OpenRouter', 'Fast image generation for quick iterations', 'image_generation', 'Fast generation for rapid prototyping and iterations', true, 0.003, 0, 0, 0, 103, '["text"]'::jsonb, '["image"]'::jsonb),
('stability/stable-diffusion-xl', 'Stable Diffusion XL', 'OpenRouter', 'Open-source high-quality image generation', 'image_generation', 'Versatile open-source model for diverse image styles', true, 0.002, 0, 0, 0, 104, '["text"]'::jsonb, '["image"]'::jsonb),
('google/gemini-2.5-flash-image', 'Gemini Flash Image', 'Lovable AI', 'Fast image generation via Lovable AI gateway', 'image_generation', 'Quick fallback for reliable image generation', true, 0.01, 0, 0, 0, 105, '["text"]'::jsonb, '["image"]'::jsonb)
ON CONFLICT (model_id) DO UPDATE SET
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  input_modalities = EXCLUDED.input_modalities,
  output_modalities = EXCLUDED.output_modalities;

-- ===========================================
-- PHASE 2: Add Video Generation Models (Inactive Placeholders)
-- ===========================================

INSERT INTO ai_models (model_id, name, provider, description, best_for, best_for_description, is_active, pricing_prompt, pricing_completion, display_order, input_modalities, output_modalities) VALUES
('runway/gen-3', 'Runway Gen-3', 'Runway', 'High-quality AI video generation', 'video_generation', 'Best for cinematic video generation', false, 0.50, 0, 201, '["text", "image"]'::jsonb, '["video"]'::jsonb),
('luma/ray-2', 'Luma Ray 2', 'Luma', 'AI video generation with physics understanding', 'video_generation', 'Best for realistic motion and physics', false, 0.40, 0, 202, '["text", "image"]'::jsonb, '["video"]'::jsonb),
('kling/kling-1', 'Kling 1.0', 'Kling', 'High-quality video generation', 'video_generation', 'Best for diverse video styles', false, 0.35, 0, 203, '["text", "image"]'::jsonb, '["video"]'::jsonb)
ON CONFLICT (model_id) DO UPDATE SET
  best_for = EXCLUDED.best_for,
  best_for_description = EXCLUDED.best_for_description,
  display_order = EXCLUDED.display_order;

-- ===========================================
-- PHASE 3: Recategorize Text Models
-- ===========================================

-- Coding specialists (high SWE-bench scores)
UPDATE ai_models SET best_for = 'coding', best_for_description = 'Optimized for software engineering with 54.6% SWE-bench score' WHERE model_id = 'openai/gpt-4.1';
UPDATE ai_models SET best_for = 'coding', best_for_description = 'State-of-the-art coding with 72.7% SWE-bench score' WHERE model_id = 'anthropic/claude-sonnet-4';
UPDATE ai_models SET best_for = 'coding', best_for_description = 'Strong coding and agentic task performance' WHERE model_id = 'anthropic/claude-3.5-sonnet';
UPDATE ai_models SET best_for = 'coding', best_for_description = 'Excellent code generation and debugging' WHERE model_id = 'deepseek/deepseek-chat-v3-0324';

-- Deep think (complex reasoning, thinking models)
UPDATE ai_models SET best_for = 'deep_think', best_for_description = 'Advanced reasoning with thinking capabilities, #1 on LMArena' WHERE model_id = 'google/gemini-2.5-pro';
UPDATE ai_models SET best_for = 'deep_think', best_for_description = 'Most powerful model for highly complex reasoning tasks' WHERE model_id = 'anthropic/claude-3-opus';

-- Research (RAG, knowledge retrieval, balanced reasoning)
UPDATE ai_models SET best_for = 'research', best_for_description = 'Balanced reasoning and speed for research tasks' WHERE model_id = 'google/gemini-2.5-flash';
UPDATE ai_models SET best_for = 'research', best_for_description = 'Optimized for RAG and enterprise knowledge retrieval' WHERE model_id = 'cohere/command-r-plus-08-2024';

-- Analysis (data extraction, domain expertise)
UPDATE ai_models SET best_for = 'analysis', best_for_description = 'Long context understanding and data extraction' WHERE model_id = 'mistralai/mistral-large-2411';
UPDATE ai_models SET best_for = 'analysis', best_for_description = 'Deep domain expertise in finance, healthcare, law, and science' WHERE model_id = 'x-ai/grok-3';

-- Conversation (general purpose, fast chat, multimodal)
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Fast multimodal general purpose assistant' WHERE model_id = 'openai/gpt-4-turbo';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Largest open-source model for high quality dialogue' WHERE model_id = 'meta-llama/llama-3.1-405b-instruct';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Fast, cost-effective multimodal chat' WHERE model_id = 'openai/gpt-4o';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Most cost-effective with strong capabilities' WHERE model_id = 'openai/gpt-4o-mini';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'High quality open-source dialogue' WHERE model_id = 'meta-llama/llama-3.1-70b-instruct';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Fast and compact for near-instant responses' WHERE model_id = 'anthropic/claude-3-haiku';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Efficient mixture-of-experts for chat' WHERE model_id = 'mistralai/mixtral-8x7b-instruct';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Optimized for high quality dialogue' WHERE model_id = 'meta-llama/llama-3-70b-instruct';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Fast multimodal with agentic capabilities' WHERE model_id = 'google/gemini-2.0-flash-001';
UPDATE ai_models SET best_for = 'conversation', best_for_description = 'Efficient and fast for everyday tasks' WHERE model_id = 'mistralai/mistral-7b-instruct';