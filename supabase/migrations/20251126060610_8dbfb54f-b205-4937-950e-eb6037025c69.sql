-- Create file_folders table for organizing files
CREATE TABLE file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_files table for file management
CREATE TABLE user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_folders
CREATE POLICY "Users can manage their own folders"
ON file_folders FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view folders in their workspaces"
ON file_folders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = file_folders.workspace_id
    AND (workspaces.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = file_folders.workspace_id
      AND workspace_members.user_id = auth.uid()
    ))
  )
);

-- RLS policies for user_files
CREATE POLICY "Users can manage their own files"
ON user_files FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view files in their workspaces"
ON user_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = user_files.workspace_id
    AND (workspaces.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = user_files.workspace_id
      AND workspace_members.user_id = auth.uid()
    ))
  )
);

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false);

-- Storage RLS policies
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add indexes for better query performance
CREATE INDEX idx_user_files_user_id ON user_files(user_id);
CREATE INDEX idx_user_files_workspace_id ON user_files(workspace_id);
CREATE INDEX idx_user_files_folder_id ON user_files(folder_id);
CREATE INDEX idx_file_folders_user_id ON file_folders(user_id);
CREATE INDEX idx_file_folders_workspace_id ON file_folders(workspace_id);
CREATE INDEX idx_file_folders_parent_id ON file_folders(parent_id);