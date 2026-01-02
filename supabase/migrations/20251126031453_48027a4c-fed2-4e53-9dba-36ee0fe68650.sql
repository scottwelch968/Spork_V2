-- Create email_templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'marketing', 'system', 'support', 'lifecycle')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_system_event_types table
CREATE TABLE email_system_event_types (
  event_type TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('authentication', 'user_lifecycle', 'security', 'transactions', 'system_alerts', 'admin')),
  description TEXT,
  available_variables JSONB DEFAULT '[]'::jsonb,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_rules table
CREATE TABLE email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  priority INTEGER DEFAULT 100,
  conditions JSONB DEFAULT '[]'::jsonb,
  recipient_type TEXT NOT NULL DEFAULT 'user' CHECK (recipient_type IN ('user', 'admin', 'custom', 'both')),
  recipient_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  send_immediately BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  max_sends_per_user_per_day INTEGER,
  max_sends_per_user_per_week INTEGER,
  deduplicate_window_minutes INTEGER,
  trigger_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email_rule_logs table
CREATE TABLE email_rule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES email_rules(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT,
  event_payload JSONB,
  recipient_email TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  processing_time_ms INTEGER,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_system_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rule_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_system_event_types
CREATE POLICY "Admins can view event types"
  ON email_system_event_types FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_rules
CREATE POLICY "Admins can manage email rules"
  ON email_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for email_rule_logs
CREATE POLICY "Admins can view rule logs"
  ON email_rule_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert rule logs"
  ON email_rule_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_status ON email_templates(status);
CREATE INDEX idx_email_templates_slug ON email_templates(slug);
CREATE INDEX idx_email_rules_event_type ON email_rules(event_type);
CREATE INDEX idx_email_rules_status ON email_rules(status);
CREATE INDEX idx_email_rules_priority ON email_rules(priority);
CREATE INDEX idx_email_rule_logs_rule_id ON email_rule_logs(rule_id);
CREATE INDEX idx_email_rule_logs_status ON email_rule_logs(status);
CREATE INDEX idx_email_rule_logs_triggered_at ON email_rule_logs(triggered_at);

-- Seed email_system_event_types
INSERT INTO email_system_event_types (event_type, display_name, category, description, available_variables, is_critical) VALUES
-- Authentication events
('user_signup', 'User Signup', 'authentication', 'Triggered when a new user creates an account', 
  '["user_id", "email", "first_name", "last_name", "verification_link", "company_name"]', false),
('email_verification', 'Email Verification', 'authentication', 'Triggered when user needs to verify email', 
  '["user_id", "email", "first_name", "verification_link", "verification_code"]', false),
('password_reset_request', 'Password Reset Request', 'authentication', 'Triggered when user requests password reset', 
  '["user_id", "email", "first_name", "reset_link", "reset_code", "expires_at"]', true),
('password_changed', 'Password Changed', 'security', 'Triggered when user password is changed', 
  '["user_id", "email", "first_name", "changed_at", "ip_address"]', true),
('login_attempt_failed', 'Failed Login Attempt', 'security', 'Triggered after multiple failed login attempts', 
  '["user_id", "email", "attempt_count", "ip_address", "timestamp"]', true),

-- User lifecycle events
('subscription_started', 'Subscription Started', 'user_lifecycle', 'Triggered when user starts a subscription', 
  '["user_id", "email", "first_name", "tier_name", "amount", "billing_cycle", "next_billing_date"]', false),
('subscription_cancelled', 'Subscription Cancelled', 'user_lifecycle', 'Triggered when subscription is cancelled', 
  '["user_id", "email", "first_name", "tier_name", "cancellation_date", "access_until"]', false),
('subscription_renewed', 'Subscription Renewed', 'user_lifecycle', 'Triggered when subscription renews', 
  '["user_id", "email", "first_name", "tier_name", "amount", "next_billing_date"]', false),
('trial_ending', 'Trial Ending', 'user_lifecycle', 'Triggered before trial period ends', 
  '["user_id", "email", "first_name", "trial_end_date", "days_remaining"]', false),
('user_upgrade', 'User Upgraded', 'user_lifecycle', 'Triggered when user upgrades tier', 
  '["user_id", "email", "first_name", "old_tier", "new_tier", "upgrade_date"]', false),

-- Transaction events
('payment_successful', 'Payment Successful', 'transactions', 'Triggered when payment is processed successfully', 
  '["user_id", "email", "first_name", "amount", "currency", "transaction_id", "receipt_url", "description"]', false),
('payment_failed', 'Payment Failed', 'transactions', 'Triggered when payment fails', 
  '["user_id", "email", "first_name", "amount", "currency", "error_message", "retry_date"]', true),
('invoice_generated', 'Invoice Generated', 'transactions', 'Triggered when invoice is created', 
  '["user_id", "email", "first_name", "invoice_number", "amount", "due_date", "invoice_url"]', false),
('refund_processed', 'Refund Processed', 'transactions', 'Triggered when refund is completed', 
  '["user_id", "email", "first_name", "amount", "currency", "transaction_id", "reason"]', false),

-- System alerts
('system_error', 'System Error', 'system_alerts', 'Triggered on critical system errors', 
  '["error_type", "error_message", "stack_trace", "user_id", "timestamp", "severity"]', true),
('quota_warning', 'Quota Warning', 'system_alerts', 'Triggered when approaching quota limits', 
  '["user_id", "email", "first_name", "quota_type", "current_usage", "quota_limit", "percentage_used"]', false),
('quota_exceeded', 'Quota Exceeded', 'system_alerts', 'Triggered when quota is exceeded', 
  '["user_id", "email", "first_name", "quota_type", "attempted_action", "quota_limit"]', true),

-- Admin events
('admin_alert', 'Admin Alert', 'admin', 'General admin notification', 
  '["alert_type", "message", "severity", "action_required", "details"]', true);

-- Seed email_templates
INSERT INTO email_templates (name, slug, category, status, subject_template, html_content, text_content, variables) VALUES
-- Welcome Email
('Welcome Email', 'welcome-email', 'transactional', 'active',
  'Welcome to {{company_name}}, {{first_name}}!',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Hi {{first_name}},</h1>
    <p>Welcome to {{company_name}}! We''re excited to have you on board.</p>
    <p>Your account has been successfully created with email: <strong>{{email}}</strong></p>
    <p>To get started, please verify your email address:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{verification_link}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
    </p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br>The {{company_name}} Team</p>
  </body></html>',
  'Hi {{first_name}},\n\nWelcome to {{company_name}}! We''re excited to have you on board.\n\nYour account has been successfully created with email: {{email}}\n\nTo get started, please verify your email address by clicking this link:\n{{verification_link}}\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe {{company_name}} Team',
  '["first_name", "email", "company_name", "verification_link"]'),

-- Password Reset
('Password Reset', 'password-reset', 'transactional', 'active',
  'Reset Your Password - {{company_name}}',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Password Reset Request</h1>
    <p>Hi {{first_name}},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
    </p>
    <p>This link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.</p>
    <p>For security, you can also use this code: <strong>{{reset_code}}</strong></p>
    <p>Best regards,<br>The {{company_name}} Team</p>
  </body></html>',
  'Hi {{first_name}},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n{{reset_link}}\n\nYou can also use this code: {{reset_code}}\n\nThis link will expire in 1 hour. If you didn''t request this, you can safely ignore this email.\n\nBest regards,\nThe {{company_name}} Team',
  '["first_name", "reset_link", "reset_code", "company_name"]'),

-- Payment Receipt
('Payment Receipt', 'payment-receipt', 'transactional', 'active',
  'Payment Receipt - {{transaction_id}}',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #28a745;">Payment Successful!</h1>
    <p>Hi {{first_name}},</p>
    <p>Thank you for your payment. Here are the details:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{amount}} {{currency}}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Transaction ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{transaction_id}}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Description:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">{{description}}</td></tr>
    </table>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{receipt_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Receipt</a>
    </p>
    <p>Best regards,<br>The {{company_name}} Team</p>
  </body></html>',
  'Hi {{first_name}},\n\nThank you for your payment. Here are the details:\n\nAmount: {{amount}} {{currency}}\nTransaction ID: {{transaction_id}}\nDescription: {{description}}\n\nView your receipt: {{receipt_url}}\n\nBest regards,\nThe {{company_name}} Team',
  '["first_name", "amount", "currency", "transaction_id", "description", "receipt_url", "company_name"]'),

