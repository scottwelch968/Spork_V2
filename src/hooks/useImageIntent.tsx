import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIModel } from '@/types/models';

const IMAGE_KEYWORDS = /\b(image|picture|photo|draw|sketch|illustration|artwork|portrait|render|visualize|generate\s+(an?\s+)?image|create\s+(an?\s+)?image|make\s+(an?\s+)?image|show\s+me\s+(an?\s+)?image)\b/i;

export const useImageIntent = () => {
  const [configuredImageModel, setConfiguredImageModel] = useState<{ modelId: string; name: string } | null>(null);

  useEffect(() => {
    fetchConfiguredImageModel();
  }, []);

  const fetchConfiguredImageModel = async () => {
    try {
      // Get the configured image model from system_settings
      const { data: settings } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'image_model')
        .single();

      // setting_value can be a JSON object or string depending on storage format
      const settingValue = settings?.setting_value;
      const modelId = typeof settingValue === 'object' && settingValue !== null
        ? (settingValue as { model_id?: string })?.model_id
        : settingValue as string | null;
      
      if (modelId) {
        // Get the model name from ai_models
        const { data: model } = await supabase
          .from('ai_models')
          .select('name, model_id')
          .eq('model_id', modelId)
          .single();

        if (model) {
          setConfiguredImageModel({ modelId: model.model_id, name: model.name });
        }
      }
    } catch (error) {
      console.error('Error fetching configured image model:', error);
    }
  };

  // Detects image-related keywords in message
  const hasImageIntent = (message: string): boolean => {
    return IMAGE_KEYWORDS.test(message);
  };

  // Check if a model is an image generation model
  const isImageModel = (model: AIModel | undefined): boolean => {
    return model?.best_for === 'image_generation';
  };

  // Get the configured image model name for dialog display
  const getConfiguredImageModelName = (): string => {
    return configuredImageModel?.name || 'Image Generation Model';
  };

  return { 
    hasImageIntent, 
    isImageModel, 
    getConfiguredImageModelName,
    configuredImageModel 
  };
};
