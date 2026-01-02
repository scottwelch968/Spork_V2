-- Create table to store cleanup job results for admin visibility
CREATE TABLE IF NOT EXISTS cleanup_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  run_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  
  -- Metrics for expired images cleanup
  deleted_count INTEGER DEFAULT 0,
  updated_messages INTEGER DEFAULT 0,
  
  -- Metrics for orphaned files cleanup
  total_records_checked INTEGER DEFAULT 0,
  orphan_count INTEGER DEFAULT 0,
  
  -- Details and errors
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  -- Execution time tracking
  duration_ms INTEGER
);

-- Add indexes for querying
CREATE INDEX idx_cleanup_job_results_job_name ON cleanup_job_results(job_name);
CREATE INDEX idx_cleanup_job_results_run_at ON cleanup_job_results(run_at DESC);

-- Enable RLS
ALTER TABLE cleanup_job_results ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage cleanup results"
  ON cleanup_job_results
  FOR ALL
  USING (true)
  WITH CHECK (true);