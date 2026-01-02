-- Add RLS policy allowing all authenticated users to read system settings
CREATE POLICY "Authenticated users can read system settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);