-- Add selected_persona_id column to workspaces table for persistent workspace persona selection
ALTER TABLE public.workspaces 
ADD COLUMN selected_persona_id uuid REFERENCES space_personas(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.workspaces.selected_persona_id IS 
  'The currently selected persona for this workspace. Falls back to default persona if NULL.';