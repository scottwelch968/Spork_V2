import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/logActivity';

export interface SpaceTask {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  creator?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export function useSpaceTasks(spaceId: string) {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['space-tasks', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('task-operations', {
        body: { action: 'get_space_tasks', spaceId },
      });

      if (error) throw error;
      return (data.data || []) as SpaceTask[];
    },
    enabled: !!spaceId,
  });

  const createTask = useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      assigned_to?: string | null;
      due_date?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('task-operations', {
        body: { action: 'create_task', spaceId, task },
      });

      if (error) throw error;
      return { task: data.data, userId: user.id };
    },
    onSuccess: async ({ task, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-tasks', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'created',
        resourceType: 'task',
        resourceId: task.id,
        resourceName: task.title,
        workspaceId: spaceId,
        details: { priority: task.priority, assigned_to: task.assigned_to }
      });
      
      toast.success('Task created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create task');
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: {
      taskId: string;
      updates: Partial<{
        title: string;
        description: string | null;
        status: 'todo' | 'in_progress' | 'done';
        priority: 'low' | 'medium' | 'high';
        assigned_to: string | null;
        due_date: string | null;
      }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const originalTask = tasks.find(t => t.id === taskId);

      const { data, error } = await supabase.functions.invoke('task-operations', {
        body: { action: 'update_task', taskId, updates },
      });

      if (error) throw error;
      return { task: data.data, userId: user.id, originalTask, updates };
    },
    onSuccess: async ({ task, userId, originalTask, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['space-tasks', spaceId] });
      
      const details: Record<string, any> = {};
      
      if (updates.status && originalTask?.status !== updates.status) {
        details.old_status = originalTask?.status;
        details.new_status = updates.status;
      }
      if (updates.assigned_to !== undefined && originalTask?.assigned_to !== updates.assigned_to) {
        details.assigned_to = updates.assigned_to;
      }
      details.updated_fields = Object.keys(updates);
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'updated',
        resourceType: 'task',
        resourceId: task.id,
        resourceName: task.title,
        workspaceId: spaceId,
        details
      });
      
      toast.success('Task updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update task');
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const task = tasks.find(t => t.id === taskId);

      const { error } = await supabase.functions.invoke('task-operations', {
        body: { action: 'delete_task', taskId },
      });

      if (error) throw error;
      return { taskId, taskTitle: task?.title, userId: user.id };
    },
    onSuccess: async ({ taskId, taskTitle, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-tasks', spaceId] });
      
      await logActivity({
        appSection: 'workspace',
        actorId: userId,
        action: 'deleted',
        resourceType: 'task',
        resourceId: taskId,
        resourceName: taskTitle,
        workspaceId: spaceId,
      });
      
      toast.success('Task deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete task');
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
    isCreating: createTask.isPending,
    isUpdating: updateTask.isPending,
    isDeleting: deleteTask.isPending,
  };
}
