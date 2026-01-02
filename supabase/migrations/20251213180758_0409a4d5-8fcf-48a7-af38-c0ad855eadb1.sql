-- Register Google Maps function
INSERT INTO chat_functions (
  function_key,
  name,
  description,
  category,
  code_path,
  events_emitted,
  depends_on,
  input_schema,
  output_schema,
  is_core,
  is_enabled,
  display_order
) VALUES (
  'googleMaps',
  'Google Maps',
  'Location lookup, geocoding, and nearby places search. Provides coordinates, addresses, and map display capabilities.',
  'feature',
  'src/lib/chatFunctions/googleMaps.ts',
  ARRAY['maps:searching', 'maps:result', 'maps:error'],
  ARRAY[]::text[],
  '{"type": "object", "properties": {"query": {"type": "string", "description": "Location name or address to search"}, "includeNearby": {"type": "boolean", "description": "Include nearby places in results"}}, "required": ["query"]}'::jsonb,
  '{"type": "object", "properties": {"success": {"type": "boolean"}, "location": {"type": "object", "properties": {"name": {"type": "string"}, "address": {"type": "string"}, "latitude": {"type": "number"}, "longitude": {"type": "number"}}}, "nearby": {"type": "array"}, "error": {"type": "string"}}}'::jsonb,
  false,
  true,
  100
) ON CONFLICT (function_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  code_path = EXCLUDED.code_path,
  events_emitted = EXCLUDED.events_emitted,
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema;

-- Register Maps Display container
INSERT INTO chat_containers (
  container_key,
  name,
  description,
  subscribes_to,
  function_key,
  is_enabled,
  display_order
) VALUES (
  'maps-display',
  'Maps Display',
  'Displays location search results with map preview and nearby places',
  ARRAY['maps:searching', 'maps:result', 'maps:error'],
  'googleMaps',
  true,
  100
) ON CONFLICT (container_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subscribes_to = EXCLUDED.subscribes_to,
  function_key = EXCLUDED.function_key;

-- Grant googleMaps permission to user actor
UPDATE chat_actors 
SET allowed_functions = array_append(
  COALESCE(allowed_functions, ARRAY[]::text[]),
  'googleMaps'
)
WHERE actor_type = 'user' 
  AND NOT ('googleMaps' = ANY(COALESCE(allowed_functions, ARRAY[]::text[])));