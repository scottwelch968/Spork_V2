-- Create table for storing project analysis reports
CREATE TABLE public.project_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  phases_total INTEGER NOT NULL DEFAULT 1,
  phases_completed INTEGER NOT NULL DEFAULT 0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  files_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.project_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Admins can manage all reports
CREATE POLICY "Admins can manage analysis reports"
ON public.project_analysis_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.project_analysis_reports
FOR SELECT
USING (auth.uid() = user_id);