-- Chat Functions Registry
CREATE TABLE public.chat_functions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'core',
  input_schema JSONB DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  events_emitted TEXT[] DEFAULT '{}',
  depends_on TEXT[] DEFAULT '{}',
  code_path TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_core BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat Actors Registry
CREATE TABLE public.chat_actors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  adapter_path TEXT,
  allowed_functions TEXT[] DEFAULT '{}',
  default_display_mode TEXT DEFAULT 'ui' CHECK (default_display_mode IN ('ui', 'minimal', 'silent')),
  is_enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Chat Containers Registry
CREATE TABLE public.chat_containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  container_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subscribes_to TEXT[] DEFAULT '{}',
  function_key TEXT REFERENCES public.chat_functions(function_key) ON DELETE SET NULL,
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_containers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can manage, users can read
CREATE POLICY "Admins can manage chat functions" ON public.chat_functions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view enabled functions" ON public.chat_functions FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage chat actors" ON public.chat_actors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view enabled actors" ON public.chat_actors FOR SELECT USING (is_enabled = true);

CREATE POLICY "Admins can manage chat containers" ON public.chat_containers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view enabled containers" ON public.chat_containers FOR SELECT USING (is_enabled = true);

-- Seed Functions
INSERT INTO public.chat_functions (function_key, name, description, category, input_schema, output_schema, events_emitted, depends_on, code_path, is_core, display_order) VALUES
('submitRequest', 'Submit Request', 'Entry point for all chat interactions. Validates input and initiates the request pipeline.', 'core', 
  '{"actor": "Actor object with type and id", "content": "Message content string", "context": "RequestContext with displayMode, workspaceId, chatId", "model": "Optional model override", "attachments": "Optional file attachments"}',
  '{"requestId": "Unique request identifier", "actor": "Actor who made request", "context": "Full request context", "content": "Original content", "timestamp": "Request timestamp"}',
  ARRAY['request:submitted', 'request:validated', 'error:occurred'], ARRAY[]::TEXT[], 'src/lib/chatFunctions/submitRequest.ts', true, 1),

('selectModel', 'Select Model', 'Determines which AI model to use based on request context and Cosmo routing.', 'core',
  '{"request": "DataRequest from submitRequest", "availableModels": "Optional array of model IDs to choose from"}',
  '{"requestId": "Request identifier", "requestedModel": "Model requested by user", "selectedModel": "Actual model selected", "selectedModelName": "Display name", "useCosmo": "Whether Cosmo routing was used"}',
  ARRAY['model:selecting', 'model:selected', 'model:ready'], ARRAY['submitRequest'], 'src/lib/chatFunctions/selectModel.ts', true, 2),

('processResponse', 'Process Response', 'Handles streaming response from AI model and emits chunks for UI consumption.', 'core',
  '{"request": "DataRequest", "selection": "ModelSelection from selectModel", "onChunk": "Optional callback for each chunk"}',
  '{"requestId": "Request identifier", "content": "Full response content", "model": "Model that generated response", "tokensUsed": "Token count", "metadata": "Response metadata including Cosmo info"}',
  ARRAY['response:started', 'response:chunk', 'response:metadata', 'response:complete'], ARRAY['selectModel'], 'src/lib/chatFunctions/processResponse.ts', true, 3),

('determineActions', 'Determine Actions', 'Analyzes response content to determine available action buttons.', 'ui',
  '{"response": "ResponseComplete from processResponse", "context": "RequestContext"}',
  '{"requestId": "Request identifier", "actions": "Array of available actions with id, label, icon, handler"}',
  ARRAY['actions:determining', 'actions:determined'], ARRAY['processResponse'], 'src/lib/chatFunctions/determineActions.ts', false, 4),

('persistMessage', 'Persist Message', 'Saves messages to database for chat history.', 'persistence',
  '{"chatId": "Chat UUID", "content": "Message content", "role": "user or assistant", "model": "Model used", "metadata": "Optional metadata"}',
  '{"messageId": "Created message UUID", "chatId": "Chat UUID", "persisted": "Success boolean"}',
  ARRAY['message:persisting', 'message:persisted'], ARRAY[]::TEXT[], 'src/lib/chatFunctions/persistMessage.ts', true, 5),

