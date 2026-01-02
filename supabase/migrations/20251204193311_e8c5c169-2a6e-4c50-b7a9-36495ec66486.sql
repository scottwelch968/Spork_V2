-- Fix search_path for trigger functions
CREATE OR REPLACE FUNCTION prevent_default_workspace_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent renaming default workspace
  IF OLD.is_default = true AND NEW.name != OLD.name THEN
    RAISE EXCEPTION 'Cannot rename the default workspace';
  END IF;
  
  -- Prevent archiving default workspace
  IF OLD.is_default = true AND NEW.is_archived = true THEN
    RAISE EXCEPTION 'Cannot archive the default workspace';
  END IF;
  
  -- Prevent changing is_default flag
  IF OLD.is_default = true AND NEW.is_default = false THEN
    RAISE EXCEPTION 'Cannot remove default status from the default workspace';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_default_workspace_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_default = true THEN
    RAISE EXCEPTION 'Cannot delete the default workspace';
  END IF;
  RETURN OLD;
END;
$$;