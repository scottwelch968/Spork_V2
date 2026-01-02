import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminDoc {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDocInput {
  title: string;
  slug: string;
  category: string;
  content: string;
  display_order?: number;
  is_published?: boolean;
}

export interface UpdateDocInput {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  content?: string;
  display_order?: number;
  is_published?: boolean;
}

export function useAdminDocumentation(category?: string) {
  const queryClient = useQueryClient();

  const { data: docs, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-documentation', category],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'get_documentation', category },
      });

      if (error) throw error;
      return data.data as AdminDoc[];
    },
  });

  const createDoc = useMutation({
    mutationFn: async (input: CreateDocInput) => {
      const { data, error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'create_documentation', docData: input },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documentation'] });
      toast.success('Documentation section created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateDoc = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateDocInput) => {
      const { data, error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'update_documentation', docId: id, updates },
      });

      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documentation'] });
      toast.success('Documentation updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke('admin-content', {
        body: { action: 'delete_documentation', docId: id },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documentation'] });
      toast.success('Documentation section deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const exportDocs = (format: 'markdown' | 'json' = 'markdown') => {
    if (!docs?.length) {
      toast.error('No documentation to export');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(docs, null, 2);
      filename = `documentation-${category || 'all'}.json`;
      mimeType = 'application/json';
    } else {
      content = docs
        .map(doc => `# ${doc.title}\n\n${doc.content}`)
        .join('\n\n---\n\n');
      filename = `documentation-${category || 'all'}.md`;
      mimeType = 'text/markdown';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${filename}`);
  };

  return {
    docs: docs || [],
    isLoading,
    error,
    refetch,
    createDoc,
    updateDoc,
    deleteDoc,
    exportDocs,
  };
}
