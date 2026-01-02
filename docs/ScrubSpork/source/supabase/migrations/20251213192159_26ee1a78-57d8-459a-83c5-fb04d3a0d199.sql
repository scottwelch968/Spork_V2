-- Phase 2: Database Schema for Dynamic Rendering

-- Add render_schema to chat_containers
ALTER TABLE chat_containers 
ADD COLUMN IF NOT EXISTS render_schema JSONB DEFAULT '{}';

-- Add function_sequence and context_defaults to chat_actors
ALTER TABLE chat_actors 
ADD COLUMN IF NOT EXISTS function_sequence JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS context_defaults JSONB DEFAULT '{}';

-- Drop deprecated adapter_path column from chat_actors
ALTER TABLE chat_actors DROP COLUMN IF EXISTS adapter_path;

-- Seed user actor with function sequence
UPDATE chat_actors 
SET function_sequence = '[
  {"function": "submitRequest", "required": true, "waitForResult": true},
  {"function": "selectModel", "required": true, "waitForResult": true},
  {"function": "processResponse", "required": true, "stream": true, "waitForResult": true},
  {"function": "determineActions", "required": false, "waitForResult": false},
  {"function": "persistMessage", "required": false, "waitForResult": false}
]'::jsonb,
context_defaults = '{"displayMode": "ui", "persist": true, "stream": true}'::jsonb
WHERE actor_type = 'user';

-- Seed system actor with function sequence
UPDATE chat_actors 
SET function_sequence = '[
  {"function": "submitRequest", "required": true, "waitForResult": true},
  {"function": "processResponse", "required": true, "stream": false, "waitForResult": true}
]'::jsonb,
context_defaults = '{"displayMode": "silent", "persist": false, "stream": false}'::jsonb
WHERE actor_type = 'system';

-- Seed ai_agent actor with function sequence
UPDATE chat_actors 
SET function_sequence = '[
  {"function": "submitRequest", "required": true, "waitForResult": true},
  {"function": "selectModel", "required": true, "waitForResult": true},
  {"function": "processResponse", "required": true, "stream": true, "waitForResult": true},
  {"function": "determineActions", "required": false, "waitForResult": false}
]'::jsonb,
context_defaults = '{"displayMode": "minimal", "persist": true, "stream": true}'::jsonb
WHERE actor_type = 'ai_agent';