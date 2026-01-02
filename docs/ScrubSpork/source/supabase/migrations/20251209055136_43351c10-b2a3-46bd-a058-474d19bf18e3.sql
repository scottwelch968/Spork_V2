-- Add DELETE policy for workspace_activity
CREATE POLICY "Users can delete their own activity records"
ON public.workspace_activity
FOR DELETE
USING (auth.uid() = user_id);