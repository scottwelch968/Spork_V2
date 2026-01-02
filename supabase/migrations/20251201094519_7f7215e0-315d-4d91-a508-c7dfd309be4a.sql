-- Update storage policies for knowledge-base bucket to allow workspace members
DROP POLICY IF EXISTS "Workspace members can upload to knowledge-base" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can view knowledge-base files" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete from knowledge-base" ON storage.objects;

-- Allow workspace owners and members to upload
CREATE POLICY "Workspace members can upload to knowledge-base"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  (
    -- Check if user owns the workspace (folder name is workspace_id)
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    )
    OR
    -- Check if user is a member of the workspace
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  )
);

-- Allow workspace owners and members to view files
CREATE POLICY "Workspace members can view knowledge-base files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  )
);

-- Allow workspace owners and members to delete files  
CREATE POLICY "Workspace members can delete from knowledge-base"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'knowledge-base' AND
  (
    EXISTS (
      SELECT 1 FROM workspaces 
      WHERE id::text = (storage.foldername(name))[1] 
      AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_id::text = (storage.foldername(name))[1] 
      AND user_id = auth.uid()
    )
  )
);