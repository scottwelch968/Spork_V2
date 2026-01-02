import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionTier {
  id: string;
  name: string;
  tier_type: 'trial' | 'paid';
  monthly_token_input_quota: number | null;
  monthly_token_output_quota: number | null;
  daily_token_input_limit: number | null;
  daily_token_output_limit: number | null;
  monthly_image_quota: number | null;
  monthly_video_quota: number | null;
  monthly_document_parsing_quota: number | null;
  daily_image_limit: number | null;
  daily_video_limit: number | null;
  monthly_file_storage_quota_mb: number | null;
  trial_duration_days: number | null;
  trial_usage_based: boolean;
  allowed_models: any;
  monthly_price: number | null;
  credit_price_per_unit: number | null;
  is_active: boolean;
  display_order: number;
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

export const useSubscriptionTiers = () => {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTiers = useCallback(async () => {
    try {
      const result = await invokeAdminData('get_subscription_tiers');
      setTiers(result.data || []);
    } catch (error) {
      console.error('Error loading tiers:', error);
      toast.error('Failed to load subscription tiers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

  const createTier = async (tier: Omit<SubscriptionTier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await invokeAdminData('create_subscription_tier', { tier });
      toast.success('Subscription tier created');
      await loadTiers();
      return true;
    } catch (error) {
      console.error('Error creating tier:', error);
      toast.error('Failed to create subscription tier');
      return false;
    }
  };

  const updateTier = async (id: string, updates: Partial<SubscriptionTier>) => {
    try {
      await invokeAdminData('update_subscription_tier', { id, updates });
      toast.success('Subscription tier updated');
      await loadTiers();
      return true;
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error('Failed to update subscription tier');
      return false;
    }
  };

  const deleteTier = async (id: string) => {
    try {
      await invokeAdminData('delete_subscription_tier', { id });
      toast.success('Subscription tier deleted');
      await loadTiers();
      return true;
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete subscription tier');
      return false;
    }
  };

  return {
    tiers,
    isLoading,
    createTier,
    updateTier,
    deleteTier,
    refresh: loadTiers,
  };
};
