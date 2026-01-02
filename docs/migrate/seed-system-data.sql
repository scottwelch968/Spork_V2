-- =====================================================
-- SPORK SYSTEM DATA SEED SCRIPT
-- Complete production seed data for new installations
-- Generated for external Supabase project migration
-- =====================================================

-- =====================================================
-- 1. PERSONA CATEGORIES (25 categories)
-- =====================================================
DELETE FROM public.persona_categories;
INSERT INTO public.persona_categories (name, slug, description, icon, display_order, is_active) VALUES
('General', 'general', 'General purpose assistants for everyday tasks', 'Bot', 1, true),
('Writing', 'writing', 'Content creation, copywriting, and editing', 'Pen', 2, true),
('Coding', 'coding', 'Software development and programming assistance', 'Code', 3, true),
('Marketing', 'marketing', 'Marketing strategy and content creation', 'Megaphone', 4, true),
('Sales', 'sales', 'Sales enablement and customer outreach', 'TrendingUp', 5, true),
('Customer Support', 'customer-support', 'Customer service and support automation', 'Headphones', 6, true),
('Research', 'research', 'Academic and market research assistance', 'Search', 7, true),
('Education', 'education', 'Teaching, tutoring, and learning support', 'GraduationCap', 8, true),
('Legal', 'legal', 'Legal research and document preparation', 'Scale', 9, true),
('Finance', 'finance', 'Financial analysis and planning', 'DollarSign', 10, true),
('Healthcare', 'healthcare', 'Healthcare information and wellness', 'Heart', 11, true),
('HR', 'hr', 'Human resources and recruitment', 'Users', 12, true),
('Project Management', 'project-management', 'Project planning and team coordination', 'ClipboardList', 13, true),
('Creative', 'creative', 'Creative brainstorming and ideation', 'Lightbulb', 14, true),
('Data Analysis', 'data-analysis', 'Data interpretation and visualization', 'BarChart', 15, true),
('Social Media', 'social-media', 'Social media strategy and content', 'Share2', 16, true),
('SEO', 'seo', 'Search engine optimization', 'Search', 17, true),
('Email', 'email', 'Email writing and communication', 'Mail', 18, true),
('Translation', 'translation', 'Language translation and localization', 'Globe', 19, true),
('Summarization', 'summarization', 'Content summarization and distillation', 'FileText', 20, true),
('Productivity', 'productivity', 'Personal productivity and organization', 'Zap', 21, true),
('Gaming', 'gaming', 'Game development and gaming assistance', 'Gamepad', 22, true),
('Entertainment', 'entertainment', 'Entertainment and media content', 'Film', 23, true),
('Travel', 'travel', 'Travel planning and recommendations', 'Plane', 24, true),
('Food', 'food', 'Recipes, nutrition, and culinary advice', 'UtensilsCrossed', 25, true);

-- =====================================================
-- 2. PROMPT CATEGORIES (25 categories)
-- =====================================================
DELETE FROM public.prompt_categories;
INSERT INTO public.prompt_categories (name, slug, description, icon, display_order, is_active) VALUES
('General', 'general', 'General purpose prompts', 'MessageSquare', 1, true),
('Writing', 'writing', 'Writing and content creation prompts', 'Pen', 2, true),
('Coding', 'coding', 'Programming and development prompts', 'Code', 3, true),
('Analysis', 'analysis', 'Data and content analysis prompts', 'BarChart', 4, true),
('Creative', 'creative', 'Creative and brainstorming prompts', 'Palette', 5, true),
('Business', 'business', 'Business strategy and planning', 'Briefcase', 6, true),
('Marketing', 'marketing', 'Marketing and advertising prompts', 'Megaphone', 7, true),
('Email', 'email', 'Email drafting and communication', 'Mail', 8, true),
('Social Media', 'social-media', 'Social media content prompts', 'Share2', 9, true),
('SEO', 'seo', 'Search engine optimization prompts', 'Search', 10, true),
('Research', 'research', 'Research and investigation prompts', 'BookOpen', 11, true),
('Education', 'education', 'Learning and teaching prompts', 'GraduationCap', 12, true),
('Legal', 'legal', 'Legal document and research prompts', 'Scale', 13, true),
('Finance', 'finance', 'Financial analysis prompts', 'DollarSign', 14, true),
('HR', 'hr', 'Human resources prompts', 'Users', 15, true),
('Customer Service', 'customer-service', 'Customer support prompts', 'Headphones', 16, true),
('Product', 'product', 'Product development prompts', 'Package', 17, true),
('Design', 'design', 'Design and UX prompts', 'Figma', 18, true),
('Translation', 'translation', 'Translation and localization', 'Globe', 19, true),
('Summarization', 'summarization', 'Summarization prompts', 'FileText', 20, true),
('Brainstorming', 'brainstorming', 'Ideation and brainstorming', 'Lightbulb', 21, true),
('Productivity', 'productivity', 'Productivity improvement prompts', 'Zap', 22, true),
('Meeting', 'meeting', 'Meeting notes and agendas', 'Calendar', 23, true),
('Interview', 'interview', 'Interview preparation prompts', 'Mic', 24, true),
('Templates', 'templates', 'Document templates and formats', 'Layout', 25, true);

