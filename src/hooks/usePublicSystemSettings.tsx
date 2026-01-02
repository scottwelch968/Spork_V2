import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Public hook for reading system settings without admin authentication.
 * This uses direct Supabase queries with RLS policies that allow authenticated users to read.
 * For admin write operations, use useSystemSettings instead.
 */
export const usePublicSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      setSettings((data || []) as SystemSetting[]);
    } catch (error: any) {
      console.error('Error loading public system settings:', error.message);
      // Don't show toast for public settings - graceful degradation
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find(s => s.setting_key === key);
  };

  const getAppStoreEnabled = (): boolean => {
    const setting = getSetting('app_store_enabled');
    return setting ? setting.setting_value === true : true; // Default to enabled
  };

  return {
    settings,
    isLoading,
    getSetting,
    getAppStoreEnabled,
  };
};
