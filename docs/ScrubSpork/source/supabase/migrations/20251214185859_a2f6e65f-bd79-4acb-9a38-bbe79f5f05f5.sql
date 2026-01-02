-- PROJECT 1: Security Boundary Hardening
-- Task 1.1: Schema Hardening - NOT NULL constraints and payload validation
-- Task 1.2: RLS Lockdown - Strict policies on all COSMO tables

-- ============================================================
-- TASK 1.1: SCHEMA HARDENING
-- ============================================================

-- First, clean up any NULL values before adding NOT NULL constraints
-- (fail-safe: set to a placeholder if any exist, though queue should be empty)
UPDATE public.cosmo_request_queue 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

UPDATE public.cosmo_request_queue 
SET workspace_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE workspace_id IS NULL;

-- Add NOT NULL constraints to prevent null workspace injection
ALTER TABLE public.cosmo_request_queue
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.cosmo_request_queue
  ALTER COLUMN workspace_id SET NOT NULL;

-- Create payload validation trigger (triggers instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_cosmo_request_payload()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure payload is a JSON object
  IF jsonb_typeof(NEW.request_payload) != 'object' THEN
    RAISE EXCEPTION 'request_payload must be a JSON object';
  END IF;
  
  -- Ensure payload contains required fields
  IF NOT (NEW.request_payload ? 'messages') THEN
    RAISE EXCEPTION 'request_payload must contain messages array';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to cosmo_request_queue
DROP TRIGGER IF EXISTS validate_cosmo_payload_trigger ON public.cosmo_request_queue;
CREATE TRIGGER validate_cosmo_payload_trigger
  BEFORE INSERT OR UPDATE ON public.cosmo_request_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cosmo_request_payload();

-- ============================================================
-- TASK 1.2: RLS LOCKDOWN - DROP PERMISSIVE POLICIES
-- ============================================================

-- Drop overly permissive policies on cosmo_action_mappings
DROP POLICY IF EXISTS "Authenticated users can read action mappings" ON public.cosmo_action_mappings;

-- Drop overly permissive policies on cosmo_function_chains  
DROP POLICY IF EXISTS "Authenticated users can read function chains" ON public.cosmo_function_chains;

-- Drop overly permissive policies on cosmo_intents
DROP POLICY IF EXISTS "Authenticated users can read intents" ON public.cosmo_intents;

-- Drop overly permissive policies on cosmo_request_queue
DROP POLICY IF EXISTS "Service can manage queue" ON public.cosmo_request_queue;
DROP POLICY IF EXISTS "Admins can manage queue" ON public.cosmo_request_queue;
DROP POLICY IF EXISTS "Users can view own queue items" ON public.cosmo_request_queue;

-- ============================================================
-- TASK 1.2: RLS LOCKDOWN - CREATE STRICT POLICIES
-- ============================================================

-- cosmo_action_mappings: Admin-only access
CREATE POLICY "Admin only: manage action mappings"
ON public.cosmo_action_mappings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- cosmo_function_chains: Admin-only access
CREATE POLICY "Admin only: manage function chains"
ON public.cosmo_function_chains
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- cosmo_intents: Admin-only access
CREATE POLICY "Admin only: manage intents"
ON public.cosmo_intents
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- cosmo_request_queue: Users can ONLY view their own items (read-only)
CREATE POLICY "Users can view own queue items only"
ON public.cosmo_request_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- cosmo_request_queue: Admin read access for monitoring
CREATE POLICY "Admin can view all queue items"
ON public.cosmo_request_queue
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- NO INSERT/UPDATE/DELETE policies for regular users on cosmo_request_queue
-- Only service role (edge functions) can write to this table
-- This is enforced by having no permissive INSERT/UPDATE/DELETE policies