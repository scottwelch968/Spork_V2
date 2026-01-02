-- Drop existing broken policy
DROP POLICY IF EXISTS "Access system or own projects" ON spork_projects;

-- Create fixed policy with both USING and WITH CHECK
CREATE POLICY "Access system or own projects" ON spork_projects
FOR ALL 
USING (
  -- For SELECT/UPDATE/DELETE: access system-owned (if admin) or own projects
  (is_system_owned = true AND has_role(auth.uid(), 'admin'::app_role)) 
  OR (auth.uid() = user_id)
)
WITH CHECK (
  -- For INSERT/UPDATE: admins can create system-owned, anyone can create their own
  (is_system_owned = true AND has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = user_id)
  OR (is_system_owned = false AND auth.uid() = user_id)
  OR (is_system_owned IS NULL AND auth.uid() = user_id)
);