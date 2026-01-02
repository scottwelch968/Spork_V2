-- Add display_mode and icon columns to template tables
ALTER TABLE space_templates ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'icon';
ALTER TABLE space_templates ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Boxes';

ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'icon';
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'FileText';

ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'icon';
ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS color_code TEXT;