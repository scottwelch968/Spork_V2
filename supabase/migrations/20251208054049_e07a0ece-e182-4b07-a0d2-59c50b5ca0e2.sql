-- Create system_role enum for admin roles
CREATE TYPE public.system_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');

-- Create system_users table (completely separate from auth.users)
CREATE TABLE public.system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  
  -- Future 2FA columns (planned)
  totp_secret TEXT,
  totp_enabled BOOLEAN DEFAULT false,
  backup_codes JSONB,
  
  -- Optional link to web user for super user access
  linked_web_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create system_user_roles table
CREATE TABLE public.system_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id UUID REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  role system_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (system_user_id, role)
);

-- Create system_user_permissions table (for future granular access)
CREATE TABLE public.system_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id UUID REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  permission_key TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
  UNIQUE (system_user_id, permission_key)
);

-- Create system_user_sessions table
CREATE TABLE public.system_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id UUID REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Create system_audit_log table
CREATE TABLE public.system_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id UUID REFERENCES public.system_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all system tables
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role can access these tables (edge functions)
CREATE POLICY "Service role can manage system_users"
ON public.system_users FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage system_user_roles"
ON public.system_user_roles FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage system_user_permissions"
ON public.system_user_permissions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage system_user_sessions"
ON public.system_user_sessions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage system_audit_log"
ON public.system_audit_log FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger for system_users
CREATE TRIGGER update_system_users_updated_at
BEFORE UPDATE ON public.system_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add index for session lookups
CREATE INDEX idx_system_sessions_token ON public.system_user_sessions(session_token);
CREATE INDEX idx_system_sessions_user ON public.system_user_sessions(system_user_id);
CREATE INDEX idx_system_audit_user ON public.system_audit_log(system_user_id);
CREATE INDEX idx_system_audit_action ON public.system_audit_log(action);