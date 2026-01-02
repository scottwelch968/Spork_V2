import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  model: string;
  created_at: string;
  metadata: any;
}

export const useImageGeneration = (userId: string | undefined, isWorkspaceChat: boolean, workspaceId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Simplified function for use with sendImageMessage - no toasts, just returns result
  const generateImageSimple = async (prompt: string, selectedModel?: string): Promise<{ url: string } | undefined> => {
    if (!userId) {
      throw new Error('Please sign in to generate images');
    }

    // Call the edge function to generate the image
    // Edge function handles context-aware file saving
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'generate-image',
      {
        body: { 
          prompt, 
          userId, 
          isWorkspaceChat,
          workspaceId: isWorkspaceChat ? workspaceId : undefined,
          selectedModel: selectedModel || 'auto' 
        },
      }
    );

    if (functionError) throw functionError;
    if (!functionData?.imageUrl) throw new Error('No image generated');

    return { url: functionData.imageUrl };
  };

  // Full function with toast notifications (for standalone use)
  const generateImage = async (prompt: string) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'Please sign in to generate images',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImageSimple(prompt);
      toast({
        title: 'Success',
        description: 'Image generated successfully',
      });
      return result;
    } catch (error: any) {
      console.error('Error generating image:', error);
      
      if (error.message?.includes('Rate limit')) {
        toast({
          title: 'Rate Limit Exceeded',
          description: 'Please wait a moment before generating another image.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('Payment required')) {
        toast({
          title: 'Credits Required',
          description: 'Please add credits to continue.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate image',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateImage,
    generateImageSimple,
  };
};
