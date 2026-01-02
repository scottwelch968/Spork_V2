import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';

export interface UserStorageData {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  storage_used_bytes: number;
  file_count: number;
  percentage: number;
}

export interface FileTypeBreakdown {
  type: string;
  size_bytes: number;
  count: number;
  percentage: number;
}

export interface StorageGrowthPoint {
  date: string;
  cumulative_bytes: number;
  daily_bytes: number;
}

export interface StorageAnalytics {
  total_storage_bytes: number;
  total_files: number;
  active_users: number;
  average_per_user_bytes: number;
  users: UserStorageData[];
  file_types: FileTypeBreakdown[];
  growth: StorageGrowthPoint[];
}

function getSessionToken(): string | null {
  return localStorage.getItem('system_session_token');
}

export function useStorageAnalytics() {
  const { user } = useSystemAuth();

  return useQuery({
    queryKey: ['storage-analytics'],
    queryFn: async (): Promise<StorageAnalytics> => {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const { data, error } = await supabase.functions.invoke('admin-data', {
        body: {
          action: 'get_storage_analytics',
          session_token: sessionToken,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