-- System Alert
('System Alert', 'system-alert', 'system', 'active',
  '[{{severity}}] System Alert: {{alert_type}}',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #ff6b6b; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
      <h1 style="margin: 0;">⚠️ System Alert</h1>
    </div>
    <p><strong>Alert Type:</strong> {{alert_type}}</p>
    <p><strong>Severity:</strong> {{severity}}</p>
    <p><strong>Message:</strong></p>
    <p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #ff6b6b;">{{message}}</p>
    <p><strong>Details:</strong></p>
    <pre style="background-color: #f8f9fa; padding: 15px; overflow-x: auto;">{{details}}</pre>
    <p><strong>Action Required:</strong> {{action_required}}</p>
  </body></html>',
  'SYSTEM ALERT\n\nAlert Type: {{alert_type}}\nSeverity: {{severity}}\n\nMessage: {{message}}\n\nDetails:\n{{details}}\n\nAction Required: {{action_required}}',
  '["alert_type", "severity", "message", "details", "action_required"]'),

-- Trial Ending
('Trial Ending Soon', 'trial-ending', 'lifecycle', 'active',
  'Your trial ends in {{days_remaining}} days',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">Your Trial is Ending Soon</h1>
    <p>Hi {{first_name}},</p>
    <p>Your trial period will end on <strong>{{trial_end_date}}</strong> ({{days_remaining}} days remaining).</p>
    <p>To continue enjoying all features, please upgrade your account:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{upgrade_link}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Upgrade Now</a>
    </p>
    <p>Best regards,<br>The {{company_name}} Team</p>
  </body></html>',
  'Hi {{first_name}},\n\nYour trial period will end on {{trial_end_date}} ({{days_remaining}} days remaining).\n\nTo continue enjoying all features, please upgrade your account:\n{{upgrade_link}}\n\nBest regards,\nThe {{company_name}} Team',
  '["first_name", "trial_end_date", "days_remaining", "upgrade_link", "company_name"]');

-- Seed default email_rules
INSERT INTO email_rules (event_type, template_id, name, description, status, priority, recipient_type) VALUES
('user_signup', (SELECT id FROM email_templates WHERE slug = 'welcome-email'), 
  'Welcome New Users', 'Send welcome email when user signs up', 'active', 10, 'user'),
('password_reset_request', (SELECT id FROM email_templates WHERE slug = 'password-reset'), 
  'Password Reset Flow', 'Send reset link when requested', 'active', 5, 'user'),
('payment_successful', (SELECT id FROM email_templates WHERE slug = 'payment-receipt'), 
  'Payment Confirmations', 'Send receipt after successful payment', 'active', 10, 'user'),
('trial_ending', (SELECT id FROM email_templates WHERE slug = 'trial-ending'), 
  'Trial Ending Reminder', 'Notify users 3 days before trial ends', 'active', 20, 'user'),
('system_error', (SELECT id FROM email_templates WHERE slug = 'system-alert'), 
  'Critical System Errors', 'Alert admins of critical errors', 'active', 1, 'admin');