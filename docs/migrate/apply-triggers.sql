-- =====================================================
-- SPORK DATABASE TRIGGERS MIGRATION
-- Complete trigger and function setup
-- Generated for external Supabase project migration
-- =====================================================

-- =====================================================
-- 1. UTILITY FUNCTIONS
-- =====================================================

-- Updated At Handler - Used by 20+ tables
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- User Settings Updated At Handler
CREATE OR REPLACE FUNCTION public.handle_user_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Handle New User - Creates profile, workspace, defaults
-- Updated to match current schema (personas and prompts use user_id, not workspace_id)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_id uuid;
  default_user_persona RECORD;
  default_space_persona RECORD;
  default_user_prompt RECORD;
  default_space_prompt RECORD;
BEGIN
  -- Create the user's profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  );
  
  -- Create a default workspace for the user
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, 'My Workspace')
  RETURNING id INTO workspace_id;
  
  -- Create assignment record for the owner with pinned = true (if table exists)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_space_assignments') THEN
    INSERT INTO public.user_space_assignments (user_id, space_id, is_pinned)
    VALUES (NEW.id, workspace_id, true);
  END IF;

  -- Create default "My Chats" folder for the user (user-owned, not workspace-owned)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_folders') THEN
    INSERT INTO public.file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
    VALUES (NEW.id, NULL, 'My Chats', 'user', true, 'my_chats');
  END IF;
  
  -- Fetch default persona template for new users
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona_templates') THEN
    SELECT * INTO default_user_persona 
    FROM persona_templates 
    WHERE is_default_for_users = true AND is_active = true 
    LIMIT 1;
  END IF;

  -- Fallback if no template exists
  IF default_user_persona.id IS NULL THEN
    default_user_persona.name := 'General Assistant';
    default_user_persona.description := 'Helpful AI assistant for everyday tasks';
    default_user_persona.system_prompt := 'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.';
    default_user_persona.icon := NULL;
  END IF;

  -- Create default persona in user's PERSONAL library (user_id, workspace_id is NULL)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'personas') THEN
    INSERT INTO public.personas (user_id, name, description, system_prompt, icon, is_default, created_by)
    VALUES (
      NEW.id,
      default_user_persona.name,
      default_user_persona.description,
      default_user_persona.system_prompt,
      default_user_persona.icon,
      true,
      NEW.id
    );
  END IF;

  -- Fetch default persona template for new spaces
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona_templates') THEN
    SELECT * INTO default_space_persona 
    FROM persona_templates 
    WHERE is_default_for_spaces = true AND is_active = true 
    LIMIT 1;
  END IF;
  
  -- If no default found, use same as user default
  IF default_space_persona.id IS NULL THEN
    default_space_persona := default_user_persona;
  END IF;

  -- Create default persona for workspace's Space AI Config (space_personas table)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'space_personas') THEN
    INSERT INTO public.space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
    VALUES (
      workspace_id,
      default_space_persona.name,
      default_space_persona.description,
      default_space_persona.system_prompt,
      default_space_persona.icon,
      true,
      NEW.id
    );
  END IF;

  -- Increment use counts if templates exist
  IF default_user_persona.id IS NOT NULL AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona_templates') THEN
    UPDATE persona_templates SET use_count = COALESCE(use_count, 0) + 1 WHERE id = default_user_persona.id;
  END IF;
  IF default_space_persona.id IS NOT NULL AND default_space_persona.id != default_user_persona.id AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona_templates') THEN
    UPDATE persona_templates SET use_count = COALESCE(use_count, 0) + 1 WHERE id = default_space_persona.id;
  END IF;

  -- Fetch default prompt template for new users
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompt_templates') THEN
    SELECT * INTO default_user_prompt 
    FROM prompt_templates 
    WHERE is_default_for_users = true AND is_active = true 
    LIMIT 1;
  END IF;

  -- Fallback if no template exists
  IF default_user_prompt.id IS NULL THEN
    default_user_prompt.title := 'General Prompt';
    default_user_prompt.content := 'You are a helpful AI assistant. When responding:

1. **Clarify**: If my request is unclear, ask one brief question before proceeding
2. **Structure**: Organize responses with headings, bullets, or numbered steps when appropriate
3. **Concise**: Be thorough but avoid unnecessary filler—get to the point
4. **Adapt**: Match my tone—casual for quick questions, professional for business tasks
5. **Next Steps**: End with a suggestion or question to keep momentum going

