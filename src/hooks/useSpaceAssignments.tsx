import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SpaceAssignment {
  id: string;
  user_id: string;
  space_id: string;
  folder_id: string | null;
  is_pinned: boolean;
  created_at: string;
}

export function useSpaceAssignments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['space-assignments', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_space_assignments')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as SpaceAssignment[];
    },
  });

  const assignToFolderMutation = useMutation({
    mutationFn: async ({ spaceId, folderId }: { spaceId: string; folderId: string | null }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_space_assignments')
        .upsert({
          user_id: user.id,
          space_id: spaceId,
          folder_id: folderId,
        }, {
          onConflict: 'user_id,space_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-assignments'] });
    },
  });

  return {
    assignments,
    isLoading,
    assignToFolder: assignToFolderMutation.mutate,
  };
}
