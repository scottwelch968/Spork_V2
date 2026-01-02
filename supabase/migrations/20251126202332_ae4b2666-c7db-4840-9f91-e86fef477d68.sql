-- Update system_settings to add include_personal_context to pre_message_config
UPDATE system_settings 
SET setting_value = jsonb_set(
  COALESCE(setting_value, '{}'::jsonb),
  '{include_personal_context}',
  'true'::jsonb
)
WHERE setting_key = 'pre_message_config';