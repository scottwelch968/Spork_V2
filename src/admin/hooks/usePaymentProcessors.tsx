import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentProcessor {
  id: string;
  name: string;
  processor_type: 'stripe' | 'paypal';
  is_active: boolean;
  is_default: boolean;
  config: any;
  supports_subscriptions: boolean;
  supports_one_time_payments: boolean;
  supports_webhooks: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
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

export const usePaymentProcessors = () => {
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProcessors = useCallback(async () => {
    try {
      const result = await invokeAdminData('get_payment_processors');
      setProcessors(result.data || []);
    } catch (error) {
      console.error('Error loading processors:', error);
      toast.error('Failed to load payment processors');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProcessors();
  }, [loadProcessors]);

  const createProcessor = async (processor: Omit<PaymentProcessor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await invokeAdminData('create_payment_processor', { processor });
      toast.success('Payment processor created');
      await loadProcessors();
      return true;
    } catch (error) {
      console.error('Error creating processor:', error);
      toast.error('Failed to create payment processor');
      return false;
    }
  };

  const updateProcessor = async (id: string, updates: Partial<PaymentProcessor>) => {
    try {
      await invokeAdminData('update_payment_processor', { id, updates });
      toast.success('Payment processor updated');
      await loadProcessors();
      return true;
    } catch (error) {
      console.error('Error updating processor:', error);
      toast.error('Failed to update payment processor');
      return false;
    }
  };

  const deleteProcessor = async (id: string) => {
    try {
      await invokeAdminData('delete_payment_processor', { id });
      toast.success('Payment processor deleted');
      await loadProcessors();
      return true;
    } catch (error) {
      console.error('Error deleting processor:', error);
      toast.error('Failed to delete payment processor');
      return false;
    }
  };

  const setDefaultProcessor = async (id: string) => {
    try {
      await invokeAdminData('set_default_payment_processor', { id });
      toast.success('Default payment processor updated');
      await loadProcessors();
      return true;
    } catch (error) {
      console.error('Error setting default processor:', error);
      toast.error('Failed to set default processor');
      return false;
    }
  };

  return {
    processors,
    isLoading,
    createProcessor,
    updateProcessor,
    deleteProcessor,
    setDefaultProcessor,
    refresh: loadProcessors,
  };
};
