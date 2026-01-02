-- Add file storage quota column to subscription_tiers
ALTER TABLE subscription_tiers 
ADD COLUMN monthly_file_storage_quota_mb INTEGER DEFAULT NULL;

COMMENT ON COLUMN subscription_tiers.monthly_file_storage_quota_mb IS 'File storage quota in megabytes. NULL means unlimited storage.';