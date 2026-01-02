-- Delete duplicate :free models (keep base models)
DELETE FROM ai_models 
WHERE model_id LIKE '%:free';

-- Strip :free suffix from system_settings JSONB values
UPDATE system_settings 
SET setting_value = jsonb_set(
  setting_value, 
  '{model_id}', 
  to_jsonb(REPLACE(setting_value->>'model_id', ':free', ''))
)
WHERE setting_value->>'model_id' LIKE '%:free';