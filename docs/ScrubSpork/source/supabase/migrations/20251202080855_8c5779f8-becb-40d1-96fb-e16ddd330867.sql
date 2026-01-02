-- Phase 1: Database Schema Changes for File System Overhaul

-- 1.1 Add owner_type enum and columns to user_files
ALTER TABLE user_files 
  ALTER COLUMN workspace_id DROP NOT NULL;

ALTER TABLE user_files 
  ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'user' CHECK (owner_type IN ('user', 'workspace'));

-- 1.2 Modify file_folders table
ALTER TABLE file_folders
  ALTER COLUMN workspace_id DROP NOT NULL;

ALTER TABLE file_folders
  ADD COLUMN IF NOT EXISTS owner_type TEXT DEFAULT 'user' CHECK (owner_type IN ('user', 'workspace')),
  ADD COLUMN IF NOT EXISTS is_system_folder BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder_type TEXT CHECK (folder_type IN ('my_chats', 'workspace_root', 'knowledge_base', 'custom', NULL));

-- 1.3 Add file storage tracking to usage_tracking
ALTER TABLE usage_tracking
  ADD COLUMN IF NOT EXISTS file_storage_used_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS file_storage_quota_bytes BIGINT;

-- 1.4 Update existing records - set owner_type based on workspace_id
UPDATE user_files SET owner_type = CASE 
  WHEN workspace_id IS NOT NULL THEN 'workspace' 
  ELSE 'user' 
END WHERE owner_type IS NULL;

UPDATE file_folders SET owner_type = CASE 
  WHEN workspace_id IS NOT NULL THEN 'workspace' 
  ELSE 'user' 
END WHERE owner_type IS NULL;

-- 1.5 Update RLS policies for user_files

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own files" ON user_files;
DROP POLICY IF EXISTS "Users can view files in their workspaces" ON user_files;

-- Create new policies for user-owned files
CREATE POLICY "Users can manage their own user files"
ON user_files FOR ALL
USING (owner_type = 'user' AND user_id = auth.uid())
WITH CHECK (owner_type = 'user' AND user_id = auth.uid());

-- Create new policies for workspace-owned files
CREATE POLICY "Workspace members can view workspace files"
ON user_files FOR SELECT
USING (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = user_files.workspace_id 
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = user_files.workspace_id 
      AND wm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Workspace members can manage workspace files"
ON user_files FOR ALL
USING (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = user_files.workspace_id 
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = user_files.workspace_id 
      AND wm.user_id = auth.uid()
    ))
  )
)
WITH CHECK (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = user_files.workspace_id 
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = user_files.workspace_id 
      AND wm.user_id = auth.uid()
    ))
  )
);

-- 1.6 Update RLS policies for file_folders

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own folders" ON file_folders;
DROP POLICY IF EXISTS "Users can view folders in their workspaces" ON file_folders;

-- Create new policies for user-owned folders
CREATE POLICY "Users can view their own user folders"
ON file_folders FOR SELECT
USING (owner_type = 'user' AND user_id = auth.uid());

CREATE POLICY "Users can create their own user folders"
ON file_folders FOR INSERT
WITH CHECK (owner_type = 'user' AND user_id = auth.uid());

CREATE POLICY "Users can update their own user folders"
ON file_folders FOR UPDATE
USING (owner_type = 'user' AND user_id = auth.uid() AND is_system_folder = false);

CREATE POLICY "Users can delete their own non-system folders"
ON file_folders FOR DELETE
USING (owner_type = 'user' AND user_id = auth.uid() AND is_system_folder = false);

-- Create new policies for workspace-owned folders
CREATE POLICY "Workspace members can view workspace folders"
ON file_folders FOR SELECT
USING (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = file_folders.workspace_id 
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = file_folders.workspace_id 
      AND wm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Workspace owners can manage workspace folders"
ON file_folders FOR ALL
USING (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = file_folders.workspace_id 
    AND w.owner_id = auth.uid()
  )
)
WITH CHECK (
  owner_type = 'workspace' AND 
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = file_folders.workspace_id 
    AND w.owner_id = auth.uid()
  )
);

-- 2.1 Update handle_new_user() to create "My Chats" folder
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
$function$;

-- 2.2 Create trigger function for new workspaces
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create workspace root folder
  INSERT INTO public.file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
  VALUES (NEW.owner_id, NEW.id, NEW.name, 'workspace', true, 'workspace_root');
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for new workspaces
DROP TRIGGER IF EXISTS on_workspace_created ON workspaces;
CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_workspace();

-- 2.3 Create "My Chats" folders for existing users who don't have one
INSERT INTO file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
SELECT p.id, NULL, 'My Chats', 'user', true, 'my_chats'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM file_folders ff 
  WHERE ff.user_id = p.id 
  AND ff.folder_type = 'my_chats'
);

-- 2.4 Create workspace root folders for existing workspaces
INSERT INTO file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
SELECT w.owner_id, w.id, w.name, 'workspace', true, 'workspace_root'
FROM workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM file_folders ff 
  WHERE ff.workspace_id = w.id 
  AND ff.folder_type = 'workspace_root'
);