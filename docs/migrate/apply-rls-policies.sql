-- =============================================================================
-- Spork Complete RLS Policy Application Script
-- =============================================================================
-- This script applies all Row-Level Security policies for the Spork database.
-- 
-- IMPORTANT: Run this script in order - security functions must be created
-- before policies that reference them.
--
-- Prerequisites:
--   1. All tables must exist
--   2. app_role enum must exist
--   3. user_roles table must exist
--
-- Usage:
--   psql -h your-db-host -U postgres -d your-db -f apply-rls-policies.sql
-- =============================================================================

-- Set search path
SET search_path TO public;

-- =============================================================================
-- SECTION 1: ENUM TYPES
-- =============================================================================

-- Create app_role enum if not exists (matches actual schema: admin, user only)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- SECTION 2: SECURITY DEFINER FUNCTIONS
-- =============================================================================

-- Function: has_role
-- Checks if a user has a specific role (avoids RLS recursion)
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

-- Function: is_workspace_member
-- Checks if a user is a member of a workspace (avoids RLS recursion)
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

-- =============================================================================
-- SECTION 3: ENABLE RLS ON ALL TABLES (DYNAMIC)
-- =============================================================================
-- Dynamically enable RLS on all public tables that exist
-- This ensures we don't miss any tables and handles missing tables gracefully

DO $$
DECLARE
  tbl_record RECORD;
  tables_enabled INTEGER := 0;
BEGIN
  -- Loop through all tables in public schema
  FOR tbl_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    -- Enable RLS on each table
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_record.tablename);
      tables_enabled := tables_enabled + 1;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log but continue if table doesn't exist or other error
        RAISE NOTICE 'Could not enable RLS on table %: %', tbl_record.tablename, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Enabled RLS on % tables', tables_enabled;
END $$;

-- =============================================================================
-- SECTION 4: PROFILES POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================================================
-- SECTION 5: USER ROLES POLICIES (Service Role Only)
-- =============================================================================

DROP POLICY IF EXISTS "Service role access only" ON public.user_roles;
CREATE POLICY "Service role access only"
ON public.user_roles FOR ALL
USING (false);
-- Access only via service_role key

-- =============================================================================
-- SECTION 6: WORKSPACE POLICIES
-- =============================================================================

-- workspaces
DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;
CREATE POLICY "Users can view own workspaces"
ON public.workspaces FOR SELECT
USING (owner_id = auth.uid() OR is_workspace_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update workspaces" ON public.workspaces;
CREATE POLICY "Owners can update workspaces"
ON public.workspaces FOR UPDATE
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete workspaces"
ON public.workspaces FOR DELETE
USING (owner_id = auth.uid());

-- workspace_members
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;
CREATE POLICY "Users can view workspace members"
ON public.workspace_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid())
  OR is_workspace_member(workspace_id, auth.uid())
);

DROP POLICY IF EXISTS "Workspace owners can manage members" ON public.workspace_members;
CREATE POLICY "Workspace owners can manage members"
ON public.workspace_members FOR ALL
USING (EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Members can remove themselves" ON public.workspace_members;
CREATE POLICY "Members can remove themselves"
ON public.workspace_members FOR DELETE
USING (user_id = auth.uid());

-- workspace_invitations
DROP POLICY IF EXISTS "Workspace owners can manage invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace owners can manage invitations"
ON public.workspace_invitations FOR ALL
USING (EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_invitations.workspace_id AND w.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can view their own invitations" ON public.workspace_invitations;
CREATE POLICY "Anyone can view their own invitations"
ON public.workspace_invitations FOR SELECT
USING (email = (SELECT profiles.email FROM profiles WHERE profiles.id = auth.uid()));

-- workspace_activity
DROP POLICY IF EXISTS "Members and owners can view workspace activity" ON public.workspace_activity;
CREATE POLICY "Members and owners can view workspace activity"
ON public.workspace_activity FOR SELECT
USING (
  EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_activity.workspace_id AND workspaces.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspace_activity.workspace_id AND workspace_members.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Members can log workspace activity" ON public.workspace_activity;
CREATE POLICY "Members can log workspace activity"
ON public.workspace_activity FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = workspace_activity.workspace_id AND workspaces.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM workspace_members WHERE workspace_members.workspace_id = workspace_activity.workspace_id AND workspace_members.user_id = auth.uid())
  )
);

-- =============================================================================
-- SECTION 7: CHAT POLICIES
-- =============================================================================

