-- Create persona_templates table
CREATE TABLE persona_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon VARCHAR,
  category VARCHAR DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_default_for_users BOOLEAN DEFAULT false,
  is_default_for_spaces BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE persona_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage persona templates" 
ON persona_templates FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active templates" 
ON persona_templates FOR SELECT 
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER handle_persona_templates_updated_at 
  BEFORE UPDATE ON persona_templates 
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Seed General Assistant as default
INSERT INTO persona_templates (name, description, system_prompt, icon, is_active, is_featured, is_default_for_users, is_default_for_spaces)
VALUES (
  'General Assistant',
  'Helpful AI assistant for everyday tasks',
  'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.',
  NULL,
  true,
  true,
  true,
  true
);

-- Seed additional featured persona templates
INSERT INTO persona_templates (name, description, system_prompt, icon, category, is_active, is_featured) VALUES
(
  'Code Assistant',
  'Expert programmer for software development and debugging',
  'You are an expert programmer with deep knowledge of multiple programming languages, frameworks, and best practices. Help users write clean, efficient, and well-documented code. Provide debugging assistance, code reviews, and architectural guidance.',
  '💻',
  'coding',
  true,
  true
),
(
  'Writing Assistant',
  'Professional writer for content creation and editing',
  'You are a professional writer skilled in various writing styles and formats. Help users create compelling content, improve their writing, check grammar and style, and adapt tone for different audiences. Focus on clarity, engagement, and proper structure.',
  '✍️',
  'writing',
  true,
  true
),
(
  'Research Assistant',
  'Academic researcher for analysis and information gathering',
  'You are an academic researcher with expertise in critical analysis, information synthesis, and scholarly communication. Help users research topics thoroughly, evaluate sources, organize information, and present findings clearly with proper citations.',
  '🔬',
  'research',
  true,
  true
),
(
  'Creative Assistant',
  'Creative brainstormer for innovative ideas and concepts',
  'You are a creative thinker who excels at brainstorming, ideation, and innovative problem-solving. Help users generate unique ideas, explore creative possibilities, think outside the box, and develop concepts from initial spark to refined execution.',
  '🎨',
  'creative',
  true,
  true
),
(
  'Business Analyst',
  'Strategic analyst for business planning and analysis',
  'You are a business analyst with expertise in strategic planning, market analysis, financial modeling, and business operations. Help users analyze business problems, develop strategies, interpret data, and make informed decisions.',
  '📊',
  'business',
  true,
  true
);

-- Update handle_new_user() to use persona_templates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
  default_user_persona RECORD;
  default_space_persona RECORD;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Create default workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (new.id, 'My Workspace')
  RETURNING id INTO workspace_id;
  
  -- Fetch default persona template for new users
  SELECT * INTO default_user_persona 
  FROM persona_templates 
  WHERE is_default_for_users = true AND is_active = true 
  LIMIT 1;
  
  -- If no default found, use fallback
  IF default_user_persona.id IS NULL THEN
    default_user_persona.name := 'General Assistant';
    default_user_persona.description := 'Helpful AI assistant for everyday tasks';
    default_user_persona.system_prompt := 'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.';
    default_user_persona.icon := NULL;
  END IF;
  
  -- Create default persona in user's personal library
  INSERT INTO public.personas (workspace_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    default_user_persona.name,
    default_user_persona.description,
    default_user_persona.system_prompt,
    default_user_persona.icon,
    true,
    new.id
  );
  
  -- Fetch default persona template for new spaces
  SELECT * INTO default_space_persona 
  FROM persona_templates 
  WHERE is_default_for_spaces = true AND is_active = true 
  LIMIT 1;
  
  -- If no default found, use same as user default
  IF default_space_persona.id IS NULL THEN
    default_space_persona := default_user_persona;
  END IF;
  
  -- Create default persona for workspace's Space AI Config
  INSERT INTO public.space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    default_space_persona.name,
    default_space_persona.description,
    default_space_persona.system_prompt,
    default_space_persona.icon,
    true,
    new.id
  );
  
  -- Increment use counts if templates exist
  IF default_user_persona.id IS NOT NULL THEN
    UPDATE persona_templates SET use_count = use_count + 1 WHERE id = default_user_persona.id;
  END IF;
  IF default_space_persona.id IS NOT NULL AND default_space_persona.id != default_user_persona.id THEN
    UPDATE persona_templates SET use_count = use_count + 1 WHERE id = default_space_persona.id;
  END IF;
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;