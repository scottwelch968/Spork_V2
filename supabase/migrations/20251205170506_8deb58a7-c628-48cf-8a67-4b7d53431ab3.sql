
-- Create enum for project types
CREATE TYPE public.spork_project_type AS ENUM ('tool', 'sandbox', 'general');

-- Create enum for tool status
CREATE TYPE public.spork_tool_status AS ENUM ('draft', 'review', 'published', 'deprecated');

-- Add project_type to spork_projects
ALTER TABLE public.spork_projects 
ADD COLUMN project_type public.spork_project_type DEFAULT 'general',
ADD COLUMN source_tool_id uuid REFERENCES public.spork_projects(id) ON DELETE SET NULL;

-- Create spork_tools table - Tool registry
CREATE TABLE public.spork_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.spork_projects(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  description text,
  icon varchar(50),
  category varchar(50) DEFAULT 'utility',
  tags text[] DEFAULT '{}',
  permissions jsonb DEFAULT '[]'::jsonb,
  config_schema jsonb DEFAULT '{}'::jsonb,
  current_version varchar(20) DEFAULT '1.0.0',
  status public.spork_tool_status DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  install_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create spork_tool_files table - Source files for each tool
CREATE TABLE public.spork_tool_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.spork_tools(id) ON DELETE CASCADE,
  file_path varchar(500) NOT NULL,
  file_name varchar(255) NOT NULL,
  content text NOT NULL DEFAULT '',
  file_type varchar(50),
  is_entry_point boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, file_path)
);

-- Create spork_tool_versions table - Version history
CREATE TABLE public.spork_tool_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.spork_tools(id) ON DELETE CASCADE,
  version varchar(20) NOT NULL,
  changelog text,
  files_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  manifest_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, version)
);

-- Create spork_tool_installations table - Per-workspace installations
CREATE TABLE public.spork_tool_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.spork_tools(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  installed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  installed_version varchar(20) NOT NULL,
  config_values jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean DEFAULT true,
  installed_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tool_id, workspace_id)
);

-- Create indexes for performance
CREATE INDEX idx_spork_tools_creator ON public.spork_tools(creator_id);
CREATE INDEX idx_spork_tools_status ON public.spork_tools(status);
CREATE INDEX idx_spork_tools_category ON public.spork_tools(category);
CREATE INDEX idx_spork_tool_files_tool ON public.spork_tool_files(tool_id);
CREATE INDEX idx_spork_tool_versions_tool ON public.spork_tool_versions(tool_id);
CREATE INDEX idx_spork_tool_installations_workspace ON public.spork_tool_installations(workspace_id);
CREATE INDEX idx_spork_tool_installations_tool ON public.spork_tool_installations(tool_id);

-- Enable RLS on all tables
ALTER TABLE public.spork_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spork_tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spork_tool_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spork_tool_installations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spork_tools

-- Anyone can view published tools
CREATE POLICY "Anyone can view published tools"
ON public.spork_tools FOR SELECT
USING (status = 'published');

-- Creators can view their own tools (any status)
CREATE POLICY "Creators can view own tools"
ON public.spork_tools FOR SELECT
USING (creator_id = auth.uid());

-- Admins can view all tools
CREATE POLICY "Admins can view all tools"
ON public.spork_tools FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Creators can insert their own tools
CREATE POLICY "Users can create tools"
ON public.spork_tools FOR INSERT
WITH CHECK (creator_id = auth.uid());

-- Creators can update their own tools
CREATE POLICY "Creators can update own tools"
ON public.spork_tools FOR UPDATE
USING (creator_id = auth.uid());

-- Admins can update any tool
CREATE POLICY "Admins can update any tool"
ON public.spork_tools FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Creators can delete their own draft tools
CREATE POLICY "Creators can delete own draft tools"
ON public.spork_tools FOR DELETE
USING (creator_id = auth.uid() AND status = 'draft');

-- Admins can delete any tool
CREATE POLICY "Admins can delete any tool"
ON public.spork_tools FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for spork_tool_files

-- Anyone can view files of published tools
CREATE POLICY "Anyone can view published tool files"
ON public.spork_tool_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_files.tool_id AND status = 'published'
));

-- Creators can view files of their tools
CREATE POLICY "Creators can view own tool files"
ON public.spork_tool_files FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_files.tool_id AND creator_id = auth.uid()
));

-- Creators can manage files of their tools
CREATE POLICY "Creators can insert tool files"
ON public.spork_tool_files FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_files.tool_id AND creator_id = auth.uid()
));

CREATE POLICY "Creators can update tool files"
ON public.spork_tool_files FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_files.tool_id AND creator_id = auth.uid()
));

CREATE POLICY "Creators can delete tool files"
ON public.spork_tool_files FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_files.tool_id AND creator_id = auth.uid()
));

-- RLS Policies for spork_tool_versions

-- Anyone can view versions of published tools
CREATE POLICY "Anyone can view published tool versions"
ON public.spork_tool_versions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_versions.tool_id AND status = 'published'
));

-- Creators can view versions of their tools
CREATE POLICY "Creators can view own tool versions"
ON public.spork_tool_versions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_versions.tool_id AND creator_id = auth.uid()
));

-- Creators can create versions
CREATE POLICY "Creators can create tool versions"
ON public.spork_tool_versions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.spork_tools 
  WHERE id = spork_tool_versions.tool_id AND creator_id = auth.uid()
));

-- RLS Policies for spork_tool_installations

-- Workspace members can view their workspace's installations
CREATE POLICY "Workspace members can view installations"
ON public.spork_tool_installations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = spork_tool_installations.workspace_id 
    AND (w.owner_id = auth.uid() OR is_workspace_member(w.id, auth.uid()))
  )
);

-- Workspace owners can install tools
CREATE POLICY "Workspace owners can install tools"
ON public.spork_tool_installations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = spork_tool_installations.workspace_id AND w.owner_id = auth.uid()
  )
  AND installed_by = auth.uid()
);

-- Workspace owners can update installations
CREATE POLICY "Workspace owners can update installations"
ON public.spork_tool_installations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = spork_tool_installations.workspace_id AND w.owner_id = auth.uid()
  )
);

-- Workspace owners can uninstall tools
CREATE POLICY "Workspace owners can uninstall tools"
ON public.spork_tool_installations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = spork_tool_installations.workspace_id AND w.owner_id = auth.uid()
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_spork_tools_updated_at
  BEFORE UPDATE ON public.spork_tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_spork_tool_files_updated_at
  BEFORE UPDATE ON public.spork_tool_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_spork_tool_installations_updated_at
  BEFORE UPDATE ON public.spork_tool_installations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
