-- Fix the SECURITY DEFINER warning by recreating the view with SECURITY INVOKER
-- This ensures RLS policies of the querying user are respected
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  account_status,
  created_at,
  updated_at
FROM public.profiles;

-- Re-grant access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;