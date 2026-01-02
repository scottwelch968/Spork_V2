import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SpaceTemplate {
  id: string;
  name: string;
  description: string | null;
  ai_model: string | null;
  ai_instructions: string | null;
  compliance_rule: string | null;
  file_quota_mb: number | null;
  default_personas: any;
  default_prompts: any;
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  use_count: number;
  created_at: string;
  category?: {
    name: string;
    slug: string;
    icon: string | null;
  };
}

export const useSpaceTemplates = () => {
  const [templates, setTemplates] = useState<SpaceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('template-operations', {
        body: { action: 'get_space_templates' },
      });

      if (error) throw error;
      setTemplates(data.data || []);
    } catch (error: any) {
      console.error('Error fetching space templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load space templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const incrementUseCount = async (templateId: string) => {
    try {
      await supabase.functions.invoke('template-operations', {
        body: { action: 'increment_space_template_use', templateId },
      });

      // Optimistically update local state
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, use_count: t.use_count + 1 } : t
        )
      );
    } catch (error) {
      console.error('Error incrementing use count:', error);
    }
  };

  return {
    templates,
    loading,
    incrementUseCount,
    refetch: fetchTemplates,
  };
};
