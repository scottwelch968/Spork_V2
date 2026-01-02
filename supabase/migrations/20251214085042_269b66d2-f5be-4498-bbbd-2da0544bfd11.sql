-- Add support for personal (user-level) tool installations
-- Make workspace_id nullable and add user_id column

-- Step 1: Add user_id column
ALTER TABLE spork_tool_installations 
ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 2: Add install_context column to track context type
ALTER TABLE spork_tool_installations 
ADD COLUMN install_context VARCHAR(20) NOT NULL DEFAULT 'workspace';

-- Step 3: Make workspace_id nullable
ALTER TABLE spork_tool_installations 
ALTER COLUMN workspace_id DROP NOT NULL;

-- Step 4: Add constraint to ensure either user_id or workspace_id is set (not both, not neither)
ALTER TABLE spork_tool_installations 
ADD CONSTRAINT valid_install_context CHECK (
  (install_context = 'personal' AND user_id IS NOT NULL AND workspace_id IS NULL) OR
  (install_context = 'workspace' AND workspace_id IS NOT NULL AND user_id IS NULL)
);

-- Step 5: Update existing rows to have workspace install_context (already have workspace_id)
UPDATE spork_tool_installations 
SET install_context = 'workspace' 
WHERE workspace_id IS NOT NULL;

-- Step 6: Add RLS policy for personal installations
CREATE POLICY "Users can view their personal installations"
ON spork_tool_installations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can install tools to personal"
ON spork_tool_installations
FOR INSERT
WITH CHECK (
  (install_context = 'personal' AND user_id = auth.uid()) OR
  (install_context = 'workspace' AND EXISTS (
    SELECT 1 FROM workspaces w WHERE w.id = spork_tool_installations.workspace_id AND w.owner_id = auth.uid()
  ))
);

CREATE POLICY "Users can uninstall personal tools"
ON spork_tool_installations
FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Users can update personal installations"
ON spork_tool_installations
FOR UPDATE
USING (user_id = auth.uid());

-- Step 7: Create unique constraint for personal installations (one install per user per tool)
CREATE UNIQUE INDEX idx_unique_personal_installation 
ON spork_tool_installations(tool_id, user_id) 
WHERE install_context = 'personal';