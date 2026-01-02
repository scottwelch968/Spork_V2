-- Create activity_log table - Activity-centric logging system
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- WHERE: App section where activity occurred
  app_section TEXT NOT NULL,
  
  -- WHO: The actor performing the action
  actor_type TEXT NOT NULL DEFAULT 'user',
  actor_id UUID,
  
  -- WHAT: The action taken (verb)
  action TEXT NOT NULL,
  
  -- ON WHAT: The resource affected (noun)
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  
  -- CONTEXT: Optional workspace association
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- METADATA
  details JSONB DEFAULT '{}',
  
  -- TIMESTAMP
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_activity_log_actor ON public.activity_log(actor_type, actor_id);
CREATE INDEX idx_activity_log_app_section ON public.activity_log(app_section);
CREATE INDEX idx_activity_log_workspace ON public.activity_log(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_resource ON public.activity_log(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities (where they are the actor)
CREATE POLICY "Users can view own activities"
ON public.activity_log FOR SELECT
USING (actor_type = 'user' AND actor_id = auth.uid());

-- Users can view activities in workspaces they own or are members of
CREATE POLICY "Users can view workspace activities"
ON public.activity_log FOR SELECT
USING (
  workspace_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = activity_log.workspace_id AND user_id = auth.uid())
  )
);

-- Users can insert their own activities
CREATE POLICY "Users can log activities"
ON public.activity_log FOR INSERT
WITH CHECK (actor_type = 'user' AND actor_id = auth.uid());