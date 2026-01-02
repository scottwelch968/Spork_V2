-- Add RLS policy allowing all authenticated users to read active AI models
CREATE POLICY "Authenticated users can read active AI models"
ON public.ai_models
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);