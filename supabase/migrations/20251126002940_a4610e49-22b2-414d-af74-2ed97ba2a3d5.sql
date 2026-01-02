-- Update pricing for Lovable AI models (prices per million tokens)

-- Google Gemini models
UPDATE ai_models 
SET 
  pricing_prompt = 1.25,
  pricing_completion = 5.00
WHERE model_id = 'google/gemini-2.5-pro' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 1.50,
  pricing_completion = 6.00
WHERE model_id = 'google/gemini-3-pro-preview' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 0.075,
  pricing_completion = 0.30
WHERE model_id = 'google/gemini-2.5-flash' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 0.02,
  pricing_completion = 0.08
WHERE model_id = 'google/gemini-2.5-flash-lite' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 0.04,
  pricing_completion = 0.04
WHERE model_id = 'google/gemini-2.5-flash-image' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 0.05,
  pricing_completion = 0.05
WHERE model_id = 'google/gemini-3-pro-image-preview' AND provider = 'Lovable AI';

-- OpenAI models
UPDATE ai_models 
SET 
  pricing_prompt = 10.00,
  pricing_completion = 30.00
WHERE model_id = 'openai/gpt-5' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 1.00,
  pricing_completion = 4.00
WHERE model_id = 'openai/gpt-5-mini' AND provider = 'Lovable AI';

UPDATE ai_models 
SET 
  pricing_prompt = 0.15,
  pricing_completion = 0.60
WHERE model_id = 'openai/gpt-5-nano' AND provider = 'Lovable AI';