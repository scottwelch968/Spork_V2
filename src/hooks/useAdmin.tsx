import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const getSessionToken = () => localStorage.getItem('system_session_token');

const invokeAdminData = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: getSessionToken(), ...params }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const useAdmin = () => {
  // Data fetching functions - no toasts on initial load, just log errors
  const getAllUsers = async () => {
    try {
      const result = await invokeAdminData('get_users');
      return result.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const getAllWorkspaces = async () => {
    try {
      const result = await invokeAdminData('get_workspaces');
      return result.data || [];
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  };

  const getUsageLogs = async (limit = 100) => {
    try {
      const result = await invokeAdminData('get_usage_logs', { limit });
      return result.data || [];
    } catch (error) {
      console.error('Error fetching usage logs:', error);
      return [];
    }
  };

  const getAnalytics = async () => {
    try {
      const result = await invokeAdminData('get_analytics');
      return result.data || null;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  };

  const getModelUsageAnalytics = async (period: 'daily' | 'weekly' | 'monthly') => {
    try {
      const result = await invokeAdminData('get_model_usage', { period });
      return result.data || { modelData: [], categoryData: [] };
    } catch (error) {
      console.error('Error fetching model usage analytics:', error);
      return { modelData: [], categoryData: [] };
    }
  };

  const getTokenAnalytics = async (period: 'daily' | 'weekly' | 'monthly') => {
    try {
      const result = await invokeAdminData('get_token_analytics', { period });
      return result.data || { timeData: [], modelData: [] };
    } catch (error) {
      console.error('Error fetching token analytics:', error);
      return { timeData: [], modelData: [] };
    }
  };

  const getCostAnalytics = async (period: 'daily' | 'weekly' | 'monthly') => {
    try {
      const result = await invokeAdminData('get_cost_analytics', { period });
      return result.data || { timeData: [], modelData: [] };
    } catch (error) {
      console.error('Error fetching cost analytics:', error);
      return { timeData: [], modelData: [] };
    }
  };

  const getUserCostAnalytics = async (period: 'daily' | 'weekly' | 'monthly') => {
    try {
      const result = await invokeAdminData('get_user_cost_analytics', { period });
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user cost analytics:', error);
      return [];
    }
  };

  // User updates still use the update-user edge function
  const updateUser = async (userId: string, updates: {
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'user';
    account_status?: 'active' | 'suspended' | 'cancelled';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: { user_id: userId, ...updates },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('User updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user: ' + (error as Error).message);
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
    return updateUser(userId, { role });
  };

  const updateUserProfile = async (userId: string, updates: {
    first_name?: string;
    last_name?: string;
  }) => {
    return updateUser(userId, updates);
  };

  const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'cancelled') => {
    return updateUser(userId, { account_status: status });
  };

  const deleteUser = async (userId: string) => {
    try {
      await invokeAdminData('delete_user', { user_id: userId });
      toast.success('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { user_id: userId, new_password: newPassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Password updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password: ' + (error as Error).message);
      return false;
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: 'admin' | 'user';
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('User created successfully');
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error as Error).message);
      return false;
    }
  };

  return {
    getAllUsers,
    getAllWorkspaces,
    getUsageLogs,
    getAnalytics,
    updateUserRole,
    getModelUsageAnalytics,
    getTokenAnalytics,
    getCostAnalytics,
    getUserCostAnalytics,
    updateUserProfile,
    updateUserStatus,
    deleteUser,
    updateUserPassword,
    createUser,
  };
};
