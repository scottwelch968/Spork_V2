-- Allow workspace members and owners to log activity
CREATE POLICY "Members can log workspace activity"
ON public.workspace_activity
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- User is workspace owner
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = workspace_id 
      AND workspaces.owner_id = auth.uid()
    )
    OR
    -- User is workspace member
    EXISTS (
      SELECT 1 
      FROM public.workspace_members 
      WHERE workspace_members.workspace_id = workspace_activity.workspace_id 
      AND workspace_members.user_id = auth.uid()
    )
  )
);
