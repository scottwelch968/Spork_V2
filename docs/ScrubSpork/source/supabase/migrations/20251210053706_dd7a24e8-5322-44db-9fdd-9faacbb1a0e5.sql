-- Create test_runs table to store CI/CD test results
CREATE TABLE test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  branch TEXT,
  commit_sha TEXT,
  commit_message TEXT,
  triggered_by TEXT DEFAULT 'ci',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  total_tests INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  coverage_statements NUMERIC(5,2),
  coverage_branches NUMERIC(5,2),
  coverage_functions NUMERIC(5,2),
  coverage_lines NUMERIC(5,2),
  failed_tests JSONB DEFAULT '[]',
  coverage_details JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_test_runs_created_at ON test_runs(created_at DESC);
CREATE INDEX idx_test_runs_branch ON test_runs(branch);
CREATE INDEX idx_test_runs_status ON test_runs(status);

-- Enable RLS (service role key bypasses for edge functions)
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage test runs"
  ON test_runs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));