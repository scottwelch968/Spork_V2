-- Add user_id column to space_chat_messages for tracking message sender
ALTER TABLE space_chat_messages 
ADD COLUMN user_id uuid REFERENCES profiles(id);

-- Backfill existing user messages with the chat creator's user_id
UPDATE space_chat_messages scm
SET user_id = sc.user_id
FROM space_chats sc
WHERE scm.chat_id = sc.id AND scm.role = 'user';