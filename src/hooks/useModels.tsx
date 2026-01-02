import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AIModel, CreateModelInput, UpdateModelInput, ModelCategory } from '@/types/models';
import { cosmo2 } from '@/cosmo2/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useModels = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [], isLoading, refetch } = useQuery({
    queryKey: ['cosmo-models'],
    queryFn: async () => {
      const result = await cosmo2.getModels(true);
      // Adapter: map cosmo2 Model to AIModel
      return result.map(m => ({
        id: m.model_id, // Use model_id as id since V2 uses model_id as key
        model_id: m.model_id,
        name: m.name,
        provider: m.provider,
        description: m.description || null,
        best_for: (m.best_for as ModelCategory) || 'general',
        best_for_description: m.best_for_description || null,
        context_length: m.context_length || 4096,
        max_completion_tokens: m.max_completion_tokens || 2048,
        input_modalities: m.input_modalities || [],
        output_modalities: m.output_modalities || [],
        pricing_prompt: m.pricing_prompt || 0,
        pricing_completion: m.pricing_completion || 0,
        default_temperature: m.default_temperature || 0.7,
        default_top_p: m.default_top_p || 1,
        default_top_k: m.default_top_k || 0,
        default_max_tokens: m.default_max_tokens || 2048,
        default_frequency_penalty: m.default_frequency_penalty || 0,
        default_presence_penalty: m.default_presence_penalty || 0,
        supported_parameters: {}, // JSONB
        rate_limit_rpm: m.rate_limit_rpm || 0,
        rate_limit_tpm: m.rate_limit_tpm || 0,
        is_active: m.is_active ?? true,
        is_default: m.is_default ?? false,
        is_free: m.is_free ?? false,
        requires_api_key: m.requires_api_key ?? true,
        display_order: m.display_order || 0,
        created_at: new Date().toISOString(), // Mock, not in V2 response
        updated_at: m.updated_at || new Date().toISOString(),
      } as AIModel));
    }
  });

  const updateModelMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateModelInput }) => {
      // Map flat updates to nested if necessary, though ModelUpdateRequest is flat mostly
      return cosmo2.updateModel(id, updates as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-models'] });
      toast({ title: 'Model updated successfully' });
    },
    onError: (err: Error) => toast({ title: 'Failed to update model', description: err.message, variant: 'destructive' }),
  });

  const createModel = async (model: CreateModelInput) => {
    // V2 uses update (PUT) to create if ID is new.
    await updateModelMutation.mutateAsync({ id: model.model_id, updates: model as any });
  };

  const updateModel = async (id: string, updates: UpdateModelInput) => {
    await updateModelMutation.mutateAsync({ id, updates });
  };

  const deleteModel = async (id: string) => {
    toast({ title: 'Delete not supported in COSMO 2.0 API', description: 'Try disabling the model instead.', variant: 'destructive' });
  };

  const toggleModelActive = async (id: string, isActive: boolean) => {
    await updateModelMutation.mutateAsync({ id, updates: { is_active: isActive } });
  };

  const setDefaultModel = async (id: string) => {
    // This requires updating Routing Config, not just model
    try {
      await cosmo2.updateRoutingConfig({ defaultModelId: id });
      toast({ title: 'Default model updated' });
      queryClient.invalidateQueries({ queryKey: ['cosmo-models'] }); // Re-fetch to maybe update 'is_default' if server computes it? 
      // Note: is_default in getModels might be computed by server based on routing config.
    } catch (err: any) {
      toast({ title: 'Failed to set default model', description: err.message, variant: 'destructive' });
    }
  };

  const bulkToggleActive = async (ids: string[], isActive: boolean) => {
    // Parallel updates
    await Promise.all(ids.map(id => updateModelMutation.mutateAsync({ id, updates: { is_active: isActive } })));
  };

  const activeModels = models.filter((m) => m.is_active);

  const getModelsByProvider = (provider: string) =>
    models.filter((m) => m.provider === provider);

  const getModelsByCategory = (category: ModelCategory) =>
    models.filter((m) => m.best_for === category);

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
    getModelsByProvider,
    getModelsByCategory,
    refetch,
  };
};
