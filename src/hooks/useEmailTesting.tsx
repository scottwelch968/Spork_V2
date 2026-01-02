import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TestEventPayload {
  event_type: string;
  user_id?: string;
  data: Record<string, any>;
}

export interface EmailStats {
  total_sent: number;
  total_failed: number;
  sent_today: number;
  sent_week: number;
  sent_month: number;
  success_rate: number;
}

export const useEmailTesting = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const { toast } = useToast();

  const triggerTestEvent = async (payload: TestEventPayload) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-system-event', {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: 'Test event triggered',
        description: `Event "${payload.event_type}" processed successfully`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to trigger event',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async (logId: string) => {
    setLoading(true);
    try {
      // Get the original email log
      const { data: log, error: logError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError || !log) throw new Error('Email log not found');

      // Resend using the send-email function
      const metadata = log.metadata as Record<string, any> | null;
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: log.recipient_email,
          subject: log.subject,
          html: metadata?.html_content || '<p>Resent email</p>',
        },
      });

      if (error) throw error;

      toast({
        title: 'Email resent',
        description: `Email to ${log.recipient_email} has been resent`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to resend email',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get all stats in parallel
      const [totalResult, sentResult, failedResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('email_logs').select('id', { count: 'exact', head: true }),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
      ]);

      const total = totalResult.count || 0;
      const sent = sentResult.count || 0;
      const failed = failedResult.count || 0;

      setStats({
        total_sent: sent,
        total_failed: failed,
        sent_today: todayResult.count || 0,
        sent_week: weekResult.count || 0,
        sent_month: monthResult.count || 0,
        success_rate: total > 0 ? (sent / total) * 100 : 0,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to load stats',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    loading,
    stats,
    triggerTestEvent,
    resendEmail,
    loadStats,
  };
};
