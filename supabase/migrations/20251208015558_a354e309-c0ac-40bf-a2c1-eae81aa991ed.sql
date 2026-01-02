-- Add default_model column to spork_projects table
ALTER TABLE public.spork_projects 
ADD COLUMN IF NOT EXISTS default_model TEXT DEFAULT NULL;