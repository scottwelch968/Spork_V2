-- Update handle_new_user function to create default General Assistant persona in both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
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
  
  -- Create default General Assistant persona in user's personal library
  INSERT INTO public.personas (workspace_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    'General Assistant',
    'Helpful AI assistant for everyday tasks',
    'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.',
    NULL,
    true,
    new.id
  );
  
  -- Create default General Assistant for workspace's Space AI Config
  INSERT INTO public.space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    'General Assistant',
    'Helpful AI assistant for everyday tasks',
    'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.',
    NULL,
    true,
    new.id
  );
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- One-time migration: Add General Assistant to space_personas for existing workspace
INSERT INTO space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
SELECT workspace_id, name, description, system_prompt, icon, is_default, created_by
FROM personas
WHERE workspace_id = '2fed9762-9fa6-443f-be4c-956c90ca0297'
  AND name = 'General Assistant'
  AND NOT EXISTS (
    SELECT 1 FROM space_personas 
    WHERE space_id = '2fed9762-9fa6-443f-be4c-956c90ca0297' 
    AND name = 'General Assistant'
  );