-- Add system ownership fields to spork_projects
ALTER TABLE spork_projects 
  ADD COLUMN IF NOT EXISTS is_system_owned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_system_user uuid REFERENCES system_users(id);

-- Make existing sandboxes system-owned
UPDATE spork_projects 
SET is_system_owned = true 
WHERE is_system_sandbox = true;

-- Drop existing RLS policies on spork_projects
DROP POLICY IF EXISTS "Users can view their own projects" ON spork_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON spork_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON spork_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON spork_projects;
DROP POLICY IF EXISTS "Users can manage their own projects" ON spork_projects;
DROP POLICY IF EXISTS "Admins can manage system projects" ON spork_projects;

-- New RLS: Admins can access system-owned projects, users can access their own
CREATE POLICY "Access system or own projects" ON spork_projects
FOR ALL USING (
  (is_system_owned = true AND has_role(auth.uid(), 'admin'::app_role))
  OR
  (auth.uid() = user_id)
);

-- Drop existing user-specific RLS policies on spork_tools
DROP POLICY IF EXISTS "Creators can update own tools" ON spork_tools;
DROP POLICY IF EXISTS "Creators can delete own draft tools" ON spork_tools;
DROP POLICY IF EXISTS "Creators can view own tools" ON spork_tools;
DROP POLICY IF EXISTS "Anyone can view published tools" ON spork_tools;
DROP POLICY IF EXISTS "Admins can manage all tools" ON spork_tools;

-- New RLS: Any admin can manage any tool (system-owned resources)
CREATE POLICY "Admins can manage all tools" ON spork_tools
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep public view for published tools
CREATE POLICY "Anyone can view published tools" ON spork_tools
FOR SELECT USING (status = 'published');

-- Same for spork_tool_files - admins can manage all
DROP POLICY IF EXISTS "Creators can manage tool files" ON spork_tool_files;
DROP POLICY IF EXISTS "Admins can manage all tool files" ON spork_tool_files;

CREATE POLICY "Admins can manage all tool files" ON spork_tool_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM spork_tools 
    WHERE spork_tools.id = spork_tool_files.tool_id 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);