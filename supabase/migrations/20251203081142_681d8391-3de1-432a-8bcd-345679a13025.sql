-- Drop RLS policies that depend on owner_type and workspace_id columns
DROP POLICY IF EXISTS "Users can manage their own user files" ON public.user_files;
DROP POLICY IF EXISTS "Workspace members can view workspace files" ON public.user_files;
DROP POLICY IF EXISTS "Workspace members can manage workspace files" ON public.user_files;

-- Now remove the columns from user_files (now only personal files)
ALTER TABLE public.user_files DROP COLUMN IF EXISTS owner_type;
ALTER TABLE public.user_files DROP COLUMN IF EXISTS workspace_id;

-- Create simpler RLS policy for user_files (personal files only)
CREATE POLICY "Users can manage their own files"
ON public.user_files
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);