-- chats
DROP POLICY IF EXISTS "Users can manage own chats" ON public.chats;
CREATE POLICY "Users can manage own chats"
ON public.chats FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- messages
DROP POLICY IF EXISTS "Users can view messages in own chats" ON public.messages;
CREATE POLICY "Users can view messages in own chats"
ON public.messages FOR SELECT
USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;
CREATE POLICY "Users can create messages in own chats"
ON public.messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete messages in own chats" ON public.messages;
CREATE POLICY "Users can delete messages in own chats"
ON public.messages FOR DELETE
USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));

-- =============================================================================
-- SECTION 8: SPACE CHAT POLICIES
-- =============================================================================

-- space_chats
DROP POLICY IF EXISTS "Users can view chats in their spaces" ON public.space_chats;
CREATE POLICY "Users can view chats in their spaces"
ON public.space_chats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_chats.space_id
    AND (workspaces.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = space_chats.space_id
      AND workspace_members.user_id = auth.uid()
    ))
  )
);

DROP POLICY IF EXISTS "Space members can create chats" ON public.space_chats;
CREATE POLICY "Space members can create chats"
ON public.space_chats FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_chats.space_id
    AND (workspaces.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = space_chats.space_id
      AND workspace_members.user_id = auth.uid()
    ))
  )
);

DROP POLICY IF EXISTS "Creators can update their chats" ON public.space_chats;
CREATE POLICY "Creators can update their chats"
ON public.space_chats FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Creators and space owners can delete chats" ON public.space_chats;
CREATE POLICY "Creators and space owners can delete chats"
ON public.space_chats FOR DELETE
USING (
  user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_chats.space_id
    AND workspaces.owner_id = auth.uid()
  )
);

-- =============================================================================
-- SECTION 9: AI & CONTENT POLICIES
-- =============================================================================

-- ai_models
DROP POLICY IF EXISTS "Admins can manage models" ON public.ai_models;
CREATE POLICY "Admins can manage models"
ON public.ai_models FOR ALL
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can view active models" ON public.ai_models;
CREATE POLICY "Users can view active models"
ON public.ai_models FOR SELECT
USING (is_active = true);

-- personas
DROP POLICY IF EXISTS "Users can manage own personas" ON public.personas;
CREATE POLICY "Users can manage own personas"
ON public.personas FOR ALL
USING (auth.uid() = user_id OR auth.uid() = created_by)
WITH CHECK (auth.uid() = user_id OR auth.uid() = created_by);

-- prompts
DROP POLICY IF EXISTS "Users can manage their own prompts" ON public.prompts;
CREATE POLICY "Users can manage their own prompts"
ON public.prompts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- generated_content
DROP POLICY IF EXISTS "Users can view their own generated content" ON public.generated_content;
CREATE POLICY "Users can view their own generated content"
ON public.generated_content FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create generated content" ON public.generated_content;
CREATE POLICY "Users can create generated content"
ON public.generated_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own generated content" ON public.generated_content;
CREATE POLICY "Users can delete their own generated content"
ON public.generated_content FOR DELETE
USING (auth.uid() = user_id);

