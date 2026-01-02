-- Add columns for better progress tracking
ALTER TABLE public.project_analysis_reports 
ADD COLUMN IF NOT EXISTS current_phase_name text,
ADD COLUMN IF NOT EXISTS phase_details jsonb DEFAULT '[]'::jsonb;

-- Enable realtime for instant progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE project_analysis_reports;