-- =====================================================
-- 3. SPACE CATEGORIES (25 categories)
-- =====================================================
DELETE FROM public.space_categories;
INSERT INTO public.space_categories (name, slug, description, icon, display_order, is_active) VALUES
('Personal', 'personal', 'Personal workspaces and projects', 'User', 1, true),
('Team', 'team', 'Team collaboration spaces', 'Users', 2, true),
('Project', 'project', 'Project-based workspaces', 'Folder', 3, true),
('Marketing', 'marketing', 'Marketing team spaces', 'Megaphone', 4, true),
('Sales', 'sales', 'Sales team workspaces', 'TrendingUp', 5, true),
('Engineering', 'engineering', 'Engineering and development', 'Code', 6, true),
('Design', 'design', 'Design team spaces', 'Palette', 7, true),
('Product', 'product', 'Product management spaces', 'Package', 8, true),
('Customer Success', 'customer-success', 'Customer success workspaces', 'Heart', 9, true),
('HR', 'hr', 'Human resources spaces', 'UserPlus', 10, true),
('Finance', 'finance', 'Finance and accounting', 'DollarSign', 11, true),
('Legal', 'legal', 'Legal team workspaces', 'Scale', 12, true),
('Operations', 'operations', 'Operations management', 'Settings', 13, true),
('Research', 'research', 'Research and development', 'Search', 14, true),
('Content', 'content', 'Content creation spaces', 'FileText', 15, true),
('Support', 'support', 'Customer support spaces', 'Headphones', 16, true),
('Education', 'education', 'Educational spaces', 'GraduationCap', 17, true),
('Healthcare', 'healthcare', 'Healthcare workspaces', 'Activity', 18, true),
('Real Estate', 'real-estate', 'Real estate spaces', 'Home', 19, true),
('E-commerce', 'ecommerce', 'E-commerce workspaces', 'ShoppingCart', 20, true),
('Media', 'media', 'Media and entertainment', 'Film', 21, true),
('Consulting', 'consulting', 'Consulting workspaces', 'Briefcase', 22, true),
('Agency', 'agency', 'Agency workspaces', 'Building', 23, true),
('Startup', 'startup', 'Startup workspaces', 'Rocket', 24, true),
('Enterprise', 'enterprise', 'Enterprise workspaces', 'Building2', 25, true);

-- =====================================================
-- 4. PRICING TIERS
-- =====================================================
DELETE FROM public.pricing_tiers;
INSERT INTO public.pricing_tiers (tier_name, monthly_chat_tokens, monthly_image_generations, monthly_video_generations, monthly_document_parses, monthly_cost_limit, price_per_month) VALUES
('free', 100000, 10, 2, 20, 5.00, 0.00),
('solo', 1000000, 100, 20, 200, 50.00, 20.00),
('team', 5000000, 500, 100, 1000, 250.00, 40.00);