-- knowledge_base
DROP POLICY IF EXISTS "Workspace members can view knowledge base" ON public.knowledge_base;
CREATE POLICY "Workspace members can view knowledge base"
ON public.knowledge_base FOR SELECT
USING (
  is_workspace_member(workspace_id, auth.uid())
  OR EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = knowledge_base.workspace_id AND workspaces.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Workspace members can upload to knowledge base" ON public.knowledge_base;
CREATE POLICY "Workspace members can upload to knowledge base"
ON public.knowledge_base FOR INSERT
WITH CHECK (
  is_workspace_member(workspace_id, auth.uid())
  OR EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = knowledge_base.workspace_id AND workspaces.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Workspace members can update knowledge base" ON public.knowledge_base;
CREATE POLICY "Workspace members can update knowledge base"
ON public.knowledge_base FOR UPDATE
USING (
  is_workspace_member(workspace_id, auth.uid())
  OR EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = knowledge_base.workspace_id AND workspaces.owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Workspace members can delete from knowledge base" ON public.knowledge_base;
CREATE POLICY "Workspace members can delete from knowledge base"
ON public.knowledge_base FOR DELETE
USING (
  is_workspace_member(workspace_id, auth.uid())
  OR EXISTS (SELECT 1 FROM workspaces WHERE workspaces.id = knowledge_base.workspace_id AND workspaces.owner_id = auth.uid())
);

-- =============================================================================
-- SECTION 10: BILLING POLICIES
-- =============================================================================

-- pricing_tiers
DROP POLICY IF EXISTS "Anyone can view pricing tiers" ON public.pricing_tiers;
CREATE POLICY "Anyone can view pricing tiers"
ON public.pricing_tiers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON public.pricing_tiers;
CREATE POLICY "Admins can manage pricing tiers"
ON public.pricing_tiers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- credit_packages
DROP POLICY IF EXISTS "Users can view active credit packages" ON public.credit_packages;
CREATE POLICY "Users can view active credit packages"
ON public.credit_packages FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage credit packages" ON public.credit_packages;
CREATE POLICY "Admins can manage credit packages"
ON public.credit_packages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- payment_processors
DROP POLICY IF EXISTS "Admins can manage payment processors" ON public.payment_processors;
CREATE POLICY "Admins can manage payment processors"
ON public.payment_processors FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SECTION 11: ADMIN-ONLY POLICIES
-- =============================================================================

-- email_providers
DROP POLICY IF EXISTS "Admins can manage email providers" ON public.email_providers;
CREATE POLICY "Admins can manage email providers"
ON public.email_providers FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- system_settings
DROP POLICY IF EXISTS "Authenticated users can read system settings" ON public.system_settings;
CREATE POLICY "Authenticated users can read system settings"
ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- cosmo_intents
DROP POLICY IF EXISTS "Admin only: manage intents" ON public.cosmo_intents;
CREATE POLICY "Admin only: manage intents"
ON public.cosmo_intents FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- cosmo_action_mappings
DROP POLICY IF EXISTS "Admin only: manage action mappings" ON public.cosmo_action_mappings;
CREATE POLICY "Admin only: manage action mappings"
ON public.cosmo_action_mappings FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SECTION 12: SERVICE-ROLE-ONLY POLICIES
-- =============================================================================

-- oauth_states
DROP POLICY IF EXISTS "Service role access only" ON public.oauth_states;
CREATE POLICY "Service role access only"
ON public.oauth_states FOR ALL
USING (false);

-- system_user_sessions
DROP POLICY IF EXISTS "Block all public access to system_user_sessions" ON public.system_user_sessions;
CREATE POLICY "Block all public access to system_user_sessions"
ON public.system_user_sessions FOR ALL
USING (false)
WITH CHECK (false);

-- system_audit_log
DROP POLICY IF EXISTS "Service role can manage system_audit_log" ON public.system_audit_log;
CREATE POLICY "Service role can manage system_audit_log"
ON public.system_audit_log FOR ALL
USING (true)
WITH CHECK (true);

-- cosmo_cost_tracking
DROP POLICY IF EXISTS "Service role full access to cost tracking" ON public.cosmo_cost_tracking;
CREATE POLICY "Service role full access to cost tracking"
ON public.cosmo_cost_tracking FOR ALL
USING (true)
WITH CHECK (true);

-- =============================================================================
-- SECTION 13: TEMPLATE POLICIES
-- =============================================================================

-- persona_categories
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.persona_categories;
CREATE POLICY "Anyone can view active categories"
ON public.persona_categories FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage persona categories" ON public.persona_categories;
CREATE POLICY "Admins can manage persona categories"
ON public.persona_categories FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- =============================================================================
-- SECTION 14: SPORK TOOLS POLICIES
-- =============================================================================

-- spork_projects
DROP POLICY IF EXISTS "Users manage own projects" ON public.spork_projects;
CREATE POLICY "Users manage own projects"
ON public.spork_projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage system projects" ON public.spork_projects;
CREATE POLICY "Admins manage system projects"
ON public.spork_projects FOR ALL
USING (is_system_owned = true AND has_role(auth.uid(), 'admin'))
WITH CHECK (is_system_owned = true AND has_role(auth.uid(), 'admin'));

-- spork_tool_installations
DROP POLICY IF EXISTS "Users can view their personal installations" ON public.spork_tool_installations;
CREATE POLICY "Users can view their personal installations"
ON public.spork_tool_installations FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Workspace members can view installations" ON public.spork_tool_installations;
CREATE POLICY "Workspace members can view installations"
ON public.spork_tool_installations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = spork_tool_installations.workspace_id
    AND (w.owner_id = auth.uid() OR is_workspace_member(w.id, auth.uid()))
  )
);

-- =============================================================================
-- COMPLETE
-- =============================================================================

-- Verify RLS is enabled on critical tables
DO $$
DECLARE
    tables_without_rls TEXT;
BEGIN
    SELECT string_agg(tablename, ', ')
    INTO tables_without_rls
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public'
    AND NOT c.relrowsecurity;
    
    IF tables_without_rls IS NOT NULL THEN
        RAISE NOTICE 'Tables without RLS enabled: %', tables_without_rls;
    ELSE
        RAISE NOTICE 'All public tables have RLS enabled';
    END IF;
END $$;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'RLS Policy Application Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Run ./scripts/verify-rls.sh to verify policies';
END $$;
