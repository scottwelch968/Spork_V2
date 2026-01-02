-- Phase 1: Lock down system_user_sessions table
-- Drop the overly permissive policy that allows any access
DROP POLICY IF EXISTS "Service role can manage system_user_sessions" ON public.system_user_sessions;

-- Create restrictive policy that blocks all access for authenticated and anonymous users
-- Service role bypasses RLS entirely, so edge functions will still work
CREATE POLICY "Block all public access to system_user_sessions" 
ON public.system_user_sessions 
FOR ALL 
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- Phase 2: Create profiles_safe view without email column
-- This provides true database-level protection for collaborator lookups
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  account_status,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;