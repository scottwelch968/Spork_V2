-- Create spork_projects table for multi-project support
CREATE TABLE public.spork_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Project Info
  name TEXT NOT NULL,
  description TEXT,
  ai_instructions TEXT,
  
  -- GitHub Configuration
  github_repo_url TEXT,
  github_branch TEXT DEFAULT 'main',
  github_token TEXT,
  
  -- Supabase Configuration
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_service_role_key TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spork_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own projects"
ON public.spork_projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_spork_projects_updated_at
BEFORE UPDATE ON public.spork_projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();