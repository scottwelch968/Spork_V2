import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailRuleLog {
  id: string;
  rule_id: string;
  event_type: string;
  event_id?: string;
  event_payload: any;
  recipient_email: string;
  template_id: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  error_message?: string;
  processing_time_ms?: number;
  triggered_at: string;
  sent_at?: string;
}

export const useEmailRuleLogs = () => {
  const [logs, setLogs] = useState<EmailRuleLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async (filters?: {
    event_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('email_rule_logs')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.start_date) {
        query = query.gte('triggered_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('triggered_at', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as EmailRuleLog[]);
    } catch (error: any) {
      console.error('Error loading rule logs:', error);
      toast.error('Failed to load rule logs');
    } finally {
      setLoading(false);
    }
  };

  const retryFailed = async (logId: string) => {
    try {
      const log = logs.find(l => l.id === logId);
      if (!log) throw new Error('Log not found');

      // Re-trigger the event
      const { error } = await supabase.functions.invoke('process-system-event', {
        body: {
          event_type: log.event_type,
          event_id: log.event_id,
          user: {
            id: 'retry',
            email: log.recipient_email,
          },
          data: log.event_payload,
        },
      });

      if (error) throw error;
      toast.success('Email retry initiated');
      await loadLogs();
    } catch (error: any) {
      console.error('Error retrying email:', error);
      toast.error('Failed to retry email');
      throw error;
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return {
    logs,
    loading,
    loadLogs,
    retryFailed,
  };
};
