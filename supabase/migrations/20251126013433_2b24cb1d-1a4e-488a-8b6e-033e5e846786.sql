-- Create enums for billing system
CREATE TYPE tier_type_enum AS ENUM ('trial', 'paid');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'suspended', 'cancelled', 'expired');
CREATE TYPE payment_processor_enum AS ENUM ('stripe', 'paypal');
CREATE TYPE event_type_enum AS ENUM ('text_generation', 'image_generation', 'video_generation', 'document_parsing');

-- Enhanced subscription_tiers table
CREATE TABLE subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier_type tier_type_enum NOT NULL,
  monthly_token_input_quota integer,
  monthly_token_output_quota integer,
  daily_token_input_limit integer,
  daily_token_output_limit integer,
  monthly_image_quota integer,
  monthly_video_quota integer,
  monthly_document_parsing_quota integer,
  daily_image_limit integer,
  daily_video_limit integer,
  trial_duration_days integer,
  trial_usage_based boolean DEFAULT false,
  allowed_models jsonb DEFAULT '[]'::jsonb,
  monthly_price decimal(10,2),
  credit_price_per_unit decimal(10,2),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tier_id uuid REFERENCES subscription_tiers(id) NOT NULL,
  status subscription_status_enum DEFAULT 'active',
  trial_started_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  is_trial boolean DEFAULT false,
  external_subscription_id text,
  payment_processor payment_processor_enum,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  cancelled_at timestamp with time zone
);

-- Usage tracking table (period-based)
CREATE TABLE usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  tokens_input_used integer DEFAULT 0,
  tokens_output_used integer DEFAULT 0,
  tokens_input_quota integer,
  tokens_output_quota integer,
  images_generated integer DEFAULT 0,
  images_quota integer,
  videos_generated integer DEFAULT 0,
  videos_quota integer,
  documents_parsed integer DEFAULT 0,
  documents_quota integer,
  daily_tokens_input_used integer DEFAULT 0,
  daily_tokens_output_used integer DEFAULT 0,
  daily_images_used integer DEFAULT 0,
  daily_videos_used integer DEFAULT 0,
  daily_reset_at timestamp with time zone,
  last_usage_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now()
);

-- Usage events table (detailed logging)
CREATE TABLE usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  event_type event_type_enum NOT NULL,
  model_used text,
  openrouter_generation_id text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  tokens_reasoning integer DEFAULT 0,
  cost_usd decimal(10,6),
  request_id text,
  response_time_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Credit purchases table
CREATE TABLE credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  credits_purchased integer NOT NULL,
  credits_remaining integer NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  payment_processor payment_processor_enum,
  external_transaction_id text,
  discount_code text,
  discount_amount decimal(10,2),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone
);

-- Payment processors table
CREATE TABLE payment_processors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  processor_type payment_processor_enum NOT NULL,
  is_active boolean DEFAULT false,
  is_default boolean DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  supports_subscriptions boolean DEFAULT true,
  supports_one_time_payments boolean DEFAULT true,
  supports_webhooks boolean DEFAULT true,
  webhook_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Discount codes table
CREATE TABLE discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value decimal(10,2) NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers
CREATE POLICY "Admins can manage subscription tiers"
  ON subscription_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active subscription tiers"
  ON subscription_tiers FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON user_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for usage_tracking
CREATE POLICY "Admins can view all usage tracking"
  ON usage_tracking FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
  ON usage_tracking FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for usage_events
CREATE POLICY "Admins can view all usage events"
  ON usage_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage events"
  ON usage_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for credit_purchases
CREATE POLICY "Admins can view all credit purchases"
  ON credit_purchases FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credit purchases"
  ON credit_purchases FOR ALL
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for payment_processors
CREATE POLICY "Admins can manage payment processors"
  ON payment_processors FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for discount_codes
CREATE POLICY "Admins can manage discount codes"
  ON discount_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until >= now()));

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_payment_processors_updated_at
  BEFORE UPDATE ON payment_processors
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, tier_type, monthly_token_input_quota, monthly_token_output_quota, monthly_image_quota, monthly_video_quota, monthly_document_parsing_quota, trial_duration_days, monthly_price, is_active, display_order) VALUES
  ('Free Trial', 'trial', 100000, 50000, 10, 2, 5, 14, 0.00, true, 0),
  ('Solo', 'paid', 500000, 250000, 50, 10, 25, NULL, 20.00, true, 1),
  ('Team', 'paid', 2000000, 1000000, 200, 50, 100, NULL, 40.00, true, 2),
  ('Enterprise', 'paid', NULL, NULL, NULL, NULL, NULL, NULL, 199.00, true, 3);