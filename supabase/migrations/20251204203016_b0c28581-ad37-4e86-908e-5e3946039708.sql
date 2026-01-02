-- Add foreign key constraint from cosmo_debug_logs.user_id to profiles.id
ALTER TABLE cosmo_debug_logs 
ADD CONSTRAINT fk_cosmo_debug_logs_user 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from cosmo_debug_logs.workspace_id to workspaces.id
ALTER TABLE cosmo_debug_logs 
ADD CONSTRAINT fk_cosmo_debug_logs_workspace 
FOREIGN KEY (workspace_id) 
REFERENCES workspaces(id) 
ON DELETE SET NULL;