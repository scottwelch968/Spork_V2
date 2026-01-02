-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;

-- Recreate with security definer function to avoid recursion
CREATE POLICY "Users can view workspace members"
ON workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id
    AND w.owner_id = auth.uid()
  )
  OR is_workspace_member(workspace_members.workspace_id, auth.uid())
);