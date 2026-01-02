-- Drop existing broken policy
DROP POLICY IF EXISTS "Access system or own projects" ON spork_projects;

-- System-owned projects are readable by ANY authenticated user
CREATE POLICY "View system-owned projects" ON spork_projects
FOR SELECT USING (is_system_owned = true AND is_active = true);

-- User-owned projects - users can manage their own
CREATE POLICY "Users manage own projects" ON spork_projects
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can manage system-owned projects (for inserts/updates/deletes)
CREATE POLICY "Admins manage system projects" ON spork_projects
FOR ALL USING (
  is_system_owned = true AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  is_system_owned = true AND has_role(auth.uid(), 'admin'::app_role)
);