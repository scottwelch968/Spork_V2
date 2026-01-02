-- Create workspace_files table for workspace-specific file storage
CREATE TABLE public.workspace_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;

-- Workspace members can view files
CREATE POLICY "Workspace members can view files"
ON public.workspace_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_files.workspace_id
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_files.workspace_id
      AND wm.user_id = auth.uid()
    ))
  )
);

-- Workspace members can upload files
CREATE POLICY "Workspace members can upload files"
ON public.workspace_files FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_files.workspace_id
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_files.workspace_id
      AND wm.user_id = auth.uid()
    ))
  )
);

-- Users can update their own files
CREATE POLICY "Users can update their uploaded files"
ON public.workspace_files FOR UPDATE
USING (uploaded_by = auth.uid());

-- Workspace owners can delete any file, uploaders can delete their own
CREATE POLICY "Owners and uploaders can delete files"
ON public.workspace_files FOR DELETE
USING (
  uploaded_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_files.workspace_id
    AND w.owner_id = auth.uid()
  )
);