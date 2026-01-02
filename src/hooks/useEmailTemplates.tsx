import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  subject_template: string;
  html_content: string;
  text_content?: string;
  variables: string[];
  version: number;
  version_history: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = async (filters?: { category?: string; status?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'list',
          data: filters,
        },
      });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Partial<EmailTemplate>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'create',
          data: templateData,
        },
      });

      if (error) throw error;
      toast.success('Template created successfully');
      await loadTemplates();
      return data;
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  const updateTemplate = async (id: string, templateData: Partial<EmailTemplate>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'update',
          template_id: id,
          data: templateData,
        },
      });

      if (error) throw error;
      toast.success('Template updated successfully');
      await loadTemplates();
      return data;
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      throw error;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'delete',
          template_id: id,
        },
      });

      if (error) throw error;
      toast.success('Template archived successfully');
      await loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to archive template');
      throw error;
    }
  };

  const duplicateTemplate = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'duplicate',
          template_id: id,
        },
      });

      if (error) throw error;
      toast.success('Template duplicated successfully');
      await loadTemplates();
      return data;
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
      throw error;
    }
  };

  const previewTemplate = async (id: string, variables: Record<string, any>) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-email-template', {
        body: {
          action: 'preview',
          template_id: id,
          variables,
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error previewing template:', error);
      toast.error('Failed to preview template');
      throw error;
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    previewTemplate,
  };
};
