import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ModelCategory, AIModel } from '@/types/models';

/**
 * Public hook for reading active AI models without admin authentication.
 * Uses React Query for caching and only runs when user is authenticated.
 */
export const usePublicModels = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['public-models'],
    enabled: !authLoading && !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true, nullsFirst: false });
      
      if (error) {
        console.error('Error loading public models:', error.message);
        return [];
      }
      return (data || []) as AIModel[];
    },
  });

  const getModelsByProvider = (provider: string) => {
    return models.filter(m => m.provider === provider);
  };

  const getModelsByCategory = (category: ModelCategory) => {
    return models.filter(m => m.best_for === category);
  };

  return {
    models,
    activeModels: models,
    isLoading: isLoading || authLoading,
    getModelsByProvider,
    getModelsByCategory,
  };
};

