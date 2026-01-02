-- Make user-files bucket public so saved images can be loaded from chat history
UPDATE storage.buckets SET public = true WHERE id = 'user-files';