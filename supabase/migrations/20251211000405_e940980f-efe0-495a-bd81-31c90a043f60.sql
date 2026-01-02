-- Add default image generation cost setting
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'image_generation_cost',
  '{"cost_usd": 0.04, "currency": "USD"}'::jsonb,
  'Default cost per image generation for billing purposes'
)
ON CONFLICT (setting_key) DO NOTHING;