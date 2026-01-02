-- Add image_url and color_code columns to template tables

-- persona_templates: add image_url and color_code
ALTER TABLE persona_templates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE persona_templates ADD COLUMN IF NOT EXISTS color_code VARCHAR(50);

-- prompt_templates: add image_url and color_code
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS color_code VARCHAR(50);

-- spork_tools: add image_url, color_code, and screenshots
ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS color_code VARCHAR(50);
ALTER TABLE spork_tools ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT '[]';

-- Create template-images bucket for Discover page templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('template-images', 'template-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create appstore-images bucket for App Store tools
INSERT INTO storage.buckets (id, name, public)
VALUES ('appstore-images', 'appstore-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for template-images bucket
CREATE POLICY "Admins can upload template images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'template-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update template images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'template-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete template images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'template-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view template images" ON storage.objects
FOR SELECT USING (bucket_id = 'template-images');

-- RLS policies for appstore-images bucket
CREATE POLICY "Admins can upload appstore images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'appstore-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appstore images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'appstore-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete appstore images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'appstore-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view appstore images" ON storage.objects
FOR SELECT USING (bucket_id = 'appstore-images');