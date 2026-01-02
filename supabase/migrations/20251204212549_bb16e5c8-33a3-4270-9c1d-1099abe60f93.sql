-- Add workspace_invitation event type with valid category
INSERT INTO email_system_event_types (event_type, display_name, category, description, available_variables, is_critical)
VALUES (
  'workspace_invitation',
  'Workspace Invitation', 
  'user_lifecycle',
  'Triggered when a user is invited to join a workspace',
  '["invitee_email", "inviter_name", "inviter_email", "workspace_name", "invite_link", "expires_at"]'::jsonb,
  false
) ON CONFLICT (event_type) DO NOTHING;

-- Create workspace invitation email template
INSERT INTO email_templates (name, slug, subject_template, html_content, category, status, variables)
VALUES (
  'Workspace Invitation',
  'workspace-invitation',
  'You''ve been invited to join {{workspace_name}} on Spork',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">Spork</h1>
  </div>
  
  <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; color: #1e40af;">You''re Invited!</h2>
    <p style="margin: 0 0 15px 0;">
      <strong>{{inviter_name}}</strong> has invited you to join <strong>{{workspace_name}}</strong> on Spork.
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      Join the workspace to collaborate with your team using AI-powered tools.
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invite_link}}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Accept Invitation
    </a>
  </div>
  
  <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 20px;">
    <p style="margin: 0; font-size: 13px; color: #6b7280;">
      This invitation expires on {{expires_at}}. If you didn''t expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
    <p>Spork - Your AI-powered workspace</p>
  </div>
</body>
</html>',
  'transactional',
  'active',
  '["invitee_email", "inviter_name", "inviter_email", "workspace_name", "invite_link", "expires_at"]'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- Create email rule for workspace invitation
INSERT INTO email_rules (name, event_type, template_id, status, recipient_type, description, send_immediately, priority)
SELECT 
  'Send Workspace Invitation Email',
  'workspace_invitation',
  t.id,
  'active',
  'user',
  'Sends invitation email when a user is invited to a workspace',
  true,
  100
FROM email_templates t
WHERE t.slug = 'workspace-invitation'
ON CONFLICT DO NOTHING;