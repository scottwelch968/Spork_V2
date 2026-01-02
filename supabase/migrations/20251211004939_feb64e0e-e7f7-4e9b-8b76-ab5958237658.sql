-- Create scheduled_jobs table to store job metadata
CREATE TABLE IF NOT EXISTS public.scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL UNIQUE,
  description TEXT,
  target_function TEXT NOT NULL,
  schedule_expression TEXT NOT NULL,
  schedule_description TEXT,
  request_body JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_success BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage scheduled jobs" ON public.scheduled_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role access for edge functions
CREATE POLICY "Service role can manage scheduled jobs" ON public.scheduled_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- Seed existing cron jobs
INSERT INTO public.scheduled_jobs (job_name, description, target_function, schedule_expression, schedule_description, is_active) VALUES
  ('sync-openrouter-models', 'Syncs AI models from OpenRouter API, updating pricing and availability for all whitelisted models', 'sync-openrouter-models', '0 7 * * *', 'Daily at 7:00 AM UTC', true),
  ('cleanup-expired-images', 'Deletes temporary AI-generated images older than 72 hours and updates message references to placeholder', 'cleanup-expired-images', '0 3 * * *', 'Daily at 3:00 AM UTC', true),
  ('cleanup-orphaned-files', 'Detects database file records without corresponding storage files (orphan detection mode)', 'cleanup-orphaned-files', '0 4 * * *', 'Daily at 4:00 AM UTC', true)
ON CONFLICT (job_name) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_jobs_updated_at
  BEFORE UPDATE ON public.scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();