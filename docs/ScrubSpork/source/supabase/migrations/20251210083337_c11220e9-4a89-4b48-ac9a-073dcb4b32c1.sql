-- Drop the overly permissive policy that allows any access
DROP POLICY IF EXISTS "Service role can manage system_users" ON public.system_users;

-- Create restrictive policy that blocks all access for authenticated and anonymous users
-- Service role bypasses RLS entirely, so edge functions will still work
CREATE POLICY "Block all public access to system_users" 
ON public.system_users 
FOR ALL 
TO authenticated, anon
USING (false)
WITH CHECK (false);