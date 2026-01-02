-- Create sync_logs table for audit trail
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB,
  sql_executed TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy (using system_users check pattern)
CREATE POLICY "Only admins can view sync logs"
ON public.sync_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  )
);

CREATE POLICY "Only admins can insert sync logs"
ON public.sync_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND is_active = true
  )
);

-- Add index for faster queries
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_sync_type ON public.sync_logs(sync_type);