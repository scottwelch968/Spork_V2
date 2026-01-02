-- Drop ALL policies on workspace_members
DROP POLICY IF EXISTS "Admins can delete members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Members can remove themselves" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;

-- Drop ALL policies on workspace_invitations
DROP POLICY IF EXISTS "Anyone can view their own invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Workspace admins can manage invitations" ON workspace_invitations;

-- Migrate existing admin/viewer roles to member
UPDATE workspace_members SET role = 'member' WHERE role IN ('admin', 'viewer');
UPDATE workspace_invitations SET role = 'member' WHERE role IN ('admin', 'viewer');

-- Recreate enum with only 2 values
ALTER TYPE workspace_role RENAME TO workspace_role_old;
CREATE TYPE workspace_role AS ENUM ('owner', 'member');

-- Update columns to use new enum
ALTER TABLE workspace_members 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE workspace_role USING role::text::workspace_role,
  ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE workspace_invitations 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE workspace_role USING role::text::workspace_role,
  ALTER COLUMN role SET DEFAULT 'member';

DROP TYPE workspace_role_old;

-- Recreate RLS policies for workspace_members (simplified: only owner manages, members can view)
CREATE POLICY "Users can view workspace members"
ON workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id
    AND (w.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Workspace owners can manage members"
ON workspace_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_members.workspace_id
    AND w.owner_id = auth.uid()
  )
);

CREATE POLICY "Members can remove themselves"
ON workspace_members
FOR DELETE
USING (user_id = auth.uid());

-- Recreate RLS policies for workspace_invitations
CREATE POLICY "Workspace owners can manage invitations"
ON workspace_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_invitations.workspace_id
    AND w.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view their own invitations"
ON workspace_invitations
FOR SELECT
USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);