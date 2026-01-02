import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PersonaTemplate {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  use_count: number;
  is_default_for_users: boolean;
  is_default_for_spaces: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    slug: string;
    icon: string | null;
  };
}

export const usePersonaTemplates = () => {
  const [templates, setTemplates] = useState<PersonaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase.functions.invoke('template-operations', {
        body: { action: 'get_persona_templates' },
      });

      if (fetchError) throw fetchError;
      setTemplates(data.data || []);
    } catch (err: any) {
      console.error('Error fetching persona templates:', err);
      setError('Failed to load persona templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.system_prompt.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || template.category_id === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const featuredTemplates = useMemo(() => {
    return templates.filter((t) => t.is_featured);
  }, [templates]);

  const incrementUseCount = async (templateId: string) => {
    try {
      await supabase.functions.invoke('template-operations', {
        body: { action: 'increment_persona_template_use', templateId },
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
    templates: filteredTemplates,
    featuredTemplates,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    incrementUseCount,
    refetch: fetchTemplates,
  };
};
