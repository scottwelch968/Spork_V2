-- Phase 3: Cosmo God Layer Database Schema

-- 1. Cosmo Intent Registry - stores known intents with routing rules
CREATE TABLE public.cosmo_intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  keywords TEXT[] DEFAULT '{}',
  required_functions TEXT[] DEFAULT '{}',
  preferred_models TEXT[] DEFAULT '{}',
  context_needs TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Cosmo Function Chains - defines sequences of functions for complex tasks
CREATE TABLE public.cosmo_function_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  trigger_intents TEXT[] DEFAULT '{}',
  function_sequence JSONB NOT NULL DEFAULT '[]',
  fallback_chain_id UUID REFERENCES public.cosmo_function_chains(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Add Cosmo-specific fields to chat_functions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_functions' AND column_name = 'cosmo_priority') THEN
    ALTER TABLE public.chat_functions ADD COLUMN cosmo_priority INTEGER DEFAULT 50;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_functions' AND column_name = 'requires_context') THEN
    ALTER TABLE public.chat_functions ADD COLUMN requires_context TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_functions' AND column_name = 'output_format') THEN
    ALTER TABLE public.chat_functions ADD COLUMN output_format TEXT DEFAULT 'text';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.cosmo_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmo_function_chains ENABLE ROW LEVEL SECURITY;

-- RLS policies - read-only for authenticated users (admin manages via service role)
CREATE POLICY "Authenticated users can read intents" ON public.cosmo_intents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read function chains" ON public.cosmo_function_chains
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_cosmo_intents_category ON public.cosmo_intents(category);
CREATE INDEX idx_cosmo_intents_active ON public.cosmo_intents(is_active);
CREATE INDEX idx_cosmo_function_chains_active ON public.cosmo_function_chains(is_active);

-- Seed initial intents based on Cosmo categories
INSERT INTO public.cosmo_intents (intent_key, display_name, description, category, keywords, required_functions) VALUES
  ('coding', 'Code Assistance', 'Programming and development tasks', 'coding', ARRAY['code', 'program', 'function', 'debug', 'error', 'api', 'javascript', 'python', 'typescript'], ARRAY['chat']),
  ('analysis', 'Data Analysis', 'Analyzing data, documents, or complex information', 'analysis', ARRAY['analyze', 'compare', 'evaluate', 'assess', 'review', 'data', 'statistics'], ARRAY['chat']),
  ('creative', 'Creative Writing', 'Creative content generation', 'creative', ARRAY['write', 'story', 'poem', 'creative', 'imagine', 'fiction', 'narrative'], ARRAY['chat']),
  ('conversation', 'General Conversation', 'Casual chat and Q&A', 'conversation', ARRAY['hello', 'hi', 'hey', 'thanks', 'help', 'what', 'how', 'why'], ARRAY['chat']),
  ('reasoning', 'Complex Reasoning', 'Multi-step logical reasoning', 'reasoning', ARRAY['solve', 'calculate', 'prove', 'logic', 'math', 'puzzle', 'problem'], ARRAY['chat']),
  ('research', 'Research Tasks', 'Information gathering and synthesis', 'research', ARRAY['research', 'find', 'search', 'learn', 'discover', 'information'], ARRAY['chat']),
  ('summarization', 'Summarization', 'Condensing information', 'summarization', ARRAY['summarize', 'tldr', 'brief', 'overview', 'key points', 'recap'], ARRAY['chat']),
  ('translation', 'Translation', 'Language translation tasks', 'translation', ARRAY['translate', 'spanish', 'french', 'german', 'chinese', 'language'], ARRAY['chat'])
ON CONFLICT (intent_key) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER update_cosmo_intents_updated_at
  BEFORE UPDATE ON public.cosmo_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cosmo_function_chains_updated_at
  BEFORE UPDATE ON public.cosmo_function_chains
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();