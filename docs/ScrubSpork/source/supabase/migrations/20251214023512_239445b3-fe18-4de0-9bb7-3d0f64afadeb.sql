-- Create cosmo_request_batches table for request batching
CREATE TABLE public.cosmo_request_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  similarity_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'processing', 'completed', 'failed')),
  request_type TEXT NOT NULL,
  request_ids UUID[] NOT NULL DEFAULT '{}',
  combined_prompt TEXT,
  combined_response TEXT,
  response_map JSONB DEFAULT '{}',
  model_used TEXT,
  tokens_saved INTEGER DEFAULT 0,
  api_calls_saved INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  window_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  error_message TEXT
);

-- Create index for finding collecting batches by similarity hash
CREATE INDEX idx_cosmo_batches_hash_collecting ON public.cosmo_request_batches (similarity_hash, status) WHERE status = 'collecting';

-- Create index for finding expired batches
CREATE INDEX idx_cosmo_batches_window_expires ON public.cosmo_request_batches (window_expires_at) WHERE status = 'collecting';

-- Create index for statistics queries
CREATE INDEX idx_cosmo_batches_created_at ON public.cosmo_request_batches (created_at);

-- Enable RLS
ALTER TABLE public.cosmo_request_batches ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy (system operations)
CREATE POLICY "Service role can manage batches"
ON public.cosmo_request_batches
FOR ALL
USING (true)
WITH CHECK (true);

-- Add batch_id column to cosmo_request_queue for linking
ALTER TABLE public.cosmo_request_queue 
ADD COLUMN batch_id UUID REFERENCES public.cosmo_request_batches(id);

-- Create index on batch_id
CREATE INDEX idx_cosmo_queue_batch_id ON public.cosmo_request_queue (batch_id) WHERE batch_id IS NOT NULL;