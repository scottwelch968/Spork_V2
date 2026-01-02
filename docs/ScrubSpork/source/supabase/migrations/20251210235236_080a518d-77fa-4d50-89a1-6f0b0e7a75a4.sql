-- Insert default image fallback model configuration
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'image_fallback_model',
  '{"model_id": "google/gemini-2.5-flash-image", "provider": "Lovable AI", "enabled": true}'::jsonb,
  'Fallback model for image generation when all other tiers fail'
)
ON CONFLICT (setting_key) DO NOTHING;