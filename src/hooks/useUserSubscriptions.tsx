import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  trial_started_at: string | null;
  trial_ends_at: string | null;
  is_trial: boolean;
  external_subscription_id: string | null;
  payment_processor: 'stripe' | 'paypal' | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  subscription_tiers: {
    name: string;
    tier_type: 'trial' | 'paid';
  };
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

export const useUserSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    try {
      const result = await invokeAdminData('get_user_subscriptions');
      setSubscriptions((result.data || []) as UserSubscription[]);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load user subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const updateSubscriptionStatus = async (id: string, status: UserSubscription['status']) => {
    try {
      await invokeAdminData('update_user_subscription_status', { id, status });
      toast.success(`Subscription ${status}`);
      await loadSubscriptions();
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
      return false;
    }
  };

  const cancelSubscription = async (id: string) => {
    return updateSubscriptionStatus(id, 'cancelled');
  };

  return {
    subscriptions,
    isLoading,
    updateSubscriptionStatus,
    cancelSubscription,
    refresh: loadSubscriptions,
  };
};
