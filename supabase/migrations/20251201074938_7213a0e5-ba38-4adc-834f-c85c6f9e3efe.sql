-- Create space_tasks table for workspace task management
CREATE TABLE public.space_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.space_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view tasks in their spaces
CREATE POLICY "Members can view space tasks"
ON public.space_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_tasks.space_id
    AND (
      workspaces.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = space_tasks.space_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only owners can create tasks
CREATE POLICY "Owners can create tasks"
ON public.space_tasks
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_tasks.space_id
    AND workspaces.owner_id = auth.uid()
  )
);

-- Policy: All members can update tasks
CREATE POLICY "Members can update tasks"
ON public.space_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_tasks.space_id
    AND (
      workspaces.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = space_tasks.space_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
);

-- Policy: Only owners can delete tasks
CREATE POLICY "Owners can delete tasks"
ON public.space_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspaces
    WHERE workspaces.id = space_tasks.space_id
    AND workspaces.owner_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_space_tasks_updated_at
BEFORE UPDATE ON public.space_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();