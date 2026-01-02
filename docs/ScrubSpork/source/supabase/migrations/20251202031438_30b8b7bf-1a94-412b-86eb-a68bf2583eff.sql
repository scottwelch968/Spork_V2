-- Add new enum values for model_category (must be committed separately from usage)
ALTER TYPE model_category ADD VALUE IF NOT EXISTS 'deep_think';
ALTER TYPE model_category ADD VALUE IF NOT EXISTS 'analysis';
ALTER TYPE model_category ADD VALUE IF NOT EXISTS 'video_generation';