Ready to help with anything!';
  END IF;

  -- Create default prompt in user's PERSONAL library (user_id, workspace_id is NULL)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompts') THEN
    INSERT INTO public.prompts (user_id, title, content, is_default, created_by)
    VALUES (
      NEW.id,
      default_user_prompt.title,
      default_user_prompt.content,
      true,
      NEW.id
    );
  END IF;

  -- Fetch default prompt template for new spaces
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompt_templates') THEN
    SELECT * INTO default_space_prompt 
    FROM prompt_templates 
    WHERE is_default_for_spaces = true AND is_active = true 
    LIMIT 1;
  END IF;
  
  -- If no default found, use same as user default
  IF default_space_prompt.id IS NULL THEN
    default_space_prompt := default_user_prompt;
  END IF;

  -- Create default prompt for workspace's Space AI Config (space_prompts table)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'space_prompts') THEN
    INSERT INTO public.space_prompts (space_id, title, content, is_default, created_by)
    VALUES (
      workspace_id,
      default_space_prompt.title,
      default_space_prompt.content,
      true,
      NEW.id
    );
  END IF;

  -- Increment use counts if templates exist
  IF default_user_prompt.id IS NOT NULL AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompt_templates') THEN
    UPDATE prompt_templates SET use_count = COALESCE(use_count, 0) + 1 WHERE id = default_user_prompt.id;
  END IF;
  IF default_space_prompt.id IS NOT NULL AND default_space_prompt.id != default_user_prompt.id AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompt_templates') THEN
    UPDATE prompt_templates SET use_count = COALESCE(use_count, 0) + 1 WHERE id = default_space_prompt.id;
  END IF;

  -- Assign user role
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. WORKSPACE MANAGEMENT FUNCTIONS
-- =====================================================

-- Handle New Workspace - Creates root folder
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create workspace root folder
  INSERT INTO public.file_folders (user_id, workspace_id, name, owner_type, is_system_folder, folder_type)
  VALUES (NEW.owner_id, NEW.id, NEW.name, 'workspace', true, 'workspace_root');
  
  RETURN NEW;
END;
$$;

-- Prevent Default Workspace Deletion
CREATE OR REPLACE FUNCTION public.prevent_default_workspace_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default workspace';
  END IF;
  RETURN OLD;
END;
$$;

-- Prevent Default Workspace Changes
CREATE OR REPLACE FUNCTION public.prevent_default_workspace_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- =====================================================
-- 4. PROMPT PROTECTION FUNCTIONS
-- =====================================================

-- Prevent Default Prompt Deletion
CREATE OR REPLACE FUNCTION public.prevent_default_prompt_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default prompt';
  END IF;
  RETURN OLD;
END;
$$;

-- =====================================================
-- 5. COSMO QUEUE FUNCTIONS
-- =====================================================

-- Validate COSMO Request Payload
CREATE OR REPLACE FUNCTION public.validate_cosmo_request_payload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure payload is a JSON object
  IF jsonb_typeof(NEW.request_payload) != 'object' THEN
    RAISE EXCEPTION 'request_payload must be a JSON object';
  END IF;
  
  -- Ensure payload contains required fields
  IF NOT (NEW.request_payload ? 'messages') THEN
    RAISE EXCEPTION 'request_payload must contain messages array';
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 6. CLEANUP FUNCTIONS
-- =====================================================

-- Cleanup Expired OAuth States
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM oauth_states WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- =====================================================
-- 7. SECURITY HELPER FUNCTIONS
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is a workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid AND user_id = user_uuid
  );
$$;

-- =====================================================
-- 8. SCHEMA INTROSPECTION FUNCTIONS
-- =====================================================

