-- Add image_url column to space_templates
ALTER TABLE space_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Populate existing persona templates with default avatars and colors using simpler approach
-- Use md5 hash to get a deterministic number from UUID
UPDATE persona_templates 
SET 
  image_url = CASE 
    WHEN image_url IS NULL THEN 
      'https://mfoeucdqopqivjzenlrt.supabase.co/storage/v1/object/public/app-media/templates/avatars/avatar_' ||
      CASE WHEN (('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 10) < 5 THEN 'man' ELSE 'woman' END ||
      '_0' || (abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 5) + 1)::text || '.png'
    ELSE image_url 
  END,
  color_code = CASE 
    WHEN color_code IS NULL THEN 
      CASE 
        WHEN (('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 10) < 5 THEN
          (ARRAY['bg-blue-500', 'bg-gray-500', 'bg-slate-600', 'bg-blue-600', 'bg-gray-600'])[abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 5) + 1]
        ELSE
          (ARRAY['bg-pink-500', 'bg-yellow-500', 'bg-orange-500', 'bg-rose-500', 'bg-amber-500'])[abs(('x' || substr(md5(id::text), 1, 8))::bit(32)::int % 5) + 1]
      END
    ELSE color_code
  END
WHERE image_url IS NULL OR color_code IS NULL;