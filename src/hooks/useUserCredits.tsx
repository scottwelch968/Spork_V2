import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface CreditBalances {
  token_credits_remaining: number | null; // null = unlimited
  image_credits_remaining: number | null;
  video_credits_remaining: number | null;
}

export const useUserCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditBalances>({
    token_credits_remaining: 0,
    image_credits_remaining: 0,
    video_credits_remaining: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperUser, setIsSuperUser] = useState(false);

  const loadCredits = async () => {
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
        // Super user - unlimited credits
        setCredits({
          token_credits_remaining: null, // null = unlimited
          image_credits_remaining: null,
          video_credits_remaining: null,
        });
        setIsSuperUser(true);
        setIsLoading(false);
        return;
      }

      // Regular user - fetch actual credits
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('token_credits_remaining, image_credits_remaining, video_credits_remaining')
        .eq('user_id', user.id)
        .eq('period_start', periodStart.toISOString())
        .maybeSingle();

      if (error) throw error;

      setCredits({
        token_credits_remaining: data?.token_credits_remaining || 0,
        image_credits_remaining: data?.image_credits_remaining || 0,
        video_credits_remaining: data?.video_credits_remaining || 0,
      });
      setIsSuperUser(false);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const purchaseCredits = async (packageId: string, discountCode?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('purchase-credits', {
        body: { packageId, discountCode },
      });

      if (error) throw error;

      toast.success(data.message || 'Credits purchased successfully');
      await loadCredits();
      return { success: true, data };
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast.error('Failed to purchase credits');
      return { success: false, error };
    }
  };

  // Helper to format credit display
  const formatCredits = (value: number | null): string => {
    if (value === null) return '∞';
    return value.toLocaleString();
  };

  useEffect(() => {
    loadCredits();
  }, [user?.id]);

  return {
    credits,
    isLoading,
    isSuperUser,
    loadCredits,
    purchaseCredits,
    refresh: loadCredits,
    formatCredits,
  };
};