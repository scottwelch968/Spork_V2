import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FallbackModel, CreateFallbackModelInput, UpdateFallbackModelInput, ModelCategory } from '@/types/fallbackModels';

const getSessionToken = () => localStorage.getItem('system_session_token');

const invokeAdminData = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: getSessionToken(), ...params }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const useFallbackModels = () => {
  const [models, setModels] = useState<FallbackModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await invokeAdminData('get_fallback_models');
      setModels(result.data as FallbackModel[] || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching fallback models',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const createModel = async (model: CreateFallbackModelInput) => {
    try {
      const result = await invokeAdminData('create_fallback_model', { model });

      toast({
        title: 'Fallback model created',
        description: `${model.name} has been added.`,
      });

      await fetchModels();
      return result.data as FallbackModel;
    } catch (error: any) {
      toast({
        title: 'Error creating fallback model',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateModel = async (id: string, updates: UpdateFallbackModelInput) => {
    try {
      const result = await invokeAdminData('update_fallback_model', { id, updates });

      toast({
        title: 'Fallback model updated',
        description: 'Changes have been saved.',
      });

      await fetchModels();
      return result.data as FallbackModel;
    } catch (error: any) {
      toast({
        title: 'Error updating fallback model',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteModel = async (id: string) => {
    try {
      await invokeAdminData('delete_fallback_model', { id });

      toast({
        title: 'Fallback model deleted',
        description: 'The model has been removed.',
      });

      await fetchModels();
    } catch (error: any) {
      toast({
        title: 'Error deleting fallback model',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleModelActive = async (id: string, isActive: boolean) => {
    try {
      await invokeAdminData('toggle_fallback_model_active', { id, is_active: isActive });

      toast({
        title: isActive ? 'Fallback model activated' : 'Fallback model deactivated',
      });

      await fetchModels();
    } catch (error: any) {
      toast({
        title: 'Error updating fallback model status',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const setDefaultModel = async (id: string) => {
    try {
      await invokeAdminData('set_default_fallback_model', { id });

      toast({
        title: 'Default fallback model updated',
      });

      await fetchModels();
    } catch (error: any) {
      toast({
        title: 'Error setting default fallback model',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const bulkToggleActive = async (ids: string[], isActive: boolean) => {
    try {
      for (const id of ids) {
        await invokeAdminData('toggle_fallback_model_active', { id, is_active: isActive });
      }

      toast({
        title: `${ids.length} fallback models ${isActive ? 'activated' : 'deactivated'}`,
      });

      await fetchModels();
    } catch (error: any) {
      toast({
        title: 'Error updating fallback models',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const activeModels = models.filter(m => m.is_active);

  const getModelsByCategory = (category: ModelCategory) => {
    return models.filter(m => m.best_for === category);
  };

  return {
    models,
    activeModels,
    isLoading,
    createModel,
    updateModel,
    deleteModel,
    toggleModelActive,
    setDefaultModel,
    bulkToggleActive,
    getModelsByCategory,
    refetch: fetchModels,
  };
};
