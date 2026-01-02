-- ============================================================
-- External Integration Credential Management System
-- Enables App Store items (Tools, Assistants, Agents) to securely
-- connect to external services like Slack, Google Drive, HubSpot, etc.
-- ============================================================

-- 1. Create external_providers table
-- Stores metadata about supported external services
CREATE TABLE public.external_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key VARCHAR(50) UNIQUE NOT NULL,  -- 'slack', 'google_drive', 'hubspot', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,  -- 'communication', 'storage', 'crm', 'productivity', 'development'
  
  -- OAuth Configuration
  auth_type VARCHAR(20) NOT NULL,  -- 'oauth2', 'api_key', 'webhook'
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_scopes TEXT[] DEFAULT '{}',  -- Available/Required scopes
  oauth_client_id_secret_id UUID,  -- References vault.secrets
  oauth_client_secret_secret_id UUID,  -- References vault.secrets
  
  -- Display
  icon_url TEXT,
  documentation_url TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_providers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage external providers"
  ON public.external_providers FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view enabled providers"
  ON public.external_providers FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_enabled = true);

-- 2. Create user_integrations table
-- Stores user-level OAuth tokens and API keys
CREATE TABLE public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_key VARCHAR(50) NOT NULL REFERENCES public.external_providers(provider_key) ON DELETE CASCADE,
  
  -- Credential Storage (via Supabase Vault)
  access_token_secret_id UUID,  -- References vault.secrets
  refresh_token_secret_id UUID,
  api_key_secret_id UUID,
  
  -- OAuth metadata
  oauth_scopes TEXT[] DEFAULT '{}',  -- Actually granted scopes
  token_expires_at TIMESTAMPTZ,
  
  -- Connection info
  external_account_id TEXT,  -- e.g., Slack user ID
  external_account_name TEXT,  -- e.g., Slack username
  external_account_email TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',  -- 'active', 'expired', 'revoked', 'error'
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, provider_key)
);

-- Enable RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own integrations"
  ON public.user_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user integrations"
  ON public.user_integrations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 3. Create workspace_integrations table
-- Stores workspace-level (shared) integrations
CREATE TABLE public.workspace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider_key VARCHAR(50) NOT NULL REFERENCES public.external_providers(provider_key) ON DELETE CASCADE,
  configured_by UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Credential Storage (via Supabase Vault)
  access_token_secret_id UUID,
  refresh_token_secret_id UUID,
  api_key_secret_id UUID,
  webhook_secret_id UUID,  -- For incoming webhooks
  
  -- OAuth metadata
  oauth_scopes TEXT[] DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  
  -- Connection info
  external_workspace_id TEXT,  -- e.g., Slack workspace ID
  external_workspace_name TEXT,
  
  -- Permission control
  allowed_roles TEXT[] DEFAULT ARRAY['owner', 'admin'],  -- Who can use this integration
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(workspace_id, provider_key)
);

-- Enable RLS
ALTER TABLE public.workspace_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace owners can manage integrations"
  ON public.workspace_integrations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = workspace_integrations.workspace_id 
    AND workspaces.owner_id = auth.uid()
  ));

CREATE POLICY "Workspace members can view integrations"
  ON public.workspace_integrations FOR SELECT
  USING (
    is_workspace_member(workspace_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE workspaces.id = workspace_integrations.workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
  );

-- 4. Create app_item_integrations table
-- Links installed App Store items to required integrations
CREATE TABLE public.app_item_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_installation_id UUID NOT NULL REFERENCES public.spork_tool_installations(id) ON DELETE CASCADE,
  provider_key VARCHAR(50) NOT NULL REFERENCES public.external_providers(provider_key) ON DELETE CASCADE,
  
  -- Which integration to use
  use_workspace_integration BOOLEAN DEFAULT false,
  user_integration_id UUID REFERENCES public.user_integrations(id) ON DELETE SET NULL,
  workspace_integration_id UUID REFERENCES public.workspace_integrations(id) ON DELETE SET NULL,
  
  -- Status
  is_connected BOOLEAN DEFAULT false,
  connection_verified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_item_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their app integrations"
  ON public.app_item_integrations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM spork_tool_installations sti
    WHERE sti.id = app_item_integrations.tool_installation_id
    AND sti.installed_by = auth.uid()
  ));

CREATE POLICY "Workspace members can view app integrations"
  ON public.app_item_integrations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM spork_tool_installations sti
    JOIN workspaces w ON w.id = sti.workspace_id
    WHERE sti.id = app_item_integrations.tool_installation_id
    AND (w.owner_id = auth.uid() OR is_workspace_member(sti.workspace_id, auth.uid()))
  ));

-- 5. Create oauth_states table for CSRF protection during OAuth flow
CREATE TABLE public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_key VARCHAR(50) NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  app_item_id UUID,  -- Optional: if triggered by app
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- RLS Policy - only service role should access this
CREATE POLICY "Service role access only"
  ON public.oauth_states FOR ALL
  USING (false);  -- Block all public access, use service role

