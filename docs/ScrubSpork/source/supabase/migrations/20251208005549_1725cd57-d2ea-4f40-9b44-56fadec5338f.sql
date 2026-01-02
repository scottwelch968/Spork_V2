-- Add optional CodeSandbox API key column to spork_projects
ALTER TABLE spork_projects ADD COLUMN IF NOT EXISTS codesandbox_api_key TEXT;