import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/utils/logActivity';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  user_id: string;
  is_default: boolean;
  last_used_at: string | null;
}

export const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPrompts = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-operations', {
        body: { action: 'get_personal_prompts' },
      });

      if (error) throw error;
      setPrompts(data.data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load prompts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user?.id]);

  const createPrompt = async (title: string, content: string, category: string | null) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('prompt-operations', {
        body: { action: 'create_personal_prompt', title, content, category },
      });

      if (error) throw error;

      setPrompts(prev => [data.data, ...prev]);
      
      await logActivity({
        appSection: 'prompts',
        actorId: user.id,
        action: 'created',
        resourceType: 'prompt',
        resourceId: data.data.id,
        resourceName: title,
      });
      
      toast({
        title: 'Success',
        description: 'Prompt created successfully',
      });
      return data.data;
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to create prompt',
        variant: 'destructive',
      });
    }
  };

  const updatePrompt = async (id: string, title: string, content: string, category: string | null) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('prompt-operations', {
        body: { action: 'update_personal_prompt', promptId: id, title, content, category },
      });

      if (error) throw error;

      setPrompts(prev => prev.map(p => p.id === id ? data.data : p));
      
      await logActivity({
        appSection: 'prompts',
        actorId: user.id,
        action: 'updated',
        resourceType: 'prompt',
        resourceId: id,
        resourceName: title,
      });
      
      toast({
        title: 'Success',
        description: 'Prompt updated successfully',
      });
      return data.data;
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to update prompt',
        variant: 'destructive',
      });
    }
  };

  const deletePrompt = async (id: string) => {
    if (!user?.id) return;
    
    const prompt = prompts.find(p => p.id === id);
    
    if (prompt?.is_default) {
      toast({
        title: 'Cannot delete',
        description: 'The default prompt cannot be deleted',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase.functions.invoke('prompt-operations', {
        body: { action: 'delete_personal_prompt', promptId: id },
      });

      if (error) throw error;

      setPrompts(prev => prev.filter(p => p.id !== id));
      
      await logActivity({
        appSection: 'prompts',
        actorId: user.id,
        action: 'deleted',
        resourceType: 'prompt',
        resourceId: id,
        resourceName: prompt?.title,
      });
      
      toast({
        title: 'Success',
        description: 'Prompt deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete prompt',
        variant: 'destructive',
      });
    }
  };

  const trackUsage = async (promptId: string) => {
    if (!user?.id) return;
    
    const now = new Date().toISOString();
    
    try {
      await supabase.functions.invoke('prompt-operations', {
        body: { action: 'track_prompt_usage', promptId },
      });
      
      setPrompts(prev => prev.map(p => 
        p.id === promptId ? { ...p, last_used_at: now } : p
      ));
    } catch (error) {
      console.error('Error tracking prompt usage:', error);
    }
  };

  return {
    prompts,
    isLoading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    trackUsage,
    refetch: fetchPrompts,
  };
};
