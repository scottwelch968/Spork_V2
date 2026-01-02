-- PROMPTS: Add user_id, make workspace_id nullable
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migrate existing data from created_by to user_id
UPDATE prompts SET user_id = created_by WHERE created_by IS NOT NULL AND user_id IS NULL;

-- Make workspace_id nullable first (in case there are constraints)
ALTER TABLE prompts ALTER COLUMN workspace_id DROP NOT NULL;

-- PERSONAS: Add user_id, make workspace_id nullable
ALTER TABLE personas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migrate existing data from created_by to user_id
UPDATE personas SET user_id = created_by WHERE created_by IS NOT NULL AND user_id IS NULL;

-- Make workspace_id nullable
ALTER TABLE personas ALTER COLUMN workspace_id DROP NOT NULL;

-- CHATS: Make workspace_id nullable for personal chats
ALTER TABLE chats ALTER COLUMN workspace_id DROP NOT NULL;

-- Update RLS policies for PROMPTS - user-based access
DROP POLICY IF EXISTS "Users can manage prompts in their workspaces" ON prompts;
DROP POLICY IF EXISTS "Users can view prompts in their workspaces" ON prompts;

CREATE POLICY "Users can manage their own prompts" 
ON prompts FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Update RLS policies for PERSONAS - user-based access
DROP POLICY IF EXISTS "Users can manage personas in their workspaces" ON personas;
DROP POLICY IF EXISTS "Users can view personas in their workspaces" ON personas;

CREATE POLICY "Users can manage their own personas" 
ON personas FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Update RLS policy for CHATS to allow personal chats (workspace_id can be null)
DROP POLICY IF EXISTS "Users can create their own chats" ON chats;
CREATE POLICY "Users can create their own chats" 
ON chats FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to create persona with user_id instead of workspace_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Create "My Chats" folder for user (user-owned, not workspace-owned)
  INSERT INTO public.file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
  VALUES (new.id, NULL, 'My Chats', 'user', true, 'my_chats');
  
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
  
  -- Create default persona in user's PERSONAL library (user_id, not workspace_id)
  INSERT INTO public.personas (user_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    new.id,
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
  
  -- Create default persona for workspace's Space AI Config (space_personas table)
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
$function$;