-- Create public bucket for app media
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-media', 'app-media', true);

-- RLS policy: Public read access for all app media
CREATE POLICY "Public read access for app media"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-media');

-- RLS policy: Authenticated users can upload to generated folder
CREATE POLICY "Authenticated users can upload to generated folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-media' AND (storage.foldername(name))[1] = 'generated');

-- RLS policy: Service role has full access
CREATE POLICY "Service role full access to app media"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'app-media');