-- Get Enum Types
CREATE OR REPLACE FUNCTION public.get_enum_types()
RETURNS TABLE(type_name text, enum_label text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.typname::text as type_name,
    e.enumlabel::text as enum_label
  FROM pg_type t 
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder;
$$;

-- Get Schema Columns
CREATE OR REPLACE FUNCTION public.get_schema_columns()
RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text, column_default text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    CASE 
      WHEN c.data_type = 'ARRAY' THEN 
        CASE 
          WHEN c.udt_name LIKE '_%' THEN SUBSTRING(c.udt_name FROM 2) || '[]'
          ELSE c.udt_name::text || '[]'
        END
      WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name::text
      ELSE c.data_type::text
    END as data_type,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Get Foreign Keys
CREATE OR REPLACE FUNCTION public.get_foreign_keys()
RETURNS TABLE(table_name text, column_name text, foreign_table_name text, foreign_column_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tc.table_name::text,
    kcu.column_name::text,
    ccu.table_name::text as foreign_table_name,
    ccu.column_name::text as foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name 
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name 
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public';
$$;

-- Get RLS Status
CREATE OR REPLACE FUNCTION public.get_rls_status()
RETURNS TABLE(table_name text, rls_enabled boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    relname::text as table_name,
    relrowsecurity as rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
  ORDER BY relname;
$$;

-- Get RLS Policies
CREATE OR REPLACE FUNCTION public.get_rls_policies()
RETURNS TABLE(tablename text, policyname text, permissive text, roles text[], cmd text, qual text, with_check text, policy_definition text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles,
    p.cmd::text,
    p.qual::text,
    p.with_check::text,
    format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO %s%s%s;',
      p.policyname,
      p.tablename,
      p.permissive,
      p.cmd,
      array_to_string(p.roles, ', '),
      CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END
    )::text as policy_definition
  FROM pg_policies p
  WHERE p.schemaname = 'public';
$$;

-- Get Database Functions
CREATE OR REPLACE FUNCTION public.get_db_functions()
RETURNS TABLE(routine_name text, data_type text, routine_definition text, routine_language text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.proname::text as routine_name,
    pg_get_function_result(p.oid)::text as data_type,
    pg_get_functiondef(p.oid)::text as routine_definition,
    l.lanname::text as routine_language
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  ORDER BY p.proname;
$$;

-- =====================================================
-- 9. CREATE TRIGGERS
-- =====================================================

-- Auth User Created Trigger (on auth.users)
-- NOTE: This trigger is on auth.users which is managed by Supabase
-- You may need admin access to create this
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Workspace Created Trigger (only if table and function exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workspaces') 
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_workspace' AND pronamespace = 'public'::regnamespace) THEN
    DROP TRIGGER IF EXISTS on_workspace_created ON public.workspaces;
    CREATE TRIGGER on_workspace_created
      AFTER INSERT ON public.workspaces
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_workspace();
  END IF;
END $$;

-- Workspace Protection Triggers (only if table and functions exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workspaces') THEN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_default_workspace_deletion' AND pronamespace = 'public'::regnamespace) THEN
      DROP TRIGGER IF EXISTS prevent_default_workspace_deletion ON public.workspaces;
      CREATE TRIGGER prevent_default_workspace_deletion
        BEFORE DELETE ON public.workspaces
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_default_workspace_deletion();
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_default_workspace_changes' AND pronamespace = 'public'::regnamespace) THEN
      DROP TRIGGER IF EXISTS prevent_default_workspace_changes ON public.workspaces;
      CREATE TRIGGER prevent_default_workspace_changes
        BEFORE UPDATE ON public.workspaces
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_default_workspace_changes();
    END IF;
  END IF;
END $$;

-- Prompt Protection Triggers (only if tables and function exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_default_prompt_deletion' AND pronamespace = 'public'::regnamespace) THEN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompts') THEN
      DROP TRIGGER IF EXISTS prevent_default_prompt_deletion ON public.prompts;
      CREATE TRIGGER prevent_default_prompt_deletion
        BEFORE DELETE ON public.prompts
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_default_prompt_deletion();
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'space_prompts') THEN
      DROP TRIGGER IF EXISTS prevent_default_space_prompt_deletion ON public.space_prompts;
      CREATE TRIGGER prevent_default_space_prompt_deletion
        BEFORE DELETE ON public.space_prompts
        FOR EACH ROW
        EXECUTE FUNCTION public.prevent_default_prompt_deletion();
    END IF;
  END IF;
END $$;

-- COSMO Queue Validation Trigger (only if table and function exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cosmo_request_queue')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_cosmo_request_payload' AND pronamespace = 'public'::regnamespace) THEN
    DROP TRIGGER IF EXISTS validate_cosmo_request ON public.cosmo_request_queue;
    CREATE TRIGGER validate_cosmo_request
      BEFORE INSERT ON public.cosmo_request_queue
      FOR EACH ROW
      EXECUTE FUNCTION public.validate_cosmo_request_payload();
  END IF;
END $$;

-- =====================================================
-- 10. UPDATED_AT TRIGGERS FOR ALL TABLES
-- =====================================================

-- Dynamically create updated_at triggers for all tables with updated_at columns
DO $$
DECLARE
  tbl_record RECORD;
  triggers_created INTEGER := 0;
BEGIN
  -- Loop through all tables in public schema that have an updated_at column
  FOR tbl_record IN 
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN pg_tables t ON t.tablename = c.table_name AND t.schemaname = c.table_schema
    WHERE c.table_schema = 'public'
    AND c.column_name = 'updated_at'
    ORDER BY c.table_name
  LOOP
    -- Create trigger for each table with updated_at
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', tbl_record.table_name, tbl_record.table_name);
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl_record.table_name, tbl_record.table_name);
      triggers_created := triggers_created + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create trigger on table %: %', tbl_record.table_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Created updated_at triggers on % tables', triggers_created;
END $$;

-- User Settings specific trigger
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_settings_updated_at();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check triggers:
-- SELECT tgname, tgrelid::regclass, proname 
-- FROM pg_trigger t JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgrelid::regclass::text NOT LIKE 'pg_%';

-- Check functions:
-- SELECT proname, prosrc FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
