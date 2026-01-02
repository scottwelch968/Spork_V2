-- Fix spork_projects RLS: Remove overly permissive policy that exposes system projects with secrets
DROP POLICY IF EXISTS "View system-owned projects" ON public.spork_projects;

-- Add restrictive policy: Only admins can view system-owned projects
CREATE POLICY "Admins can view system projects" 
ON public.spork_projects 
FOR SELECT 
USING (
  ((is_system_owned = true) AND has_role(auth.uid(), 'admin'::app_role))
  OR (auth.uid() = user_id)
);