-- =====================================================
-- 5. SUBSCRIPTION TIERS
-- =====================================================
-- Only insert if subscription_tiers table exists and has the expected columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_tiers') THEN
    -- Check if table has the new schema (tier_type, monthly_token_input_quota, etc.)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'subscription_tiers' AND column_name = 'tier_type'
    ) THEN
      -- New schema: use tier_type, token quotas, etc.
      DELETE FROM public.subscription_tiers;
      INSERT INTO public.subscription_tiers (name, tier_type, monthly_token_input_quota, monthly_token_output_quota, daily_token_input_limit, daily_token_output_limit, monthly_image_quota, monthly_video_quota, monthly_document_parsing_quota, allowed_models, monthly_price, is_active, display_order) VALUES
      ('Free Trial', 'trial'::tier_type_enum, 100000, 100000, 10000, 10000, 10, 2, 20, 
       '["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "google/gemini-1.5-flash"]'::jsonb,
       0.00, true, 0),
      ('Solo', 'paid'::tier_type_enum, 1000000, 1000000, 100000, 100000, 100, 20, 200,
       '["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-1.5-pro", "openai/gpt-4o-mini", "anthropic/claude-3-haiku"]'::jsonb,
       20.00, true, 1),
      ('Team', 'paid'::tier_type_enum, 5000000, 5000000, 500000, 500000, 500, 100, 1000,
       '["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "anthropic/claude-3-opus", "google/gemini-1.5-pro", "openai/gpt-4o-mini", "anthropic/claude-3-haiku", "meta-llama/llama-3.1-405b"]'::jsonb,
       40.00, true, 2),
      ('Enterprise', 'paid'::tier_type_enum, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       '["*"]'::jsonb,
       100.00, true, 3);
    ELSE
      -- Old schema: use description, tier_level, etc. (skip if columns don't exist)
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'subscription_tiers' AND column_name = 'description'
      ) THEN
        DELETE FROM public.subscription_tiers;
        INSERT INTO public.subscription_tiers (name, description, tier_level, monthly_price, annual_price, max_workspaces, max_team_members, max_storage_gb, max_chats_per_month, max_messages_per_chat, max_personas, max_prompts, allowed_models, features, is_active, stripe_price_id_monthly, stripe_price_id_annual) VALUES
        ('Free Trial', 'Try Spork free for 14 days', 0, 0.00, 0.00, 1, 1, 1, 50, 100, 5, 10, 
         '["openai/gpt-4o-mini", "anthropic/claude-3-haiku", "google/gemini-1.5-flash"]'::jsonb,
         '{"chat": true, "personas": true, "prompts": true, "knowledge_base": false, "team_collaboration": false, "api_access": false, "priority_support": false}'::jsonb,
         true, NULL, NULL),
        ('Solo', 'For individual power users', 1, 20.00, 192.00, 3, 1, 10, 500, 500, 20, 50,
         '["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-1.5-pro", "openai/gpt-4o-mini", "anthropic/claude-3-haiku"]'::jsonb,
         '{"chat": true, "personas": true, "prompts": true, "knowledge_base": true, "team_collaboration": false, "api_access": false, "priority_support": false, "image_generation": true}'::jsonb,
         true, 'price_solo_monthly', 'price_solo_annual'),
        ('Team', 'For small teams', 2, 40.00, 384.00, 10, 5, 50, 2000, 1000, 50, 100,
         '["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "anthropic/claude-3-opus", "google/gemini-1.5-pro", "openai/gpt-4o-mini", "anthropic/claude-3-haiku", "meta-llama/llama-3.1-405b"]'::jsonb,
         '{"chat": true, "personas": true, "prompts": true, "knowledge_base": true, "team_collaboration": true, "api_access": true, "priority_support": false, "image_generation": true, "video_generation": true}'::jsonb,
         true, 'price_team_monthly', 'price_team_annual'),
        ('Enterprise', 'For organizations', 3, 100.00, 960.00, -1, -1, 500, -1, -1, -1, -1,
         '["*"]'::jsonb,
         '{"chat": true, "personas": true, "prompts": true, "knowledge_base": true, "team_collaboration": true, "api_access": true, "priority_support": true, "image_generation": true, "video_generation": true, "custom_integrations": true, "sso": true, "audit_logs": true}'::jsonb,
         true, 'price_enterprise_monthly', 'price_enterprise_annual');
      END IF;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 6. COSMO INTENTS
-- =====================================================
-- Only insert if cosmo_intents table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cosmo_intents') THEN
    DELETE FROM public.cosmo_intents;
    INSERT INTO public.cosmo_intents (intent_key, display_name, description, category, keywords, required_functions, preferred_models, priority, is_active) VALUES
('coding', 'Code Generation', 'Generate, explain, or debug code', 'technical', 
 ARRAY['code', 'function', 'class', 'bug', 'debug', 'program', 'script', 'algorithm', 'syntax', 'compile'],
 ARRAY['generate_code', 'explain_code'], 
 ARRAY['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'], 80, true),
('analysis', 'Data Analysis', 'Analyze data, statistics, and patterns', 'analytical',
 ARRAY['analyze', 'data', 'statistics', 'trends', 'patterns', 'insights', 'metrics', 'report'],
 ARRAY['analyze_data', 'generate_report'],
 ARRAY['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'], 75, true),
