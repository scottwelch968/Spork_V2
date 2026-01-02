-- Add RLS policy to allow users to view profiles of workspace collaborators
CREATE POLICY "Users can view profiles of workspace collaborators"
ON public.profiles 
FOR SELECT
USING (
  -- Can always see own profile
  auth.uid() = id  
  OR
  -- Can see profiles of people in workspaces you own
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workspace_activity wa 
      WHERE wa.workspace_id = w.id AND wa.user_id = profiles.id
    )
  )
  OR
  -- Can see profiles of people in workspaces you're a member of
  EXISTS (
    SELECT 1 FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
  )
);