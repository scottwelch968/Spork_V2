import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
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

export const useDiscountCodes = () => {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCodes = useCallback(async () => {
    try {
      const result = await invokeAdminData('get_discount_codes');
      setCodes(result.data || []);
    } catch (error) {
      console.error('Error loading discount codes:', error);
      toast.error('Failed to load discount codes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const createCode = async (code: Omit<DiscountCode, 'id' | 'current_uses' | 'created_at' | 'updated_at'>) => {
    try {
      await invokeAdminData('create_discount_code', { code });
      toast.success('Discount code created');
      await loadCodes();
      return true;
    } catch (error) {
      console.error('Error creating discount code:', error);
      toast.error('Failed to create discount code');
      return false;
    }
  };

  const updateCode = async (id: string, updates: Partial<DiscountCode>) => {
    try {
      await invokeAdminData('update_discount_code', { id, updates });
      toast.success('Discount code updated');
      await loadCodes();
      return true;
    } catch (error) {
      console.error('Error updating discount code:', error);
      toast.error('Failed to update discount code');
      return false;
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await invokeAdminData('delete_discount_code', { id });
      toast.success('Discount code deleted');
      await loadCodes();
      return true;
    } catch (error) {
      console.error('Error deleting discount code:', error);
      toast.error('Failed to delete discount code');
      return false;
    }
  };

  return {
    codes,
    isLoading,
    createCode,
    updateCode,
    deleteCode,
    refresh: loadCodes,
  };
};
