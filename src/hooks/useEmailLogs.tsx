import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailLog {
  id: string;
  provider_id: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface UseEmailLogsOptions {
  status?: string;
  providerId?: string;
  search?: string;
  limit?: number;
}

const getSessionToken = () => localStorage.getItem('system_session_token');

const invokeAdminData = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: getSessionToken(), ...params }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const useEmailLogs = (options: UseEmailLogsOptions = {}) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invokeAdminData('get_email_logs', {
        status: options.status,
        providerId: options.providerId,
        search: options.search,
        limit: options.limit,
      });
      setLogs((result.data || []) as EmailLog[]);
    } catch (error: any) {
      toast({
        title: 'Error loading email logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [options.status, options.providerId, options.search, options.limit, toast]);

  useEffect(() => {
    loadLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('email_logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_logs',
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLogs]);

  return {
    logs,
    loading,
    loadLogs,
  };
};
