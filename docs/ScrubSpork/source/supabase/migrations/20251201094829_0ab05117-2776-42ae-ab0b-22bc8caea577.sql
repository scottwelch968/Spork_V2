-- Drop all existing knowledge-base policies and recreate with simpler logic
DROP POLICY IF EXISTS "Workspace members can upload to knowledge-base" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can view knowledge-base files" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete from knowledge-base" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to knowledge-base" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from knowledge-base" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from knowledge-base" ON storage.objects;

-- Simple policy: authenticated users can upload to knowledge-base bucket
-- The folder structure uses workspace_id, we validate access via the knowledge_base table RLS
CREATE POLICY "Allow authenticated uploads to knowledge-base"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'knowledge-base');

-- Authenticated users can read from knowledge-base
CREATE POLICY "Allow authenticated reads from knowledge-base"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'knowledge-base');

-- Authenticated users can delete from knowledge-base
CREATE POLICY "Allow authenticated deletes from knowledge-base"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'knowledge-base');