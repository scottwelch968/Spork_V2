-- 1. DELETE all beta models entirely
DELETE FROM ai_models 
WHERE model_id LIKE '%:beta%' 
   OR model_id LIKE '%-beta'
   OR model_id LIKE '%-beta-%';

-- 2. DELETE models with wrong xai/ prefix (correct x-ai/ versions already exist)
DELETE FROM ai_models 
WHERE model_id LIKE 'xai/%';

-- 3. Remove :free suffixes from existing models
UPDATE ai_models 
SET model_id = REPLACE(model_id, ':free', '')
WHERE model_id LIKE '%:free';

-- 4. Deactivate deprecated/non-existent models
UPDATE ai_models 
SET is_active = false 
WHERE model_id IN (
  'google/gemini-pro-vision',
  'anthropic/claude-4.5-haiku',
  'anthropic/claude-3.5-haiku'
);

-- 5. Clean system_settings if they reference invalid models
UPDATE system_settings 
SET setting_value = jsonb_set(
  setting_value,
  '{model_id}',
  to_jsonb(REPLACE(REPLACE(setting_value->>'model_id', ':free', ''), ':beta', ''))
)
WHERE setting_key IN ('fallback_model', 'default_model', 'image_model')
AND (setting_value->>'model_id' LIKE '%:free' OR setting_value->>'model_id' LIKE '%:beta');