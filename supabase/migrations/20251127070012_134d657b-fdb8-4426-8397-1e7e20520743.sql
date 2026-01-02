-- Fix workspace_activity.user_id foreign key to reference profiles instead of auth.users
ALTER TABLE public.workspace_activity
DROP CONSTRAINT IF EXISTS workspace_activity_user_id_fkey;

ALTER TABLE public.workspace_activity
ADD CONSTRAINT workspace_activity_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;