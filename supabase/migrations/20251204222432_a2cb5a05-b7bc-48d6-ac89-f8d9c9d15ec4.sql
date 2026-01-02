-- Add operation_type column to distinguish between chat and enhance_prompt operations
ALTER TABLE public.cosmo_debug_logs 
ADD COLUMN IF NOT EXISTS operation_type text DEFAULT 'chat';

-- Update existing logs to have operation_type = 'chat'
UPDATE public.cosmo_debug_logs SET operation_type = 'chat' WHERE operation_type IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.cosmo_debug_logs.operation_type IS 'Type of Cosmo operation: chat, enhance_prompt';