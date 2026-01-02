-- Drop the existing problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;

-- Create new policy using the SECURITY DEFINER function to break the circular dependency
CREATE POLICY "Users can view workspaces they belong to" 
ON public.workspaces FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR is_workspace_member(id, auth.uid())
);