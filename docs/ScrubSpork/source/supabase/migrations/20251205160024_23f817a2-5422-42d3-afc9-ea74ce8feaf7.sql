-- Create table for Spork project files
CREATE TABLE public.spork_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.spork_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, file_path)
);

-- Enable RLS
ALTER TABLE public.spork_project_files ENABLE ROW LEVEL SECURITY;

-- Users can manage files in their own projects
CREATE POLICY "Users can manage their project files"
ON public.spork_project_files
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.spork_projects
    WHERE spork_projects.id = spork_project_files.project_id
    AND spork_projects.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.spork_projects
    WHERE spork_projects.id = spork_project_files.project_id
    AND spork_projects.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_spork_project_files_updated_at
BEFORE UPDATE ON public.spork_project_files
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();