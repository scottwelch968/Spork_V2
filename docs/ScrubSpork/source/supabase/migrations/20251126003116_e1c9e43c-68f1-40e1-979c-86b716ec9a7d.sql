-- Insert default system settings for specialized models
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES 
  ('image_model', '{"model_id": "google/gemini-2.5-flash-image", "provider": "Lovable AI"}'::jsonb, 'Model used for image generation'),
  ('knowledge_base_model', '{"model_id": "google/gemini-2.5-flash", "provider": "Lovable AI"}'::jsonb, 'Model used for knowledge base queries')
ON CONFLICT (setting_key) DO NOTHING;