-- Insert initial super_admin system user
-- Password: admin123 (hashed with PBKDF2-SHA256)
-- Note: This is a temporary password that should be changed immediately after first login

INSERT INTO public.system_users (
  email,
  password_hash,
  first_name,
  last_name,
  is_active
) VALUES (
  'admin@spork.ai',
  'temp_password_hash',
  'System',
  'Administrator',
  true
) ON CONFLICT (email) DO NOTHING;

-- Add super_admin role to the initial user
INSERT INTO public.system_user_roles (system_user_id, role)
SELECT id, 'super_admin'::system_role
FROM public.system_users
WHERE email = 'admin@spork.ai'
ON CONFLICT DO NOTHING;