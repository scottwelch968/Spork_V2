-- Add columns for capturing full OpenRouter API request/response data
ALTER TABLE public.cosmo_debug_logs 
ADD COLUMN IF NOT EXISTS api_request_body jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS api_response_headers jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS openrouter_request_id text DEFAULT NULL;