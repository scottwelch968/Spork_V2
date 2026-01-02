-- Add free OpenRouter models
INSERT INTO public.ai_models (
  model_id, name, provider, description, best_for,
  context_length, max_completion_tokens,
  input_modalities, output_modalities,
  pricing_prompt, pricing_completion,
  is_active, is_free, requires_api_key, display_order
) VALUES
-- DeepSeek Series
('deepseek/deepseek-r1:free', 'DeepSeek R1 (Free)', 'OpenRouter', '671B params, 37B active, MIT licensed, performance on par with OpenAI o1', 'research', 163840, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-r1-0528:free', 'DeepSeek R1 0528 (Free)', 'OpenRouter', 'Updated version of R1 released May 2025', 'research', 163840, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-r1-distill-llama-70b:free', 'R1 Distill Llama 70B (Free)', 'OpenRouter', 'Distilled from Llama-3.3-70B, AIME 70.0, MATH-500 94.5', 'research', 8192, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-r1-distill-qwen-14b:free', 'R1 Distill Qwen 14B (Free)', 'OpenRouter', 'Distilled from Qwen 2.5 14B, outperforms o1-mini', 'research', 131072, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-r1-distill-qwen-32b:free', 'R1 Distill Qwen 32B (Free)', 'OpenRouter', 'Larger Qwen distillation, SOTA for dense models', 'research', 131072, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-chat-v3-0324:free', 'DeepSeek V3 0324 (Free)', 'OpenRouter', '685B MoE model, excellent for coding', 'coding', 163840, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('deepseek/deepseek-v3.1-base:free', 'DeepSeek V3.1 Base (Free)', 'OpenRouter', 'Latest V3.1 iteration', 'general', 163840, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- Google Gemini Series
('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash Exp (Free)', 'OpenRouter', 'Faster TTFT, enhanced multimodal and coding capabilities', 'conversation', 1048576, 8192, '["text", "image"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),
('google/gemini-2.5-flash-image-preview:free', 'Gemini 2.5 Flash Image (Free)', 'OpenRouter', 'Image generation capabilities with Gemini 2.5 Flash', 'image_generation', 1048576, 4096, '["text"]'::jsonb, '["text", "image"]'::jsonb, 0, 0, false, true, true, 999),

-- Meta Llama Series
('meta-llama/llama-4-maverick:free', 'Llama 4 Maverick (Free)', 'OpenRouter', '400B total, 17B active MoE with 256K context', 'general', 256000, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- Mistral AI Series
('mistralai/mistral-small-3.1-24b-instruct:free', 'Mistral Small 3.1 24B (Free)', 'OpenRouter', '24B params, multimodal, excels at vision tasks', 'general', 96000, 4096, '["text", "image"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- NVIDIA Series
('nvidia/llama-3.1-nemotron-nano-8b-v1:free', 'Llama 3.1 Nemotron Nano 8B (Free)', 'OpenRouter', 'Optimized for reasoning, RAG, and tool-calling', 'coding', 131072, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- MoonshotAI Series
('moonshotai/kimi-vl-a3b-thinking:free', 'Kimi VL A3B Thinking (Free)', 'OpenRouter', '16B total, 2.8B active MoE, multimodal vision-language model', 'image_understanding', 131072, 4096, '["text", "image"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- Agentica Series
('agentica-org/deepcoder-14b-preview:free', 'DeepCoder 14B Preview (Free)', 'OpenRouter', 'Code reasoning specialist, 60.6% on LiveCodeBench v5', 'coding', 96000, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999),

-- Venice AI Series
('venice-ai/venice-uncensored', 'Venice Uncensored', 'OpenRouter', 'From creator of Dolphin model, uncensored responses', 'general', 128000, 4096, '["text"]'::jsonb, '["text"]'::jsonb, 0, 0, false, true, true, 999)

ON CONFLICT (model_id) DO NOTHING;