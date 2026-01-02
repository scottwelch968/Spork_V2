import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailProvider {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  api_endpoint?: string;
  config_schema: any[];
  config_values: Record<string, any>;
  sdk_package?: string;
  description?: string;
  logo_url?: string;
  documentation_url?: string;
  created_at: string;
  updated_at: string;
}

export const useEmailProviders = () => {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders((data || []) as EmailProvider[]);
    } catch (error: any) {
      toast({
        title: 'Error loading providers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async (providerData: Partial<EmailProvider>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-provider', {
        body: { action: 'create', ...providerData },
      });

      if (error) throw error;
      
      toast({
        title: 'Provider created',
        description: `${providerData.name} has been added successfully.`,
      });
      
      await loadProviders();
      return data.provider;
    } catch (error: any) {
      toast({
        title: 'Error creating provider',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProvider = async (id: string, updates: Partial<EmailProvider>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-provider', {
        body: { action: 'update', id, ...updates },
      });

      if (error) throw error;
      
      toast({
        title: 'Provider updated',
        description: 'Configuration saved successfully.',
      });
      
      await loadProviders();
      return data.provider;
    } catch (error: any) {
      toast({
        title: 'Error updating provider',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-email-provider', {
        body: { action: 'delete', id },
      });

      if (error) throw error;
      
      toast({
        title: 'Provider deleted',
        description: 'Email provider has been removed.',
      });
      
      await loadProviders();
    } catch (error: any) {
      toast({
        title: 'Error deleting provider',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const activateProvider = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-provider', {
        body: { action: 'activate', id },
      });

      if (error) throw error;
      
      toast({
        title: 'Provider activated',
        description: 'This provider is now active for sending emails.',
      });
      
      await loadProviders();
      return data.provider;
    } catch (error: any) {
      toast({
        title: 'Error activating provider',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const testProvider = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-provider', {
        body: { action: 'test', id },
      });

      if (error) throw error;
      
      if (data.success) {
        toast({
          title: 'Connection successful',
          description: data.message,
        });
      } else {
        toast({
          title: 'Connection failed',
          description: data.message,
          variant: 'destructive',
        });
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Error testing provider',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  return {
    providers,
    loading,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    activateProvider,
    testProvider,
  };
};