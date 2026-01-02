-- Add Cosmo AI routing metadata columns to messages table (personal chats)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS cosmo_selected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detected_category TEXT;

-- Add Cosmo AI routing metadata columns to space_chat_messages table (workspace chats)
ALTER TABLE space_chat_messages 
ADD COLUMN IF NOT EXISTS cosmo_selected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detected_category TEXT;

-- Add index for efficient filtering by cosmo_selected
CREATE INDEX IF NOT EXISTS idx_messages_cosmo_selected ON messages(cosmo_selected) WHERE cosmo_selected = true;
CREATE INDEX IF NOT EXISTS idx_space_chat_messages_cosmo_selected ON space_chat_messages(cosmo_selected) WHERE cosmo_selected = true;