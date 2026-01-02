-- Create space_personas table
CREATE TABLE space_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon VARCHAR(50),
  created_by UUID REFERENCES auth.users(id),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(space_id, name)
);

-- Create space_prompts table
CREATE TABLE space_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create space_chats table
CREATE TABLE space_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) DEFAULT 'New Chat',
  persona_id UUID REFERENCES space_personas(id),
  model VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create space_chat_messages table
CREATE TABLE space_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES space_chats(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to workspaces table
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS compliance_rule TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- RLS policies for space_personas
ALTER TABLE space_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personas in their spaces"
  ON space_personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_personas.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_personas.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Space members can create personas"
  ON space_personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_personas.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_personas.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Creators and owners can update personas"
  ON space_personas FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_personas.space_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Creators and owners can delete personas"
  ON space_personas FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_personas.space_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS policies for space_prompts
ALTER TABLE space_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view prompts in their spaces"
  ON space_prompts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_prompts.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_prompts.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Space members can create prompts"
  ON space_prompts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_prompts.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_prompts.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Creators and owners can update prompts"
  ON space_prompts FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_prompts.space_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Creators and owners can delete prompts"
  ON space_prompts FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_prompts.space_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS policies for space_chats
ALTER TABLE space_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chats in their spaces"
  ON space_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_chats.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_chats.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Space members can create chats"
  ON space_chats FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_chats.space_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_chats.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Creators can update their chats"
  ON space_chats FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Creators and space owners can delete chats"
  ON space_chats FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = space_chats.space_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- RLS policies for space_chat_messages
ALTER TABLE space_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in accessible chats"
  ON space_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM space_chats
      JOIN workspaces ON workspaces.id = space_chats.space_id
      WHERE space_chats.id = space_chat_messages.chat_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_chats.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Space members can create messages in their chats"
  ON space_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_chats
      JOIN workspaces ON workspaces.id = space_chats.space_id
      WHERE space_chats.id = space_chat_messages.chat_id
      AND (
        workspaces.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = space_chats.space_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_space_personas_updated_at
  BEFORE UPDATE ON space_personas
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_space_prompts_updated_at
  BEFORE UPDATE ON space_prompts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_space_chats_updated_at
  BEFORE UPDATE ON space_chats
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();