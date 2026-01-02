-- Update handle_new_user function to create default General Assistant persona
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
  
  -- Create default General Assistant persona for the new workspace
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
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;