('creative', 'Creative Writing', 'Creative content generation', 'creative',
 ARRAY['write', 'story', 'poem', 'creative', 'fiction', 'narrative', 'blog', 'article'],
 ARRAY['generate_content'],
 ARRAY['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'], 70, true),
('summarization', 'Summarization', 'Summarize documents and content', 'utility',
 ARRAY['summarize', 'summary', 'tldr', 'brief', 'overview', 'condensed'],
 ARRAY['summarize_text'],
 ARRAY['google/gemini-1.5-flash', 'anthropic/claude-3-haiku'], 65, true),
('translation', 'Translation', 'Translate between languages', 'utility',
 ARRAY['translate', 'translation', 'language', 'spanish', 'french', 'german', 'chinese', 'japanese'],
 ARRAY['translate_text'],
 ARRAY['openai/gpt-4o', 'google/gemini-1.5-pro'], 60, true),
('research', 'Research', 'Research and information gathering', 'analytical',
 ARRAY['research', 'find', 'search', 'information', 'learn', 'explain', 'what is'],
 ARRAY['search_knowledge', 'explain_topic'],
 ARRAY['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'], 55, true),
('math', 'Mathematics', 'Mathematical calculations and explanations', 'technical',
 ARRAY['calculate', 'math', 'equation', 'formula', 'solve', 'algebra', 'calculus'],
 ARRAY['calculate', 'solve_equation'],
 ARRAY['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'], 50, true),
('conversation', 'General Conversation', 'General chat and discussion', 'general',
 ARRAY['chat', 'talk', 'discuss', 'hello', 'hi', 'hey', 'thanks'],
 ARRAY['chat'],
 ARRAY['anthropic/claude-3-haiku', 'google/gemini-1.5-flash'], 30, true),
('image_gen', 'Image Generation', 'Generate images from descriptions', 'creative',
 ARRAY['generate image', 'create image', 'draw', 'picture', 'illustration', 'artwork'],
 ARRAY['generate_image'],
 ARRAY['openai/dall-e-3'], 70, true),
('document', 'Document Processing', 'Process and analyze documents', 'utility',
 ARRAY['document', 'pdf', 'file', 'parse', 'extract', 'read'],
 ARRAY['process_document', 'query_knowledge'],
 ARRAY['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'], 60, true),
('email', 'Email Writing', 'Compose and format emails', 'business',
 ARRAY['email', 'mail', 'compose', 'reply', 'respond', 'professional'],
 ARRAY['write_email'],
 ARRAY['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'], 55, true),
('planning', 'Planning & Organization', 'Task planning and organization', 'productivity',
 ARRAY['plan', 'organize', 'schedule', 'task', 'project', 'timeline', 'milestone'],
 ARRAY['create_plan', 'organize_tasks'],
 ARRAY['openai/gpt-4o', 'anthropic/claude-3.5-sonnet'], 50, true);
  END IF;
END $$;

-- =====================================================
-- 7. EMAIL PROVIDERS
-- =====================================================
DELETE FROM public.email_providers;
INSERT INTO public.email_providers (name, provider_type, api_endpoint, sdk_package, description, logo_url, documentation_url, is_active, config_schema, config_values) VALUES
('Resend', 'resend', 'https://api.resend.com', 'resend', 'Modern email API for developers', 'https://resend.com/static/brand/logo-light.svg', 'https://resend.com/docs', true,
 '[{"key": "api_key", "type": "secret", "label": "API Key", "required": true}, {"key": "from_email", "type": "string", "label": "From Email", "required": true}]'::jsonb,
 '{"from_email": "noreply@spork.app"}'::jsonb),
('SendGrid', 'sendgrid', 'https://api.sendgrid.com/v3', 'sendgrid', 'Twilio SendGrid email platform', 'https://sendgrid.com/brand/sg-twilio-lockup.svg', 'https://docs.sendgrid.com', false,
 '[{"key": "api_key", "type": "secret", "label": "API Key", "required": true}, {"key": "from_email", "type": "string", "label": "From Email", "required": true}]'::jsonb,
 '{}'::jsonb),
('NotificationAPI', 'notificationapi', 'https://api.notificationapi.com', 'notificationapi-node-server-sdk', 'Unified notification platform', 'https://notificationapi.com/logo.svg', 'https://docs.notificationapi.com', false,
 '[{"key": "client_id", "type": "string", "label": "Client ID", "required": true}, {"key": "client_secret", "type": "secret", "label": "Client Secret", "required": true}]'::jsonb,
 '{}'::jsonb);

