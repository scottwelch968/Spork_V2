import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Subscription {
  id: string;
  tier_id: string;
  status: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  current_period_end: string | null;
  subscription_tiers: {
    name: string;
    monthly_price: number | null;
    tier_type: string;
  };
}

export interface UsageData {
  tokens_input_used: number;
  tokens_output_used: number;
  tokens_input_quota: number | null;
  tokens_output_quota: number | null;
  images_generated: number;
  images_quota: number | null;
  videos_generated: number;
  videos_quota: number | null;
  documents_parsed: number;
  documents_quota: number | null;
  period_start: string;
  period_end: string;
}

export interface CreditPurchase {
  id: string;
  credits_purchased: number;
  amount_paid: number;
  currency: string;
  created_at: string;
  payment_processor: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  monthly_price: number | null;
  tier_type: string;
  is_active: boolean;
}

export function useBillingData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['billing-subscription', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_tiers(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();
      return data as Subscription | null;
    },
  });

  // Load usage tracking
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['billing-usage', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user?.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as UsageData | null;
    },
  });

  // Load credit purchases
  const { data: creditPurchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['billing-purchases', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return (data || []) as CreditPurchase[];
    },
  });

  // Load available tiers
  const { data: availableTiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['billing-tiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .eq('tier_type', 'paid')
        .order('monthly_price');
      return (data || []) as SubscriptionTier[];
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error, data } = await supabase.functions.invoke('manage-subscription', {
        body: {
          action: 'cancel',
          userId: user.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: async () => {
      toast({
        title: 'Membership Cancelled',
        description: 'Your membership has been cancelled. You will be signed out.',
      });
      await supabase.auth.signOut();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['billing-subscription', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['billing-usage', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['billing-purchases', user?.id] });
  };

  return {
    subscription,
    usage,
    creditPurchases,
    availableTiers,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isCancelling: cancelSubscriptionMutation.isPending,
    refetch,
    isLoading: subscriptionLoading || usageLoading || purchasesLoading || tiersLoading,
  };
}
