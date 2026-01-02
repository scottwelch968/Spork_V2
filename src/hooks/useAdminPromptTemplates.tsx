import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PromptTemplate } from './usePromptTemplates';

export interface PromptCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
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

export const useAdminPromptTemplates = () => {
  const queryClient = useQueryClient();

  // Fetch all prompt templates
  const { data: templates = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['admin-prompt-templates'],
    queryFn: async () => {
      const result = await invokeAdminData('get_prompt_templates');
      return (result.data || []) as PromptTemplate[];
    },
  });

  // Fetch all prompt categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-prompt-categories'],
    queryFn: async () => {
      const result = await invokeAdminData('get_prompt_categories');
      return (result.data || []) as PromptCategory[];
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: {
      title: string;
      content: string;
      description?: string;
      category_id?: string;
      is_featured?: boolean;
      is_active?: boolean;
    }) => {
      const result = await invokeAdminData('create_prompt_template', { template });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create template', { description: error.message });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PromptTemplate> }) => {
      await invokeAdminData('update_prompt_template', { id, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update template', { description: error.message });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_prompt_template', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete template', { description: error.message });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<PromptCategory, 'id' | 'created_at' | 'updated_at'>) => {
      await invokeAdminData('create_prompt_category', { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', { description: error.message });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PromptCategory> }) => {
      await invokeAdminData('update_prompt_category', { id, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', { description: error.message });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_prompt_category', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', { description: error.message });
    },
  });

  return {
    templates,
    categories,
    loading,
    categoriesLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: (id: string, updates: Partial<PromptTemplate>) => 
      updateTemplateMutation.mutateAsync({ id, updates }),
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: (id: string, updates: Partial<PromptCategory>) => 
      updateCategoryMutation.mutateAsync({ id, updates }),
    deleteCategory: deleteCategoryMutation.mutateAsync,
    refetch,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  };
};