-- =====================================================
-- 8. EMAIL SYSTEM EVENT TYPES
-- =====================================================
DELETE FROM public.email_system_event_types;
INSERT INTO public.email_system_event_types (event_type, display_name, description, category, is_critical, available_variables) VALUES
('user_signup', 'User Signup', 'Triggered when a new user registers', 'authentication', false, 
 '{"user_email": "string", "user_name": "string", "confirmation_url": "string"}'::jsonb),
('password_reset', 'Password Reset', 'Triggered when user requests password reset', 'authentication', true,
 '{"user_email": "string", "reset_url": "string", "expires_in": "string"}'::jsonb),
('email_verification', 'Email Verification', 'Triggered to verify user email', 'authentication', false,
 '{"user_email": "string", "verification_url": "string"}'::jsonb),
('workspace_invitation', 'Workspace Invitation', 'Triggered when user is invited to workspace', 'workspace', false,
 '{"inviter_name": "string", "workspace_name": "string", "invite_url": "string", "role": "string"}'::jsonb),
('subscription_created', 'Subscription Created', 'Triggered when subscription is created', 'billing', false,
 '{"plan_name": "string", "amount": "number", "next_billing_date": "string"}'::jsonb),
('subscription_cancelled', 'Subscription Cancelled', 'Triggered when subscription is cancelled', 'billing', false,
 '{"plan_name": "string", "end_date": "string"}'::jsonb),
('payment_failed', 'Payment Failed', 'Triggered when payment fails', 'billing', true,
 '{"amount": "number", "reason": "string", "retry_date": "string"}'::jsonb),
('payment_succeeded', 'Payment Succeeded', 'Triggered when payment succeeds', 'billing', false,
 '{"amount": "number", "invoice_url": "string"}'::jsonb),
('quota_warning', 'Quota Warning', 'Triggered when approaching usage limits', 'usage', false,
 '{"resource_type": "string", "current_usage": "number", "limit": "number", "percentage": "number"}'::jsonb),
('quota_exceeded', 'Quota Exceeded', 'Triggered when usage limit exceeded', 'usage', true,
 '{"resource_type": "string", "limit": "number", "action_required": "string"}'::jsonb),
('security_alert', 'Security Alert', 'Triggered for security-related events', 'security', true,
 '{"alert_type": "string", "description": "string", "ip_address": "string", "timestamp": "string"}'::jsonb),
('welcome', 'Welcome Email', 'Sent to new users after signup', 'onboarding', false,
 '{"user_name": "string", "getting_started_url": "string"}'::jsonb);

-- =====================================================
-- 9. SYSTEM SETTINGS
-- =====================================================
DELETE FROM public.system_settings;
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('default_model', '"openai/gpt-4o-mini"'::jsonb, 'Default AI model for new chats'),
('default_persona', '{"name": "General Assistant", "system_prompt": "You are a helpful, friendly AI assistant."}'::jsonb, 'Default persona for new users'),
('cosmo_enabled', 'true'::jsonb, 'Enable COSMO intelligent routing'),
('cosmo_routing_config', '{"enabled": true, "fallback_model": "openai/gpt-4o-mini", "max_retries": 3}'::jsonb, 'COSMO routing configuration'),
('response_formatting_rules', '{"markdown_enabled": true, "code_highlighting": true, "max_response_length": 8000}'::jsonb, 'AI response formatting rules'),
('image_generation_config', '{"default_provider": "replicate", "default_model": "flux-schnell", "max_resolution": 1024}'::jsonb, 'Image generation settings'),
('knowledge_base_config', '{"chunk_size": 1000, "chunk_overlap": 200, "max_file_size_mb": 50}'::jsonb, 'Knowledge base processing settings'),
('quota_limits', '{"free_tokens": 100000, "free_images": 10, "free_documents": 20}'::jsonb, 'Free tier quota limits'),
('feature_flags', '{"video_generation": true, "team_collaboration": true, "api_access": true, "cosmo_batching": false}'::jsonb, 'Feature flags'),
('maintenance_mode', 'false'::jsonb, 'Enable maintenance mode'),
('rate_limiting', '{"requests_per_minute": 60, "tokens_per_minute": 100000}'::jsonb, 'Rate limiting configuration'),
('email_config', '{"from_name": "Spork", "from_email": "noreply@spork.app", "reply_to": "support@spork.app"}'::jsonb, 'Email configuration');

