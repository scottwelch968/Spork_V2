-- Extend workspaces table with new columns
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS ai_instructions TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS compliance_rule TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS color_code VARCHAR(7);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS file_quota_mb INTEGER;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();

-- Create space_folders table (personal folder organization)
CREATE TABLE IF NOT EXISTS space_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_code VARCHAR(7),
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on space_folders
ALTER TABLE space_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for space_folders
CREATE POLICY "Users can manage their own folders"
ON space_folders
FOR ALL
USING (auth.uid() = user_id);

-- Create user_space_assignments table
CREATE TABLE IF NOT EXISTS user_space_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES space_folders(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, space_id)
);

-- Enable RLS on user_space_assignments
ALTER TABLE user_space_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_space_assignments
CREATE POLICY "Users can manage their own space assignments"
ON user_space_assignments
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at on space_folders
CREATE TRIGGER handle_space_folders_updated_at
  BEFORE UPDATE ON space_folders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();