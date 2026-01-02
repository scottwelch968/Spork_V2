import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PersonaCategory {
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

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_default_for_users: boolean;
  is_default_for_spaces: boolean;
  use_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  color_code?: string | null;
  persona_categories?: {
    name: string;
    slug: string;
    icon: string | null;
  };
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

export function useAdminPersonas() {
  const queryClient = useQueryClient();

  // Fetch all persona categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-persona-categories'],
    queryFn: async () => {
      const result = await invokeAdminData('get_persona_categories');
      return (result.data || []) as PersonaCategory[];
    },
  });

  // Fetch all persona templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-persona-templates'],
    queryFn: async () => {
      const result = await invokeAdminData('get_persona_templates');
      return (result.data || []) as PersonaTemplate[];
    },
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-persona-analytics'],
    queryFn: async () => {
      const result = await invokeAdminData('get_persona_analytics');
      return result.data || { total: 0, active: 0, featured: 0, totalUses: 0 };
    },
  });

  // Create persona template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<PersonaTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'use_count'>) => {
      const result = await invokeAdminData('create_persona_template', { template });
      return result.data as PersonaTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-persona-analytics'] });
      toast.success('Persona template created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create persona template', { description: error.message });
    },
  });

  // Update persona template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PersonaTemplate> }) => {
      await invokeAdminData('update_persona_template', { id, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-persona-analytics'] });
      toast.success('Persona template updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update persona template', { description: error.message });
    },
  });

  // Delete persona template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_persona_template', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-templates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-persona-analytics'] });
      toast.success('Persona template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete persona template', { description: error.message });
    },
  });

  // Set default for users
  const setDefaultForUsersMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('set_persona_default_for_users', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-templates'] });
      toast.success('Default persona for new users updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to set default', { description: error.message });
    },
  });

  // Set default for spaces
  const setDefaultForSpacesMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('set_persona_default_for_spaces', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-templates'] });
      toast.success('Default persona for new spaces updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to set default', { description: error.message });
    },
  });

  // Create category
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<PersonaCategory, 'id' | 'created_at' | 'updated_at'>) => {
      await invokeAdminData('create_persona_category', { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create category', { description: error.message });
    },
  });

  // Update category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PersonaCategory> }) => {
      await invokeAdminData('update_persona_category', { id, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update category', { description: error.message });
    },
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_persona_category', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-persona-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete category', { description: error.message });
    },
  });

  return {
    templates,
    isLoading,
    analytics,
    categories,
    categoriesLoading,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    setDefaultForUsers: setDefaultForUsersMutation.mutate,
    setDefaultForSpaces: setDefaultForSpacesMutation.mutate,
    createCategory: createCategoryMutation.mutate,
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
  };
}
