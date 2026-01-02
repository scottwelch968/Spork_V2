-- Phase 2: Create cosmo_action_mappings table for intent-to-action routing

CREATE TABLE public.cosmo_action_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT NOT NULL,
  action_key TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('function', 'chain', 'model_call', 'external_api', 'system')),
  action_config JSONB DEFAULT '{}',
  parameter_patterns JSONB DEFAULT '{}',
  required_context TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 50,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups by intent
CREATE INDEX idx_cosmo_action_mappings_intent ON public.cosmo_action_mappings(intent_key);
CREATE INDEX idx_cosmo_action_mappings_active ON public.cosmo_action_mappings(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.cosmo_action_mappings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active mappings
CREATE POLICY "Authenticated users can read action mappings"
ON public.cosmo_action_mappings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE TRIGGER update_cosmo_action_mappings_updated_at
BEFORE UPDATE ON public.cosmo_action_mappings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed initial action mappings for existing intents
INSERT INTO public.cosmo_action_mappings (intent_key, action_key, action_type, action_config, priority) VALUES
-- Coding intent mappings
('coding', 'model_call', 'model_call', '{"prefer_models": ["coding"], "temperature": 0.3}', 100),
('coding', 'code_formatting', 'function', '{"function_key": "format_code"}', 50),

-- Writing intent mappings  
('writing', 'model_call', 'model_call', '{"prefer_models": ["writing"], "temperature": 0.7}', 100),

-- Analysis intent mappings
('analysis', 'model_call', 'model_call', '{"prefer_models": ["analysis"], "temperature": 0.5}', 100),

-- Creative intent mappings
('creative', 'model_call', 'model_call', '{"prefer_models": ["creative"], "temperature": 0.9}', 100),

-- Math intent mappings
('math', 'model_call', 'model_call', '{"prefer_models": ["math", "reasoning"], "temperature": 0.2}', 100),

-- Research intent mappings
('research', 'web_search', 'function', '{"function_key": "web_search"}', 80),
('research', 'model_call', 'model_call', '{"prefer_models": ["research"], "temperature": 0.5}', 100),

-- Image generation intent mappings
('image_generation', 'generate_image', 'function', '{"function_key": "generate_image"}', 100),

-- General intent mapping
('general', 'model_call', 'model_call', '{"prefer_models": ["general"], "temperature": 0.7}', 100);