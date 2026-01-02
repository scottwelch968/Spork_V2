import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MethodologyDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  display_order: number;
  created_at: string;
}

export const useMethodologyDocs = () => {
  const [docs, setDocs] = useState<MethodologyDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_methodology_docs')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setDocs((data as MethodologyDoc[]) || []);
    } catch (error: any) {
      console.error('Error fetching methodology docs:', error);
      toast({
        title: 'Error loading methodology',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const getCategories = () => {
    const categories = [...new Set(docs.map(d => d.category))];
    return categories;
  };

  const getDocsByCategory = (category: string) => {
    return docs.filter(d => d.category === category).sort((a, b) => a.display_order - b.display_order);
  };

  const exportDocs = (format: 'markdown' | 'json' = 'markdown') => {
    if (format === 'json') {
      return JSON.stringify(docs.map(d => ({
        title: d.title,
        category: d.category,
        content: d.content,
      })), null, 2);
    } else {
      let markdown = '# Lovable AI Methodology Guide\n\n';
      markdown += '*Exported from Spork AI Code Debugger*\n\n';
      markdown += '---\n\n';
      
      for (const doc of docs) {
        markdown += doc.content + '\n\n---\n\n';
      }
      
      return markdown;
    }
  };

  return {
    docs,
    isLoading,
    fetchDocs,
    getCategories,
    getDocsByCategory,
    exportDocs,
  };
};
