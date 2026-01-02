-- =====================================================
-- Add Default Prompt System for Users and Workspaces
-- =====================================================

-- Phase 1: Add is_default columns to prompt tables
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

ALTER TABLE public.space_prompts 
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Phase 2: Add is_default_for_users and is_default_for_spaces to prompt_templates
ALTER TABLE public.prompt_templates 
ADD COLUMN IF NOT EXISTS is_default_for_users boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_default_for_spaces boolean DEFAULT false;

-- Phase 3: Insert the "General Prompt" template
INSERT INTO public.prompt_templates (
  title, 
  content, 
  description, 
  category_id,
  is_default_for_users, 
  is_default_for_spaces, 
  is_active, 
  is_featured, 
  icon, 
  color_code, 
  skill_level
) VALUES (
  'General Prompt',
  'You are a helpful Ai assistant. When responding:

1. **Clarify**: If my request is unclear, ask one brief question before proceeding
2. **Structure**: Organize responses with headings, bullets, or numbered steps when appropriate
3. **Concise**: Be thorough but avoid unnecessary filler—get to the point
4. **Adapt**: Match my tone—casual for quick questions, professional for business tasks
5. **Next Steps**: End with a suggestion or question to keep momentum going

Ready to help with anything!',
  'A versatile starter prompt that helps you accomplish any task with clarity and structure. Perfect for getting started with Ai-powered assistance.',
  (SELECT id FROM prompt_categories WHERE slug = 'business-administration' LIMIT 1),
  true,  -- is_default_for_users
  true,  -- is_default_for_spaces
  true,  -- is_active
  false, -- is_featured
  'Sparkles',
  '#6366f1',
  'all'
);

-- Phase 4: Create trigger function to prevent deletion of default prompts
CREATE OR REPLACE FUNCTION prevent_default_prompt_deletion()
RETURNS trigger AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default prompt';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Phase 5: Create triggers on prompts and space_prompts
DROP TRIGGER IF EXISTS protect_default_prompt_deletion ON prompts;
CREATE TRIGGER protect_default_prompt_deletion
BEFORE DELETE ON prompts
FOR EACH ROW EXECUTE FUNCTION prevent_default_prompt_deletion();

DROP TRIGGER IF EXISTS protect_default_space_prompt_deletion ON space_prompts;
CREATE TRIGGER protect_default_space_prompt_deletion
BEFORE DELETE ON space_prompts
FOR EACH ROW EXECUTE FUNCTION prevent_default_prompt_deletion();

-- Phase 6: Update handle_new_user() to create default prompt for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  workspace_id uuid;
  default_persona persona_templates%ROWTYPE;
  default_prompt prompt_templates%ROWTYPE;
BEGIN
  -- Create the user's profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  
  -- Create a default workspace for the user
  INSERT INTO public.workspaces (owner_id, name, description, subscription_tier)
  VALUES (new.id, 'My Workspace', 'Your personal workspace', 'free')
  RETURNING id INTO workspace_id;
  
  -- Create assignment record for the owner with pinned = true
  INSERT INTO public.user_space_assignments (user_id, space_id, is_pinned)
  VALUES (new.id, workspace_id, true);

  -- Create default "My Chats" folder for the user
  INSERT INTO public.file_folders (user_id, name, folder_type, is_system_folder, owner_type)
  VALUES (new.id, 'My Chats', 'chat', true, 'user');
  
  -- Fetch default persona template for new users
  SELECT * INTO default_persona 
  FROM persona_templates 
  WHERE is_default_for_users = true AND is_active = true 
  LIMIT 1;

  -- Fallback if no template exists
  IF default_persona.id IS NULL THEN
    default_persona.name := 'General Assistant';
    default_persona.description := 'Helpful AI assistant for everyday tasks';
    default_persona.system_prompt := 'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.';
    default_persona.icon := NULL;
  END IF;

  -- Create default persona in user's personal library
  INSERT INTO public.personas (user_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    new.id,
    default_persona.name,
    default_persona.description,
    default_persona.system_prompt,
    default_persona.icon,
    true,
    new.id
  );

  -- Create default persona for workspace
  INSERT INTO public.space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    default_persona.name,
    default_persona.description,
    default_persona.system_prompt,
    default_persona.icon,
    true,
    new.id
  );

  -- Increment persona template use count
  IF default_persona.id IS NOT NULL THEN
    UPDATE persona_templates SET use_count = COALESCE(use_count, 0) + 2 WHERE id = default_persona.id;
  END IF;

  -- Fetch default prompt template for new users
  SELECT * INTO default_prompt 
  FROM prompt_templates 
  WHERE is_default_for_users = true AND is_active = true 
  LIMIT 1;

  -- Fallback if no template exists
  IF default_prompt.id IS NULL THEN
    default_prompt.title := 'General Prompt';
    default_prompt.content := 'You are a helpful Ai assistant. When responding:

1. **Clarify**: If my request is unclear, ask one brief question before proceeding
2. **Structure**: Organize responses with headings, bullets, or numbered steps when appropriate
3. **Concise**: Be thorough but avoid unnecessary filler—get to the point
4. **Adapt**: Match my tone—casual for quick questions, professional for business tasks
5. **Next Steps**: End with a suggestion or question to keep momentum going

Ready to help with anything!';
  END IF;

  -- Create default prompt in user's personal library
  INSERT INTO public.prompts (user_id, title, content, is_default, created_by)
  VALUES (
    new.id,
    default_prompt.title,
    default_prompt.content,
    true,
    new.id
  );

  -- Create default prompt for workspace
  INSERT INTO public.space_prompts (space_id, title, content, is_default, created_by)
  VALUES (
    workspace_id,
    default_prompt.title,
    default_prompt.content,
    true,
    new.id
  );

  -- Increment prompt template use count
  IF default_prompt.id IS NOT NULL THEN
    UPDATE prompt_templates SET use_count = COALESCE(use_count, 0) + 2 WHERE id = default_prompt.id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;