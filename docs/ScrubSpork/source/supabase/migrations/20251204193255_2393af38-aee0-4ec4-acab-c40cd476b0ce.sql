-- Add is_default column to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Mark existing "My Workspace" as default (keep oldest one per owner)
WITH oldest_my_workspace AS (
  SELECT DISTINCT ON (owner_id) id
  FROM workspaces
  WHERE name = 'My Workspace'
  ORDER BY owner_id, created_at ASC
)
UPDATE workspaces SET is_default = true WHERE id IN (SELECT id FROM oldest_my_workspace);

-- Delete duplicate "My Workspace" entries (keep only is_default = true ones)
DELETE FROM workspaces 
WHERE name = 'My Workspace' 
  AND (is_default IS NULL OR is_default = false);

-- Create user_space_assignments for existing default workspaces if missing
INSERT INTO user_space_assignments (user_id, space_id, is_pinned)
SELECT w.owner_id, w.id, true
FROM workspaces w
WHERE w.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM user_space_assignments usa 
    WHERE usa.user_id = w.owner_id AND usa.space_id = w.id
  );

-- Create trigger function to prevent default workspace modifications
CREATE OR REPLACE FUNCTION prevent_default_workspace_changes()
RETURNS trigger AS $$
BEGIN
  -- Prevent renaming default workspace
  IF OLD.is_default = true AND NEW.name != OLD.name THEN
    RAISE EXCEPTION 'Cannot rename the default workspace';
  END IF;
  
  -- Prevent archiving default workspace
  IF OLD.is_default = true AND NEW.is_archived = true THEN
    RAISE EXCEPTION 'Cannot archive the default workspace';
  END IF;
  
  -- Prevent changing is_default flag
  IF OLD.is_default = true AND NEW.is_default = false THEN
    RAISE EXCEPTION 'Cannot remove default status from the default workspace';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for update protection
DROP TRIGGER IF EXISTS protect_default_workspace ON workspaces;
CREATE TRIGGER protect_default_workspace
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION prevent_default_workspace_changes();

-- Create trigger function to prevent default workspace deletion
CREATE OR REPLACE FUNCTION prevent_default_workspace_deletion()
RETURNS trigger AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default workspace';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for delete protection
DROP TRIGGER IF EXISTS protect_default_workspace_deletion ON workspaces;
CREATE TRIGGER protect_default_workspace_deletion
BEFORE DELETE ON workspaces
FOR EACH ROW EXECUTE FUNCTION prevent_default_workspace_deletion();

-- Update handle_new_user function to set is_default and create user_space_assignments
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
  -- Insert profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', NULL),
    COALESCE(new.raw_user_meta_data->>'last_name', NULL)
  );
  
  -- Create default workspace with is_default = true
  INSERT INTO public.workspaces (owner_id, name, is_default)
  VALUES (new.id, 'My Workspace', true)
  RETURNING id INTO workspace_id;
  
  -- Create user_space_assignments entry for the default workspace
  INSERT INTO public.user_space_assignments (user_id, space_id, is_pinned)
  VALUES (new.id, workspace_id, true);
  
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