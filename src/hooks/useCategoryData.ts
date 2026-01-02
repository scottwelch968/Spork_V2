import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean;
}

export interface PersonaCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean;
}

export function useCategoryData() {
  // Fetch space categories
  const { data: spaceCategories = [], isLoading: spaceCategoriesLoading } = useQuery({
    queryKey: ['space-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('space_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data || []) as SpaceCategory[];
    },
  });

  // Fetch persona categories
  const { data: personaCategories = [], isLoading: personaCategoriesLoading } = useQuery({
    queryKey: ['persona-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('persona_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return (data || []) as PersonaCategory[];
    },
  });

  return {
    spaceCategories,
    personaCategories,
    isLoading: spaceCategoriesLoading || personaCategoriesLoading,
  };
}
