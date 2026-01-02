-- Create space_templates table for admin-managed workspace templates
CREATE TABLE public.space_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ai_model VARCHAR,
  ai_instructions TEXT,
  compliance_rule TEXT,
  color_code VARCHAR,
  file_quota_mb INTEGER,
  default_personas JSONB DEFAULT '[]'::jsonb,
  default_prompts JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.space_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage all templates
CREATE POLICY "Admins can manage space templates"
ON public.space_templates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view active templates
CREATE POLICY "Users can view active space templates"
ON public.space_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_space_templates_updated_at
  BEFORE UPDATE ON public.space_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();