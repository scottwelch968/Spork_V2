-- Phase 2: Add skip_temperature column to ai_models and fallback_models tables
-- This enables database-driven model parameter control per COSMO Constitution Article VI

-- Add column to ai_models
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS skip_temperature boolean DEFAULT false;

COMMENT ON COLUMN ai_models.skip_temperature IS 
'When true, temperature parameter should not be sent to this model (e.g., OpenAI reasoning models)';

-- Add column to fallback_models for consistency
ALTER TABLE fallback_models 
ADD COLUMN IF NOT EXISTS skip_temperature boolean DEFAULT false;

COMMENT ON COLUMN fallback_models.skip_temperature IS 
'When true, temperature parameter should not be sent to this model (e.g., OpenAI reasoning models)';

-- Update OpenAI reasoning models to skip temperature
UPDATE ai_models 
SET skip_temperature = true 
WHERE model_id LIKE 'openai/gpt-5%' 
   OR model_id LIKE 'openai/gpt-4.1%' 
   OR model_id LIKE 'openai/o%';

UPDATE fallback_models 
SET skip_temperature = true 
WHERE model_id LIKE 'openai/gpt-5%' 
   OR model_id LIKE 'openai/gpt-4.1%' 
   OR model_id LIKE 'openai/o%';