import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credit_type: string;
  credits_amount: number;
  price_usd: number;
  bonus_credits: number | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export const useCreditPackages = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'get_credit_packages' },
      });

      if (error) throw error;
      setPackages(data.data || []);
    } catch (error) {
      console.error('Error loading credit packages:', error);
      toast.error('Failed to load credit packages');
    } finally {
      setIsLoading(false);
    }
  };

  const createPackage = async (packageData: Omit<CreditPackage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'create_credit_package', packageData },
      });

      if (error) throw error;
      toast.success('Credit package created successfully');
      await loadPackages();
      return true;
    } catch (error) {
      console.error('Error creating credit package:', error);
      toast.error('Failed to create credit package');
      return false;
    }
  };

  const updatePackage = async (id: string, updates: Partial<CreditPackage>) => {
    try {
      const { error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'update_credit_package', packageId: id, updates },
      });

      if (error) throw error;
      toast.success('Credit package updated successfully');
      await loadPackages();
      return true;
    } catch (error) {
      console.error('Error updating credit package:', error);
      toast.error('Failed to update credit package');
      return false;
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'delete_credit_package', packageId: id },
      });

      if (error) throw error;
      toast.success('Credit package deleted successfully');
      await loadPackages();
      return true;
    } catch (error) {
      console.error('Error deleting credit package:', error);
      toast.error('Failed to delete credit package');
      return false;
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  return {
    packages,
    isLoading,
    loadPackages,
    createPackage,
    updatePackage,
    deletePackage,
    refresh: loadPackages,
  };
};
