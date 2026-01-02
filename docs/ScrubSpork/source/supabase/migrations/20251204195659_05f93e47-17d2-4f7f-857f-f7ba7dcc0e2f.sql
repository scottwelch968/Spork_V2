-- Create cosmo_debug_logs table for comprehensive debug tracking
CREATE TABLE public.cosmo_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Session info
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  chat_id UUID,
  workspace_id UUID,
  
  -- Original input
  original_message TEXT NOT NULL,
  
  -- Cosmo decision making
  detected_intent TEXT,
  intent_patterns TEXT[],
  requested_model TEXT,
  auto_select_enabled BOOLEAN DEFAULT false,
  
  -- Context sources
  context_sources JSONB DEFAULT '{}',
  
  -- Prompts
  system_prompt_preview TEXT,
  full_system_prompt TEXT,
  persona_prompt TEXT,
  ai_instructions TEXT,
  
  -- Model selection
  selected_model TEXT,
  model_provider TEXT,
  model_config JSONB DEFAULT '{}',
  
  -- Fallback chain
  tiers_attempted JSONB DEFAULT '[]',
  fallback_used BOOLEAN DEFAULT false,
  
  -- Response metrics
  response_time_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost DECIMAL(10, 6),
  
  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.cosmo_debug_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admins can view debug logs" ON public.cosmo_debug_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert debug logs" ON public.cosmo_debug_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete debug logs" ON public.cosmo_debug_logs
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Index for efficient querying
CREATE INDEX idx_cosmo_debug_logs_created_at ON public.cosmo_debug_logs(created_at DESC);
CREATE INDEX idx_cosmo_debug_logs_user_id ON public.cosmo_debug_logs(user_id);

-- Add debug toggle to system_settings
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('cosmo_debug_enabled', '{"enabled": false}'::jsonb, 'Enable/disable Cosmo debug logging')
ON CONFLICT (setting_key) DO NOTHING;