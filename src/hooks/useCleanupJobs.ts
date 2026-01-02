import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CleanupJob {
  id: string;
  job_name: string;
  run_at: string | null;
  success: boolean;
  deleted_count: number | null;
  updated_messages: number | null;
  total_records_checked: number | null;
  orphan_count: number | null;
  details: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
}

export function useCleanupJobs(jobFilter?: string) {
  const queryClient = useQueryClient();
  const sessionToken = localStorage.getItem('system_session_token');

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['cleanup-jobs', jobFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: { 
          action: 'get_cleanup_jobs', 
          session_token: sessionToken,
          job_name: jobFilter 
        }
      });
      
      if (error) throw error;
      return (data?.data || []) as CleanupJob[];
    },
    enabled: !!sessionToken,
    staleTime: 30000,
  });

  const triggerExpiredMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-expired-images', {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Expired images cleanup completed: ${data?.deleted || 0} deleted`);
      queryClient.invalidateQueries({ queryKey: ['cleanup-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Cleanup failed: ${error.message}`);
    }
  });

  const triggerOrphanedMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cleanup-orphaned-files', {
        body: { action: 'detect' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Orphaned files detection completed: ${data?.orphanCount || 0} found`);
      queryClient.invalidateQueries({ queryKey: ['cleanup-jobs'] });
    },
    onError: (error: Error) => {
      toast.error(`Detection failed: ${error.message}`);
    }
  });

  return {
    jobs,
    isLoading,
    refetch,
    triggerExpiredImages: triggerExpiredMutation.mutate,
    triggerOrphanedFiles: triggerOrphanedMutation.mutate,
    isTriggeringExpired: triggerExpiredMutation.isPending,
    isTriggeringOrphaned: triggerOrphanedMutation.isPending,
  };
}
