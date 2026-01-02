import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FileQuota {
  usedMb: number;
  quotaMb: number | null;
  percentage: number;
  warningLevel: null | '80%' | '95%' | '100%';
  canUpload: boolean;
  remainingMb: number | null;
  isLoading: boolean;
  unlimited: boolean;
  isSuperUser: boolean;
}

export function useFileQuota() {
  const { user } = useAuth();
  const [quota, setQuota] = useState<FileQuota>({
    usedMb: 0,
    quotaMb: null,
    percentage: 0,
    warningLevel: null,
    canUpload: true,
    remainingMb: null,
    isLoading: true,
    unlimited: false,
    isSuperUser: false,
  });

  const fetchQuota = useCallback(async () => {
    if (!user) {
      setQuota(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setQuota(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-file-quota', {
        body: { fileSizeBytes: 0 },
      });

      if (error) {
        // Handle 401 errors gracefully - session may be expired
        if (error.message?.includes('401') || error.message?.includes('Invalid token')) {
          console.warn('Session expired or invalid, skipping quota check');
          setQuota(prev => ({ ...prev, isLoading: false, canUpload: true }));
          return;
        }
        console.error('Error fetching file quota:', error);
        setQuota(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check for super user response
      if (data.isSuperUser || data.unlimited) {
        setQuota({
          usedMb: data.currentUsedMb || 0,
          quotaMb: null,
          percentage: 0,
          warningLevel: null,
          canUpload: true,
          remainingMb: null,
          isLoading: false,
          unlimited: true,
          isSuperUser: true,
        });
        return;
      }

      const percentage = data.quotaMb !== null 
        ? Math.round((data.currentUsedMb / data.quotaMb) * 100) 
        : 0;

      setQuota({
        usedMb: data.currentUsedMb,
        quotaMb: data.quotaMb,
        percentage,
        warningLevel: data.warningLevel,
        canUpload: data.allowed,
        remainingMb: data.remainingMb,
        isLoading: false,
        unlimited: data.quotaMb === null,
        isSuperUser: false,
      });
    } catch (error) {
      console.error('Error fetching file quota:', error);
      setQuota(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const checkCanUpload = useCallback(async (fileSizeBytes: number): Promise<boolean> => {
    if (!user) return false;
    
    // Super users can always upload
    if (quota.isSuperUser) return true;

    try {
      const { data, error } = await supabase.functions.invoke('check-file-quota', {
        body: { fileSizeBytes },
      });

      if (error) {
        console.error('Error checking upload quota:', error);
        return false;
      }

      // Super user check from response
      if (data.isSuperUser || data.unlimited) {
        return true;
      }

      return data.allowed;
    } catch (error) {
      console.error('Error checking upload quota:', error);
      return false;
    }
  }, [user, quota.isSuperUser]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return {
    ...quota,
    refetch: fetchQuota,
    checkCanUpload,
  };
}