-- Add GitHub-first storage columns to spork_projects
ALTER TABLE spork_projects 
  ADD COLUMN IF NOT EXISTS is_system_sandbox BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_branch TEXT DEFAULT 'main';

-- Create index for faster sandbox lookup
CREATE INDEX IF NOT EXISTS idx_spork_projects_sandbox ON spork_projects(user_id, is_system_sandbox) WHERE is_system_sandbox = true;

-- Add RLS policy to prevent deleting sandbox projects
CREATE POLICY "Cannot delete sandbox projects" ON spork_projects
  FOR DELETE USING (is_system_sandbox = false OR is_system_sandbox IS NULL);