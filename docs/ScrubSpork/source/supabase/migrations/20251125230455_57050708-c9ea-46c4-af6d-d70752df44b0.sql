-- Create system_settings table for global AI configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('default_model', '{"model_id": "google/gemini-2.5-flash", "provider": "Lovable AI"}', 'Default AI model for new chats'),
('fallback_model', '{"enabled": false, "model_id": "openai/gpt-5-mini", "provider": "OpenRouter", "api_key_required": true}', 'Fallback model when primary fails'),
('ai_instructions', '{"enabled": true, "instructions": "You are a helpful AI assistant. Keep answers clear and concise."}', 'Global AI instructions applied to all conversations'),
('pre_message_config', '{"include_persona": true, "include_knowledge_base": false, "include_files": true, "include_images": true, "include_history": true, "max_history_messages": 20}', 'Pre-message processing configuration')
ON CONFLICT (setting_key) DO NOTHING;