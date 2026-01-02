-- Add 'api' actor type to chat_actors table
INSERT INTO chat_actors (
  actor_type, 
  name, 
  description, 
  allowed_functions, 
  default_display_mode,
  display_order,
  is_system,
  is_enabled
) VALUES (
  'api',
  'API Client',
  'External API integrations and direct API calls.',
  ARRAY['submitRequest', 'processResponse'],
  'silent',
  6,
  true,
  true
);