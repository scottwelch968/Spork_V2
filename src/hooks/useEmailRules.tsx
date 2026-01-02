import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailRule {
  id: string;
  event_type: string;
  template_id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'disabled';
  priority: number;
  conditions: any[];
  recipient_type: 'user' | 'admin' | 'custom' | 'both';
  recipient_emails?: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  send_immediately: boolean;
  delay_minutes: number;
  max_sends_per_user_per_day?: number;
  max_sends_per_user_per_week?: number;
  deduplicate_window_minutes?: number;
  trigger_count: number;
  success_count: number;
  failure_count: number;
  last_triggered_at?: string;
  email_templates?: { name: string; status: string };
  created_at: string;
  updated_at: string;
}

export const useEmailRules = () => {
  const [rules, setRules] = useState<EmailRule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRules = async (filters?: { event_type?: string; status?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'list',
          data: filters,
        },
      });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error loading rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: Partial<EmailRule>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'create',
          data: ruleData,
        },
      });

      if (error) throw error;
      toast.success('Rule created successfully');
      await loadRules();
      return data;
    } catch (error: any) {
      console.error('Error creating rule:', error);
      toast.error('Failed to create rule');
      throw error;
    }
  };

  const updateRule = async (id: string, ruleData: Partial<EmailRule>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'update',
          rule_id: id,
          data: ruleData,
        },
      });

      if (error) throw error;
      toast.success('Rule updated successfully');
      await loadRules();
      return data;
    } catch (error: any) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'delete',
          rule_id: id,
        },
      });

      if (error) throw error;
      toast.success('Rule deleted successfully');
      await loadRules();
    } catch (error: any) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
      throw error;
    }
  };

  const toggleRuleStatus = async (id: string, status: 'active' | 'paused' | 'disabled') => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'toggle_status',
          rule_id: id,
          data: { status },
        },
      });

      if (error) throw error;
      toast.success(`Rule ${status === 'active' ? 'activated' : 'paused'}`);
      await loadRules();
      return data;
    } catch (error: any) {
      console.error('Error toggling rule status:', error);
      toast.error('Failed to toggle rule status');
      throw error;
    }
  };

  const testRule = async (id: string, sampleEvent: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-rule', {
        body: {
          action: 'test',
          rule_id: id,
          sample_event: sampleEvent,
        },
      });

      if (error) throw error;
      toast.success('Rule test completed');
      return data;
    } catch (error: any) {
      console.error('Error testing rule:', error);
      toast.error('Failed to test rule');
      throw error;
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  return {
    rules,
    loading,
    loadRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    testRule,
  };
};
