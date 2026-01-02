-- Add icon_url column to ai_models table for storing model/provider icons
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS icon_url text;