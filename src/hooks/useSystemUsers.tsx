import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import { toast } from 'sonner';

export type SystemUserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface SystemUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  roles: SystemUserRole[];
}

interface CreateSystemUserData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  roles: SystemUserRole[];
}

interface UpdateSystemUserData {
  user_id: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  roles?: SystemUserRole[];
  new_password?: string;
}

export const useSystemUsers = () => {
  const queryClient = useQueryClient();
  const { user } = useSystemAuth();

  const getSessionToken = async (): Promise<string | null> => {
    // Get session token from localStorage (set by SystemAuthContext)
    return localStorage.getItem('system_session_token');
  };

  const listSystemUsers = useQuery({
    queryKey: ['system-users'],
    queryFn: async (): Promise<SystemUser[]> => {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const { data, error } = await supabase.functions.invoke('manage-system-user', {
        body: {
          action: 'list',
          session_token: sessionToken,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data?.users || [];
    },
    enabled: !!user,
  });

  const createSystemUser = useMutation({
    mutationFn: async (userData: CreateSystemUserData) => {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const { data, error } = await supabase.functions.invoke('manage-system-user', {
        body: {
          action: 'create',
          session_token: sessionToken,
          ...userData,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      toast.success('System user created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create system user');
    },
  });

  const updateSystemUser = useMutation({
    mutationFn: async (userData: UpdateSystemUserData) => {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const { data, error } = await supabase.functions.invoke('manage-system-user', {
        body: {
          action: 'update',
          session_token: sessionToken,
          ...userData,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      toast.success('System user updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update system user');
    },
  });

  const deleteSystemUser = useMutation({
    mutationFn: async (userId: string) => {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const { data, error } = await supabase.functions.invoke('manage-system-user', {
        body: {
          action: 'delete',
          session_token: sessionToken,
          user_id: userId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      toast.success('System user deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete system user');
    },
  });

  return {
    users: listSystemUsers.data || [],
    isLoading: listSystemUsers.isLoading,
    error: listSystemUsers.error,
    refetch: listSystemUsers.refetch,
    createUser: createSystemUser.mutateAsync,
    updateUser: updateSystemUser.mutateAsync,
    deleteUser: deleteSystemUser.mutateAsync,
    isCreating: createSystemUser.isPending,
    isUpdating: updateSystemUser.isPending,
    isDeleting: deleteSystemUser.isPending,
  };
};
