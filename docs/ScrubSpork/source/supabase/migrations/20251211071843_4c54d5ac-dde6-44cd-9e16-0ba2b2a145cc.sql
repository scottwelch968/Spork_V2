-- Add skill_level field to prompt_templates
ALTER TABLE public.prompt_templates
ADD COLUMN skill_level text DEFAULT 'all';