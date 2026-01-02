-- Add last_used_at column to personal prompts table
ALTER TABLE prompts 
ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;

-- Add last_used_at column to workspace prompts table
ALTER TABLE space_prompts 
ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;