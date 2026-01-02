import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useCurrentSubscription() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['current-subscription-with-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { subscription: null, isAdmin: false };

      // Fetch subscription and admin status in parallel
      const [subscriptionResult, adminResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select(`*, subscription_tiers (*)`)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle()
      ]);

      return {
        subscription: subscriptionResult.data,
        isAdmin: !!adminResult.data
      };
    },
  });

  const subscription = data?.subscription;
  const isAdmin = data?.isAdmin ?? false;
  const tier = subscription?.subscription_tiers as any;
  
  // Super user status: admins in main app are "super users" with unlimited access
  const isSuperUser = isAdmin;
  const hasUnlimitedQuota = isAdmin;
  
  // Admin bypass: admins have full access regardless of tier
  const isTeamOrHigher = isAdmin || (tier ? (
    tier.name === 'Team' || 
    tier.name === 'Enterprise' || 
    (tier.display_order !== undefined && tier.display_order >= 2)
  ) : false);

  return {
    subscription,
    tier,
    isAdmin,
    isSuperUser,
    hasUnlimitedQuota,
    isTeamOrHigher,
    isLoading,
  };
}