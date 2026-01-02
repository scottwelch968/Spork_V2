import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface BillingUsage {
  chat_tokens: number;
  image_generations: number;
  video_generations: number;
  document_parses: number;
  total_cost: number;
}

interface BillingLimits {
  chat_tokens: number | null;
  image_generations: number | null;
  video_generations: number | null;
  document_parses: number | null;
  total_cost: number | null;
}

interface BillingData {
  usage: BillingUsage;
  limits: BillingLimits;
  subscriptionTier: string;
  isLoading: boolean;
  isSuperUser: boolean;
}

export const useBilling = (workspaceId?: string) => {
  const { user } = useAuth();
  const [data, setData] = useState<BillingData>({
    usage: {
      chat_tokens: 0,
      image_generations: 0,
      video_generations: 0,
      document_parses: 0,
      total_cost: 0,
    },
    limits: {
      chat_tokens: 0,
      image_generations: 0,
      video_generations: 0,
      document_parses: 0,
      total_cost: 0,
    },
    subscriptionTier: 'free',
    isLoading: true,
    isSuperUser: false,
  });

  useEffect(() => {
    if (user?.id) {
      loadBillingData();
    }
  }, [workspaceId, user?.id]);

  const loadBillingData = async () => {
    if (!user?.id) return;

    try {
      // Check if user is an admin (super user)
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (adminRole) {
        // Super user - unlimited everything
        setData({
          usage: {
            chat_tokens: 0,
            image_generations: 0,
            video_generations: 0,
            document_parses: 0,
            total_cost: 0,
          },
          limits: {
            chat_tokens: null, // null = unlimited
            image_generations: null,
            video_generations: null,
            document_parses: null,
            total_cost: null,
          },
          subscriptionTier: 'Super User',
          isLoading: false,
          isSuperUser: true,
        });
        return;
      }

      // Regular user - fetch actual billing data
      if (workspaceId) {
        const response = await supabase.functions.invoke('check-budget', {
          body: { workspaceId }
        });

        if (response.error) throw response.error;

        setData({
          usage: response.data.usage,
          limits: response.data.limits,
          subscriptionTier: response.data.subscriptionTier,
          isLoading: false,
          isSuperUser: false,
        });
      } else {
        setData(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load billing information');
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getUsagePercentage = (type: keyof BillingUsage) => {
    // Super users always show 0% usage
    if (data.isSuperUser) return 0;
    
    const usage = data.usage[type];
    const limit = data.limits[type];
    // null limit means unlimited
    if (limit === null || limit === 0) return 0;
    return (usage / limit) * 100;
  };

  const isApproachingLimit = (type: keyof BillingUsage, threshold = 80) => {
    // Super users never approach limits
    if (data.isSuperUser) return false;
    return getUsagePercentage(type) >= threshold;
  };

  const isOverLimit = (type: keyof BillingUsage) => {
    // Super users never over limit
    if (data.isSuperUser) return false;
    const limit = data.limits[type];
    if (limit === null) return false;
    return data.usage[type] >= limit;
  };

  return {
    ...data,
    getUsagePercentage,
    isApproachingLimit,
    isOverLimit,
    refresh: loadBillingData,
  };
};