('documentEditor', 'Document Editor', 'In-chat document editing with export capabilities.', 'feature',
  '{"content": "Document content", "format": "markdown, html, or plain", "action": "edit, export, save"}',
  '{"documentId": "Document identifier", "content": "Updated content", "exportUrl": "URL if exported"}',
  ARRAY['document:opened', 'document:saved', 'document:exported'], ARRAY['processResponse'], 'src/lib/chatFunctions/documentEditor.ts', false, 6),

('codeExecution', 'Code Execution', 'Execute code snippets in sandboxed environment.', 'feature',
  '{"code": "Code to execute", "language": "Programming language", "sandbox": "Sandbox configuration"}',
  '{"output": "Execution output", "error": "Error if any", "executionTime": "Time in ms"}',
  ARRAY['code:executing', 'code:completed', 'code:error'], ARRAY['processResponse'], 'src/lib/chatFunctions/codeExecution.ts', false, 7);

-- Seed Actors
INSERT INTO public.chat_actors (actor_type, name, description, adapter_path, allowed_functions, default_display_mode, is_system, display_order) VALUES
('user', 'Human User', 'End user interacting through the chat UI.', 'src/lib/chatFunctions/adapters/userAdapter.ts', 
  ARRAY['submitRequest', 'selectModel', 'processResponse', 'determineActions', 'persistMessage', 'documentEditor', 'codeExecution'], 'ui', false, 1),

('editor', 'Spork Editor', 'AI-powered code editor assistant.', 'src/lib/chatFunctions/adapters/editorAdapter.ts',
  ARRAY['submitRequest', 'selectModel', 'processResponse', 'codeExecution'], 'minimal', false, 2),

('agent', 'AI Agent', 'Autonomous AI agent performing tasks.', 'src/lib/chatFunctions/adapters/systemAdapter.ts',
  ARRAY['submitRequest', 'selectModel', 'processResponse', 'persistMessage'], 'silent', false, 3),

('system', 'System Process', 'Internal system operations and background tasks.', 'src/lib/chatFunctions/adapters/systemAdapter.ts',
  ARRAY['submitRequest', 'selectModel', 'processResponse', 'persistMessage'], 'silent', true, 4),

('webhook', 'Webhook Handler', 'External webhook integrations.', 'src/lib/chatFunctions/adapters/systemAdapter.ts',
  ARRAY['submitRequest', 'processResponse'], 'silent', true, 5);

-- Seed Containers
INSERT INTO public.chat_containers (container_key, name, description, subscribes_to, function_key, display_order) VALUES
('user-message', 'User Message', 'Displays user input messages in the chat.', ARRAY['request:submitted', 'request:validated'], 'submitRequest', 1),
('action-message', 'Action Message', 'Shows model selection and routing information.', ARRAY['model:selecting', 'model:selected', 'model:ready'], 'selectModel', 2),
('model-response', 'Model Response', 'Renders streaming AI response content.', ARRAY['response:started', 'response:chunk', 'response:complete', 'response:metadata'], 'processResponse', 3),
('action-buttons', 'Action Buttons', 'Displays available actions for the response.', ARRAY['actions:determining', 'actions:determined'], 'determineActions', 4),
('document-editor', 'Document Editor', 'In-chat document editing interface.', ARRAY['document:opened', 'document:saved', 'document:exported'], 'documentEditor', 5),
('code-sandbox', 'Code Sandbox', 'Code execution and preview container.', ARRAY['code:executing', 'code:completed', 'code:error'], 'codeExecution', 6);

-- Update triggers
CREATE TRIGGER update_chat_functions_updated_at BEFORE UPDATE ON public.chat_functions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_chat_actors_updated_at BEFORE UPDATE ON public.chat_actors FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_chat_containers_updated_at BEFORE UPDATE ON public.chat_containers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();