-- Add foreign key from space_chats.user_id to profiles.id for profile lookups
ALTER TABLE space_chats 
ADD CONSTRAINT space_chats_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id);