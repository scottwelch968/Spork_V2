-- Add enhanced configuration columns to chat_containers
ALTER TABLE chat_containers 
ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS target_actors TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS display_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS style_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS format_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deletable BOOLEAN DEFAULT true;

-- Add constraint for valid content types
ALTER TABLE chat_containers 
ADD CONSTRAINT chat_containers_content_type_check 
CHECK (content_type IN ('text', 'image', 'map', 'code', 'table', 'media', 'custom'));

-- Update existing containers with appropriate configurations
UPDATE chat_containers SET 
  content_type = 'text',
  is_core = true,
  is_deletable = false,
  display_config = '{"layout": "inline", "showHeader": false}'::jsonb,
  style_config = '{"variant": "default"}'::jsonb
WHERE container_key = 'user-message';

UPDATE chat_containers SET 
  content_type = 'text',
  is_core = true,
  is_deletable = false,
  display_config = '{"layout": "card", "showHeader": true, "maxWidth": "lg"}'::jsonb,
  style_config = '{"variant": "default", "bgClass": "bg-muted/30"}'::jsonb,
  format_config = '{"markdown": true, "codeHighlight": true}'::jsonb
WHERE container_key = 'model-response';

UPDATE chat_containers SET 
  content_type = 'custom',
  is_core = true,
  is_deletable = false,
  display_config = '{"layout": "inline", "showHeader": false}'::jsonb,
  style_config = '{"variant": "minimal"}'::jsonb
WHERE container_key = 'action-toolbar';

UPDATE chat_containers SET 
  content_type = 'map',
  is_core = false,
  is_deletable = true,
  display_config = '{"layout": "card", "aspectRatio": "16:9", "maxWidth": "md"}'::jsonb,
  style_config = '{"variant": "default", "borderClass": "border-primary/20"}'::jsonb,
  format_config = '{"mapStyle": "roadmap", "defaultZoom": 14}'::jsonb
WHERE container_key = 'maps-container';