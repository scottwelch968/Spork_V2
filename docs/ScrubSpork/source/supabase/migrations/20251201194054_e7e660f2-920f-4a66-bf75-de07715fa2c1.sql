-- Drop the restrictive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload to generated folder" ON storage.objects;

-- Create a more flexible policy for authenticated users to upload to app-media
CREATE POLICY "Authenticated users can upload to app-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-media');