-- 6. Create integration_usage_log table for auditing
CREATE TABLE public.integration_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_integration_id UUID REFERENCES public.user_integrations(id) ON DELETE SET NULL,
  workspace_integration_id UUID REFERENCES public.workspace_integrations(id) ON DELETE SET NULL,
  app_item_id UUID,
  provider_key VARCHAR(50) NOT NULL,
  operation TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  error_code TEXT,
  error_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integration_usage_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their integration logs"
  ON public.integration_usage_log FOR SELECT
  USING (
    user_integration_id IN (
      SELECT id FROM user_integrations WHERE user_id = auth.uid()
    ) OR
    workspace_integration_id IN (
      SELECT wi.id FROM workspace_integrations wi
      JOIN workspaces w ON w.id = wi.workspace_id
      WHERE w.owner_id = auth.uid() OR is_workspace_member(wi.workspace_id, auth.uid())
    )
  );

CREATE POLICY "Admins can view all integration logs"
  ON public.integration_usage_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 7. Add actor types for App Store items
INSERT INTO public.chat_actors (actor_type, name, description, allowed_functions, default_display_mode, is_system, is_enabled)
VALUES 
  ('app_tool', 'App Store Tool', 'Installed tool from App Store - single capability, no loop.', 
   ARRAY['submitRequest', 'processResponse'], 'silent', true, true),
  ('app_assistant', 'App Store Assistant', 'Installed assistant from App Store - reactive, can use tools.', 
   ARRAY['submitRequest', 'selectModel', 'processResponse', 'persistMessage'], 'minimal', true, true),
  ('app_agent', 'App Store Agent', 'Installed agent from App Store - autonomous with planning loop.', 
   ARRAY['submitRequest', 'selectModel', 'processResponse', 'persistMessage', 'determineActions'], 'ui', true, true)
ON CONFLICT (actor_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  allowed_functions = EXCLUDED.allowed_functions,
  is_enabled = EXCLUDED.is_enabled;

-- 8. Seed initial external providers
INSERT INTO public.external_providers (provider_key, name, description, category, auth_type, oauth_authorize_url, oauth_token_url, oauth_scopes, icon_url, is_enabled)
VALUES
  ('slack', 'Slack', 'Team communication and collaboration platform', 'communication', 'oauth2',
   'https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access',
   ARRAY['chat:write', 'users:read', 'channels:read', 'files:write'],
   'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg', true),
  
  ('google_drive', 'Google Drive', 'Cloud file storage and synchronization', 'storage', 'oauth2',
   'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token',
   ARRAY['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
   'https://cdn.worldvectorlogo.com/logos/google-drive.svg', true),
  
  ('notion', 'Notion', 'All-in-one workspace for notes, docs, and databases', 'productivity', 'oauth2',
   'https://api.notion.com/v1/oauth/authorize', 'https://api.notion.com/v1/oauth/token',
   ARRAY['read_content', 'insert_content', 'update_content'],
   'https://cdn.worldvectorlogo.com/logos/notion-logo-1.svg', true),
  
  ('hubspot', 'HubSpot', 'CRM and marketing automation platform', 'crm', 'oauth2',
   'https://app.hubspot.com/oauth/authorize', 'https://api.hubspot.com/oauth/v1/token',
   ARRAY['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read'],
   'https://cdn.worldvectorlogo.com/logos/hubspot.svg', true),
  
  ('github', 'GitHub', 'Code hosting and version control platform', 'development', 'oauth2',
   'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token',
   ARRAY['repo', 'user:email'],
   'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg', true),
  
  ('microsoft', 'Microsoft 365', 'Microsoft productivity suite including Teams, OneDrive, Outlook', 'productivity', 'oauth2',
   'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
   ARRAY['User.Read', 'Files.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite'],
   'https://cdn.worldvectorlogo.com/logos/microsoft-icon.svg', true)
ON CONFLICT (provider_key) DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX idx_user_integrations_user ON public.user_integrations(user_id);
CREATE INDEX idx_user_integrations_provider ON public.user_integrations(provider_key);
CREATE INDEX idx_user_integrations_status ON public.user_integrations(status);
CREATE INDEX idx_workspace_integrations_workspace ON public.workspace_integrations(workspace_id);
CREATE INDEX idx_workspace_integrations_provider ON public.workspace_integrations(provider_key);
CREATE INDEX idx_app_item_integrations_tool ON public.app_item_integrations(tool_installation_id);
CREATE INDEX idx_oauth_states_token ON public.oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires ON public.oauth_states(expires_at);
CREATE INDEX idx_integration_usage_log_created ON public.integration_usage_log(created_at DESC);

-- 10. Create function to clean up expired OAuth states
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

-- 11. Create trigger for updated_at timestamps
CREATE TRIGGER update_external_providers_updated_at
  BEFORE UPDATE ON public.external_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workspace_integrations_updated_at
  BEFORE UPDATE ON public.workspace_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();