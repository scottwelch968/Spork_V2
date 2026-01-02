-- Drop unused columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS job_title;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS affiliate_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- Update handle_new_user function to not reference full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
  default_user_persona RECORD;
  default_space_persona RECORD;
BEGIN
  -- Insert profile (without full_name)
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', NULL),
    COALESCE(new.raw_user_meta_data->>'last_name', NULL)
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