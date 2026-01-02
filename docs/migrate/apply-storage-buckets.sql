-- =====================================================
-- SPORK STORAGE BUCKETS MIGRATION
-- Complete storage bucket setup with RLS policies
-- Generated for external Supabase project migration
-- =====================================================

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

-- Knowledge Base Bucket (PRIVATE)
-- Used for document storage, parsed documents, embeddings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- User Files Bucket (PUBLIC)
-- Used for user-uploaded files, attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  true,
  104857600, -- 100MB limit
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- App Media Bucket (PUBLIC)
-- Used for generated images, AI-created content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-media',
  'app-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Template Images Bucket (PUBLIC)
-- Used for persona/prompt/space template images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'template-images',
  'template-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- App Store Images Bucket (PUBLIC)
-- Used for tool/app icons and screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'appstore-images',
  'appstore-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- =====================================================
-- 2. KNOWLEDGE-BASE BUCKET POLICIES (PRIVATE)
-- =====================================================

-- View policy: Workspace members can view
DROP POLICY IF EXISTS "Workspace members can view knowledge base files" ON storage.objects;
CREATE POLICY "Workspace members can view knowledge base files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-base'
  AND (
    -- Check via knowledge_base table reference
    EXISTS (
      SELECT 1 FROM knowledge_base kb
      JOIN workspaces w ON w.id = kb.workspace_id
      WHERE kb.storage_path = name
      AND (
        w.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM workspace_members wm
          WHERE wm.workspace_id = w.id AND wm.user_id = auth.uid()
        )
      )
    )
  )
);

-- Upload policy: Workspace members can upload
DROP POLICY IF EXISTS "Workspace members can upload to knowledge base" ON storage.objects;
CREATE POLICY "Workspace members can upload to knowledge base"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base'
  AND auth.uid() IS NOT NULL
);

-- Delete policy: Workspace owners can delete
DROP POLICY IF EXISTS "Workspace owners can delete knowledge base files" ON storage.objects;
CREATE POLICY "Workspace owners can delete knowledge base files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base'
  AND (
    EXISTS (
      SELECT 1 FROM knowledge_base kb
      JOIN workspaces w ON w.id = kb.workspace_id
      WHERE kb.storage_path = name
      AND w.owner_id = auth.uid()
    )
  )
);

-- =====================================================
-- 3. USER-FILES BUCKET POLICIES (PUBLIC)
-- =====================================================

-- View policy: Anyone can view (public bucket)
DROP POLICY IF EXISTS "Anyone can view user files" ON storage.objects;
CREATE POLICY "Anyone can view user files"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-files');

-- Upload policy: Authenticated users can upload to their folder
DROP POLICY IF EXISTS "Users can upload to their folder" ON storage.objects;
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update policy: Users can update their own files
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete policy: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 4. APP-MEDIA BUCKET POLICIES (PUBLIC)
-- =====================================================

-- View policy: Anyone can view (public bucket)
DROP POLICY IF EXISTS "Anyone can view app media" ON storage.objects;
CREATE POLICY "Anyone can view app media"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-media');

-- Upload policy: Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated users can upload app media" ON storage.objects;
CREATE POLICY "Authenticated users can upload app media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-media'
  AND auth.uid() IS NOT NULL
);

-- Delete policy: Users can delete their own media (based on folder structure)
DROP POLICY IF EXISTS "Users can delete their app media" ON storage.objects;
CREATE POLICY "Users can delete their app media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- =====================================================
-- 5. TEMPLATE-IMAGES BUCKET POLICIES (PUBLIC)
-- =====================================================

-- View policy: Anyone can view (public bucket)
DROP POLICY IF EXISTS "Anyone can view template images" ON storage.objects;
CREATE POLICY "Anyone can view template images"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-images');

-- Upload policy: Only admins can upload template images
DROP POLICY IF EXISTS "Admins can upload template images" ON storage.objects;
CREATE POLICY "Admins can upload template images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'template-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Update policy: Only admins can update
DROP POLICY IF EXISTS "Admins can update template images" ON storage.objects;
CREATE POLICY "Admins can update template images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'template-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Delete policy: Only admins can delete
DROP POLICY IF EXISTS "Admins can delete template images" ON storage.objects;
CREATE POLICY "Admins can delete template images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'template-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- 6. APPSTORE-IMAGES BUCKET POLICIES (PUBLIC)
-- =====================================================

-- View policy: Anyone can view (public bucket)
DROP POLICY IF EXISTS "Anyone can view appstore images" ON storage.objects;
CREATE POLICY "Anyone can view appstore images"
ON storage.objects FOR SELECT
USING (bucket_id = 'appstore-images');

-- Upload policy: Only admins can upload
DROP POLICY IF EXISTS "Admins can upload appstore images" ON storage.objects;
CREATE POLICY "Admins can upload appstore images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'appstore-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Update policy: Only admins can update
DROP POLICY IF EXISTS "Admins can update appstore images" ON storage.objects;
CREATE POLICY "Admins can update appstore images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'appstore-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Delete policy: Only admins can delete
DROP POLICY IF EXISTS "Admins can delete appstore images" ON storage.objects;
CREATE POLICY "Admins can delete appstore images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'appstore-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- VERIFICATION QUERY
-- Run after applying to verify buckets were created
-- =====================================================
-- SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets;
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'storage';
