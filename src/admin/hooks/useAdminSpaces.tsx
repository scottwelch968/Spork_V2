import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpaceCategory {
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

export interface SpaceTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  display_mode: string | null;
  color_code: string | null;
  category_id: string | null;
  ai_model: string | null;
  ai_instructions: string | null;
  compliance_rule: string | null;
  file_quota_mb: number | null;
  default_personas?: Record<string, unknown>[] | null;
  default_prompts?: Record<string, unknown>[] | null;
  is_active: boolean;
  is_featured: boolean;
  use_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data from category
  space_categories?: {
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export type SpaceTemplateInput = Partial<Omit<SpaceTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'use_count' | 'space_categories'>> & {
  name: string;
};

export interface AdminSpace {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  owner_name: string | null;
  is_suspended: boolean;
  is_archived: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  memberCount: number;
  chatCount: number;
  storageUsedMB: number;
  tokenUsage30d: number;
}

export interface SpaceAnalytics {
  totalSpaces: number;
  activeSpaces: number;
  suspendedSpaces: number;
  archivedSpaces: number;
  totalStorageGB: number;
  totalChats: number;
  totalMembers: number;
  totalTokens: number;
  spacesOverTime: AdminSpace[];
}

const getSessionToken = () => localStorage.getItem('system_session_token');

const invokeAdminData = async (action: string, params: Record<string, unknown> = {}) => {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: getSessionToken(), ...params }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

export const useAdminSpaces = () => {
  const queryClient = useQueryClient();

  // Fetch all spaces with detailed info
  const { data: spaces, isLoading } = useQuery({
    queryKey: ['admin-spaces'],
    queryFn: async () => {
      const result = await invokeAdminData('get_all_spaces');
      return (result.data || []) as AdminSpace[];
    },
  });

  // Get space details
  const getSpaceDetails = async (spaceId: string) => {
    const space = spaces?.find((s) => s.id === spaceId);
    return space || null;
  };

  // Suspend space
  const suspendMutation = useMutation({
    mutationFn: async ({ spaceId, reason }: { spaceId: string; reason: string }) => {
      await invokeAdminData('suspend_space', { spaceId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spaces'] });
      toast.success('Space suspended successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to suspend space: ${error.message}`);
    },
  });

  // Unsuspend space
  const unsuspendMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      await invokeAdminData('unsuspend_space', { spaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spaces'] });
      toast.success('Space unsuspended successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to unsuspend space: ${error.message}`);
    },
  });

  // Delete space
  const deleteMutation = useMutation({
    mutationFn: async (spaceId: string) => {
      await invokeAdminData('delete_space', { spaceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spaces'] });
      toast.success('Space deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete space: ${error.message}`);
    },
  });

  // Reassign space
  const reassignMutation = useMutation({
    mutationFn: async ({ spaceId, newOwnerId }: { spaceId: string; newOwnerId: string }) => {
      await invokeAdminData('reassign_space', { spaceId, newOwnerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-spaces'] });
      toast.success('Space reassigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reassign space: ${error.message}`);
    },
  });

  // Get analytics from spaces data
  const analytics: SpaceAnalytics | null = spaces ? {
    totalSpaces: spaces.length,
    activeSpaces: spaces.filter((w) => !w.is_suspended && !w.is_archived).length,
    suspendedSpaces: spaces.filter((w) => w.is_suspended).length,
    archivedSpaces: spaces.filter((w) => w.is_archived).length,
    totalStorageGB: Math.round(spaces.reduce((sum, w) => sum + (w.storageUsedMB || 0), 0) / 1024 * 100) / 100,
    totalChats: spaces.reduce((sum, w) => sum + (w.chatCount || 0), 0),
    totalMembers: spaces.reduce((sum, w) => sum + (w.memberCount || 0), 0),
    totalTokens: spaces.reduce((sum, w) => sum + (w.tokenUsage30d || 0), 0),
    spacesOverTime: spaces,
  } : null;

  // Category queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['space-categories'],
    queryFn: async () => {
      const result = await invokeAdminData('get_space_categories');
      return (result.data || []) as SpaceCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: Omit<SpaceCategory, 'id' | 'created_at' | 'updated_at'>) => {
      await invokeAdminData('create_space_category', { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create category: ${error.message}`);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...category }: Partial<SpaceCategory> & { id: string }) => {
      await invokeAdminData('update_space_category', { category: { id, ...category } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_space_category', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-categories'] });
      queryClient.invalidateQueries({ queryKey: ['space-templates'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete category: ${error.message}`);
    },
  });

  // Template queries
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['space-templates'],
    queryFn: async () => {
      const result = await invokeAdminData('get_space_templates');
      return (result.data || []) as SpaceTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: SpaceTemplateInput) => {
      await invokeAdminData('create_space_template', { template });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<SpaceTemplate> & { id: string }) => {
      await invokeAdminData('update_space_template', { template: { id, ...template } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await invokeAdminData('delete_space_template', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  return {
    spaces,
    isLoading,
    getSpaceDetails,
    suspendSpace: suspendMutation.mutate,
    unsuspendSpace: unsuspendMutation.mutate,
    deleteSpace: deleteMutation.mutate,
    reassignSpace: reassignMutation.mutate,
    analytics,
    templates,
    templatesLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    categories: categories || [],
    categoriesLoading,
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
  };
};
