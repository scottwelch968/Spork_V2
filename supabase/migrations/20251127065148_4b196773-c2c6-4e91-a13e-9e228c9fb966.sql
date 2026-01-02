-- Fix RLS policy on workspace_activity so owners and members can view activity

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Members can view workspace activity" ON public.workspace_activity;

-- Create new SELECT policy allowing both workspace owners and members to see activity
CREATE POLICY "Members and owners can view workspace activity"
ON public.workspace_activity
FOR SELECT
USING (
  -- Workspace owner can see activity
  EXISTS (
    SELECT 1 FROM public.workspaces 
    WHERE workspaces.id = workspace_activity.workspace_id 
      AND workspaces.owner_id = auth.uid()
  )
  OR
  -- Workspace members can see activity
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = workspace_activity.workspace_id 
      AND workspace_members.user_id = auth.uid()
  )
);