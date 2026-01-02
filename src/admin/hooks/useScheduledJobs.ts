import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduledJob {
  id: string;
  job_name: string;
  description: string | null;
  target_function: string;
  schedule_expression: string;
  schedule_description: string | null;
  request_body: Record<string, unknown>;
  is_active: boolean;
  last_run_at: string | null;
  last_run_success: boolean | null;
  created_at: string;
  updated_at: string;
}

interface CreateJobParams {
  jobName: string;
  description?: string;
  targetFunction: string;
  scheduleExpression: string;
  scheduleDescription?: string;
  requestBody?: Record<string, unknown>;
}

export function useScheduledJobs() {
  const queryClient = useQueryClient();
  
  const getSessionToken = () => {
    const token = localStorage.getItem('system_session_token');
    if (!token) throw new Error('Not authenticated');
    return token;
  };

  // Fetch all scheduled jobs
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      const response = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'get_scheduled_jobs', 
          session_token: sessionToken 
        }
      });
      
      if (response.error) throw response.error;
      return (response.data?.data || []) as ScheduledJob[];
    },
    staleTime: 30000,
  });

  // Toggle job active status
  const toggleMutation = useMutation({
    mutationFn: async ({ jobId, isActive }: { jobId: string; isActive: boolean }) => {
      const sessionToken = getSessionToken();
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'update_scheduled_job',
          session_token: sessionToken,
          job_id: jobId,
          updates: { is_active: isActive }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Job ${variables.isActive ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle job: ${error.message}`);
    }
  });

  // Run job immediately
  const runNowMutation = useMutation({
    mutationFn: async ({ jobId, jobName }: { jobId: string; jobName: string }) => {
      const sessionToken = getSessionToken();
      const job = jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');
      
      const { data, error } = await supabase.functions.invoke(job.target_function, {
        body: job.request_body || {}
      });
      
      if (error) throw error;
      
      await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'update_scheduled_job',
          session_token: sessionToken,
          job_id: jobId,
          updates: { 
            last_run_at: new Date().toISOString(),
            last_run_success: true
          }
        }
      });
      
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Job "${variables.jobName}" executed successfully`);
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['cleanup-jobs'] });
    },
    onError: (error: Error, variables) => {
      toast.error(`Job "${variables.jobName}" failed: ${error.message}`);
      const sessionToken = localStorage.getItem('system_session_token');
      if (sessionToken) {
        supabase.functions.invoke('admin-data', {
          body: { 
            action: 'update_scheduled_job',
            session_token: sessionToken,
            job_id: variables.jobId,
            updates: { 
              last_run_at: new Date().toISOString(),
              last_run_success: false
            }
          }
        });
      }
    }
  });

  // Create new scheduled job
  const createMutation = useMutation({
    mutationFn: async (params: CreateJobParams) => {
      const sessionToken = getSessionToken();
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'create_scheduled_job',
          session_token: sessionToken,
          job_data: {
            job_name: params.jobName,
            description: params.description,
            target_function: params.targetFunction,
            schedule_expression: params.scheduleExpression,
            schedule_description: params.scheduleDescription,
            request_body: params.requestBody || {},
            is_active: true
          }
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Scheduled job created successfully');
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create job: ${error.message}`);
    }
  });

  // Delete scheduled job
  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const sessionToken = getSessionToken();
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'delete_scheduled_job',
          session_token: sessionToken,
          job_id: jobId
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Scheduled job deleted');
      queryClient.invalidateQueries({ queryKey: ['scheduled-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    }
  });

  return {
    jobs,
    isLoading,
    refetch,
    toggleJob: toggleMutation.mutate,
    runJobNow: runNowMutation.mutateAsync,
    createJob: createMutation.mutateAsync,
    deleteJob: deleteMutation.mutate,
    isToggling: toggleMutation.isPending,
    isRunning: runNowMutation.isPending,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