-- =====================================================
-- 10. SCHEDULED JOBS
-- =====================================================
-- Only insert if scheduled_jobs table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scheduled_jobs') THEN
    DELETE FROM public.scheduled_jobs;
    INSERT INTO public.scheduled_jobs (job_name, function_name, schedule, is_enabled, last_run_at, next_run_at, config, description) VALUES
('sync_openrouter_models', 'sync-openrouter-models', '0 */6 * * *', true, NULL, now() + interval '6 hours',
 '{"batch_size": 100}'::jsonb, 'Sync AI models from OpenRouter API'),
('cleanup_expired_images', 'cleanup-expired-images', '0 3 * * *', true, NULL, now() + interval '1 day',
 '{"retention_days": 7}'::jsonb, 'Clean up expired generated images'),
('cleanup_orphaned_files', 'cleanup-orphaned-files', '0 4 * * 0', true, NULL, now() + interval '7 days',
 '{"dry_run": false}'::jsonb, 'Clean up orphaned storage files');
  END IF;
END $$;

-- =====================================================
-- 11. DEFAULT PERSONA TEMPLATE
-- =====================================================
INSERT INTO public.persona_templates (name, description, system_prompt, icon, is_active, is_default_for_users, is_default_for_spaces, is_featured, category_id)
SELECT 
  'General Assistant',
  'A helpful AI assistant for everyday tasks. Perfect for general questions, brainstorming, and getting things done.',
  'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions. When appropriate:

- Ask clarifying questions if the request is ambiguous
- Break down complex topics into digestible parts
- Provide examples when helpful
- Cite sources when making factual claims
- Admit when you don''t know something

Maintain a professional yet approachable tone.',
  'Bot',
  true,
  true,
  true,
  true,
  pc.id
FROM persona_categories pc
WHERE pc.slug = 'general'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. DEFAULT PROMPT TEMPLATE  
-- =====================================================
INSERT INTO public.prompt_templates (title, content, is_active, is_default_for_users, is_default_for_spaces, is_featured, category_id)
SELECT 
  'General Prompt',
  'You are a helpful AI assistant. When responding:

1. **Clarify**: If my request is unclear, ask one brief question before proceeding
2. **Structure**: Organize responses with headings, bullets, or numbered steps when appropriate
3. **Concise**: Be thorough but avoid unnecessary filler—get to the point
4. **Adapt**: Match my tone—casual for quick questions, professional for business tasks
5. **Next Steps**: End with a suggestion or question to keep momentum going

Ready to help with anything!',
  true,
  true,
  true,
  true,
  pc.id
FROM prompt_categories pc
WHERE pc.slug = 'general'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. CREDIT PACKAGES
-- =====================================================
DELETE FROM public.credit_packages;
INSERT INTO public.credit_packages (name, description, credits_amount, price_usd, bonus_credits, credit_type, is_active, display_order) VALUES
('Starter Pack', 'Get started with AI credits', 1000, 5.00, 0, 'chat', true, 1),
('Popular Pack', 'Most popular credit bundle', 5000, 20.00, 500, 'chat', true, 2),
('Power Pack', 'For power users', 15000, 50.00, 2500, 'chat', true, 3),
('Image Pack', 'Image generation credits', 100, 10.00, 10, 'image', true, 4),
('Video Pack', 'Video generation credits', 20, 25.00, 2, 'video', true, 5);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Verify counts:
-- SELECT 'persona_categories' as table_name, count(*) FROM persona_categories
-- UNION ALL SELECT 'prompt_categories', count(*) FROM prompt_categories
-- UNION ALL SELECT 'space_categories', count(*) FROM space_categories
-- UNION ALL SELECT 'pricing_tiers', count(*) FROM pricing_tiers
-- UNION ALL SELECT 'subscription_tiers', count(*) FROM subscription_tiers
-- UNION ALL SELECT 'cosmo_intents', count(*) FROM cosmo_intents
-- UNION ALL SELECT 'email_providers', count(*) FROM email_providers
-- UNION ALL SELECT 'email_system_event_types', count(*) FROM email_system_event_types
-- UNION ALL SELECT 'system_settings', count(*) FROM system_settings
-- UNION ALL SELECT 'scheduled_jobs', count(*) FROM scheduled_jobs;
