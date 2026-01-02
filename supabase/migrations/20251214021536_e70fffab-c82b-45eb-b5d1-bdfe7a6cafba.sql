-- Create priority enum
CREATE TYPE cosmo_queue_priority AS ENUM ('low', 'normal', 'high', 'critical');

-- Create status enum  
CREATE TYPE cosmo_queue_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired');

-- Create request queue table
CREATE TABLE public.cosmo_request_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  priority cosmo_queue_priority NOT NULL DEFAULT 'normal',
  priority_score INTEGER NOT NULL DEFAULT 50,
  request_type TEXT NOT NULL DEFAULT 'chat',
  request_payload JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  status cosmo_queue_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  result_payload JSONB,
  error_message TEXT,
  callback_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 hour'),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  processing_node TEXT
);

-- Create index for efficient queue polling (pending items ordered by priority)
CREATE INDEX idx_cosmo_queue_pending ON cosmo_request_queue 
  (status, priority_score DESC, created_at ASC) 
  WHERE status = 'pending';

-- Create index for user lookups
CREATE INDEX idx_cosmo_queue_user ON cosmo_request_queue (user_id, status);

-- Create index for workspace lookups
CREATE INDEX idx_cosmo_queue_workspace ON cosmo_request_queue (workspace_id, status);

-- Create index for expiry cleanup
CREATE INDEX idx_cosmo_queue_expires ON cosmo_request_queue (expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.cosmo_request_queue ENABLE ROW LEVEL SECURITY;

-- Admins can manage all queue items
CREATE POLICY "Admins can manage queue" ON public.cosmo_request_queue
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own queued requests
CREATE POLICY "Users can view own queue items" ON public.cosmo_request_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage queue (for edge functions)
CREATE POLICY "Service can manage queue" ON public.cosmo_request_queue
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Add comment
COMMENT ON TABLE public.cosmo_request_queue IS 'Priority queue for COSMO request processing with support for async callbacks';