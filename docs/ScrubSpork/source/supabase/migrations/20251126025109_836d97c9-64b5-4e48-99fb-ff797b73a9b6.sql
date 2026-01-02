-- Create email providers table with dynamic config schema
CREATE TABLE IF NOT EXISTS public.email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  config_schema JSONB DEFAULT '[]'::jsonb,
  config_values JSONB DEFAULT '{}'::jsonb,
  sdk_package TEXT,
  description TEXT,
  logo_url TEXT,
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.email_providers(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_providers (admin only)
CREATE POLICY "Admins can manage email providers"
  ON public.email_providers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view email providers"
  ON public.email_providers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for email_logs (admin only)
CREATE POLICY "Admins can view email logs"
  ON public.email_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert email logs"
  ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_providers_updated_at
  BEFORE UPDATE ON public.email_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed common email provider templates
INSERT INTO public.email_providers (name, provider_type, description, sdk_package, config_schema, is_active) VALUES
('Resend', 'resend', 'Modern email API for developers', 'npm:resend@2.0.0', 
  '[
    {"key": "api_key", "label": "API Key", "type": "password", "required": true},
    {"key": "from_email", "label": "From Email", "type": "email", "required": true},
    {"key": "from_name", "label": "From Name", "type": "text", "required": false},
    {"key": "reply_to", "label": "Reply-To Email", "type": "email", "required": false}
  ]'::jsonb, false),
('Mailtrap', 'mailtrap', 'Email testing and delivery platform', 'npm:mailtrap@1.1.0',
  '[
    {"key": "api_token", "label": "API Token", "type": "password", "required": true},
    {"key": "from_email", "label": "From Email", "type": "email", "required": true},
    {"key": "from_name", "label": "From Name", "type": "text", "required": false},
    {"key": "account_id", "label": "Account ID", "type": "text", "required": false},
    {"key": "category", "label": "Category", "type": "select", "required": false, "options": ["transactional", "promotional", "system"]}
  ]'::jsonb, false),
('NotificationAPI', 'notificationapi', 'Multi-channel notification platform', 'npm:notificationapi-node-server-sdk@2.0.0',
  '[
    {"key": "client_id", "label": "Client ID", "type": "text", "required": true},
    {"key": "client_secret", "label": "Client Secret", "type": "password", "required": true},
    {"key": "notification_id", "label": "Notification ID", "type": "text", "required": false}
  ]'::jsonb, false),
('SendGrid', 'sendgrid', 'Email delivery and marketing platform', 'npm:@sendgrid/mail',
  '[
    {"key": "api_key", "label": "API Key", "type": "password", "required": true},
    {"key": "from_email", "label": "From Email", "type": "email", "required": true},
    {"key": "from_name", "label": "From Name", "type": "text", "required": false}
  ]'::jsonb, false),
('Mailgun', 'mailgun', 'Powerful email API service', 'npm:mailgun.js',
  '[
    {"key": "api_key", "label": "API Key", "type": "password", "required": true},
    {"key": "domain", "label": "Domain", "type": "text", "required": true},
    {"key": "from_email", "label": "From Email", "type": "email", "required": true}
  ]'::jsonb, false);