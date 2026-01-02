-- Create cosmo_cost_tracking table for aggregated historical cost data
CREATE TABLE public.cosmo_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  
  -- Request metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  
  -- Token metrics
  total_prompt_tokens BIGINT DEFAULT 0,
  total_completion_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  
  -- Cost metrics (in USD, 6 decimal precision)
  actual_cost DECIMAL(12,6) DEFAULT 0,
  theoretical_cost DECIMAL(12,6) DEFAULT 0,
  
  -- Savings breakdown
  batching_savings DECIMAL(12,6) DEFAULT 0,
  routing_savings DECIMAL(12,6) DEFAULT 0,
  context_reuse_savings DECIMAL(12,6) DEFAULT 0,
  
  -- Batch metrics
  batched_requests INTEGER DEFAULT 0,
  api_calls_saved INTEGER DEFAULT 0,
  batch_tokens_saved BIGINT DEFAULT 0,
  
  -- Model breakdown (JSONB for flexibility)
  model_costs JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(period_start, period_type)
);

-- Add indexes for efficient queries
CREATE INDEX idx_cost_tracking_period ON public.cosmo_cost_tracking(period_type, period_start DESC);
CREATE INDEX idx_cost_tracking_range ON public.cosmo_cost_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE public.cosmo_cost_tracking ENABLE ROW LEVEL SECURITY;

-- Admin-only access (via service role key in edge functions)
CREATE POLICY "Service role full access to cost tracking"
ON public.cosmo_cost_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_cosmo_cost_tracking_updated_at
BEFORE UPDATE ON public.cosmo_cost_tracking
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();