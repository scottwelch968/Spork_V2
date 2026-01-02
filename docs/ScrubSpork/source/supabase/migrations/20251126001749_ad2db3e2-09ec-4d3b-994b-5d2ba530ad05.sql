-- Create pricing_tiers table for subscription quotas
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name subscription_tier UNIQUE NOT NULL,
  monthly_chat_tokens INTEGER DEFAULT 100000,
  monthly_image_generations INTEGER DEFAULT 10,
  monthly_video_generations INTEGER DEFAULT 2,
  monthly_document_parses INTEGER DEFAULT 20,
  monthly_cost_limit NUMERIC DEFAULT 10.00,
  price_per_month NUMERIC DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed default pricing tiers
INSERT INTO pricing_tiers (tier_name, monthly_chat_tokens, monthly_image_generations, monthly_video_generations, monthly_document_parses, monthly_cost_limit, price_per_month)
VALUES 
  ('free', 50000, 5, 1, 10, 5.00, 0.00),
  ('solo', 500000, 50, 10, 100, 50.00, 20.00),
  ('team', 2000000, 200, 50, 500, 200.00, 40.00);

-- Create budget_alerts table for custom thresholds
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_percentage INTEGER DEFAULT 80,
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for pricing_tiers
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing tiers"
  ON pricing_tiers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage pricing tiers"
  ON pricing_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policies for budget_alerts
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view their alerts"
  ON budget_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = budget_alerts.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all budget alerts"
  ON budget_alerts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add columns to usage_logs for granular tracking
ALTER TABLE usage_logs 
ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'chat';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_user ON usage_logs(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_workspace ON budget_alerts(workspace_id);