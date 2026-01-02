-- Drop existing RLS policies on knowledge_base
DROP POLICY IF EXISTS "Users can delete their documents" ON knowledge_base;
DROP POLICY IF EXISTS "Users can update their documents" ON knowledge_base;
DROP POLICY IF EXISTS "Users can upload documents" ON knowledge_base;
DROP POLICY IF EXISTS "Users can view their own documents" ON knowledge_base;

-- Create workspace-based RLS policies
CREATE POLICY "Workspace members can view knowledge base"
ON knowledge_base FOR SELECT
TO authenticated
USING (
  is_workspace_member(workspace_id, auth.uid()) OR
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace members can upload to knowledge base"
ON knowledge_base FOR INSERT
TO authenticated
WITH CHECK (
  is_workspace_member(workspace_id, auth.uid()) OR
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace members can update knowledge base"
ON knowledge_base FOR UPDATE
TO authenticated
USING (
  is_workspace_member(workspace_id, auth.uid()) OR
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);

CREATE POLICY "Workspace members can delete from knowledge base"
ON knowledge_base FOR DELETE
TO authenticated
USING (
  is_workspace_member(workspace_id, auth.uid()) OR
  EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_id AND owner_id = auth.uid())
);