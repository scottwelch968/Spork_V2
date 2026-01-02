-- Fix infinite recursion in workspace_members and workspaces RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;

-- Recreate workspace_members policy with correct logic
CREATE POLICY "Users can view workspace members"
ON workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM workspaces
    WHERE workspaces.id = workspace_members.workspace_id
    AND workspaces.owner_id = auth.uid()
  )
);

-- Recreate workspaces policy with correct logic
CREATE POLICY "Users can view workspaces they belong to"
ON workspaces
FOR SELECT
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
    AND workspace_members.user_id = auth.uid()
  )
);