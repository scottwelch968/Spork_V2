-- Phase 1: Fix RLS Infinite Recursion and Add Admin Role

-- Create security definer function to check workspace membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid AND user_id = user_uuid
  );
$$;

-- Drop the problematic workspace_members SELECT policy that causes recursion
DROP POLICY IF EXISTS "Users can view workspace members" ON public.workspace_members;

-- Create new workspace_members SELECT policy using the security definer function
CREATE POLICY "Users can view workspace members" ON public.workspace_members
FOR SELECT USING (
  -- User is the owner of the workspace
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = workspace_members.workspace_id 
    AND workspaces.owner_id = auth.uid()
  )
  OR
  -- User is a member of the workspace (using security definer function)
  public.is_workspace_member(workspace_members.workspace_id, auth.uid())
);

-- Grant admin role to paulscottwelch@gmail.com
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '3f647792-6265-4ed8-91c4-6e8841a0caf2';

-- If the user doesn't have a role entry yet, insert it
INSERT INTO public.user_roles (user_id, role)
VALUES ('3f647792-6265-4ed8-91c4-6e8841a0caf2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;