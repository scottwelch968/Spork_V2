import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicModels } from '@/hooks/usePublicModels';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Code, Search, BarChart3, Brain, Image as ImageIcon, Video } from 'lucide-react';
import { getModelIconUrl, getProviderIconColor } from '@/utils/modelIcons';
import { getAppMediaUrl, MEDIA_PATHS } from '@/utils/mediaUrl';
import { COSMO_AI_NAME } from '@/utils/modelDisplayName';
import type { ModelCategory } from '@/types/models';

// Cosmo Ai logo URL
const cosmoLogoUrl = getAppMediaUrl(MEDIA_PATHS.logo);

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  mode?: 'chat' | 'image';
  onModeChange?: (mode: 'chat' | 'image') => void;
}

// Category display names for grouping
const categoryLabels: Record<string, string> = {
  conversation: 'Conversational (General)',
  research: 'Research',
  analysis: 'Analysis',
  image_generation: 'Image Gen',
  video_generation: 'Video Gen',
  coding: 'Coding',
  deep_think: 'Deep Think',
};

// Explicit category display order (top to bottom)
const categoryOrder: ModelCategory[] = [
  'conversation',
  'research',
  'analysis',
  'image_generation',
  'video_generation',
  'coding',
  'deep_think',
];

// Category icons for fallback when provider logo fails
const categoryIcons: Record<ModelCategory, React.ComponentType<{ className?: string }>> = {
  conversation: MessageCircle,
  coding: Code,
  research: Search,
  analysis: BarChart3,
  deep_think: Brain,
  image_generation: ImageIcon,
  video_generation: Video,
};

// Model icon component with fallback to category icon
function ModelIcon({ modelId, category }: { modelId: string; category: ModelCategory }) {
  const [imgError, setImgError] = useState(false);
  const iconUrl = getModelIconUrl(modelId, getProviderIconColor(modelId));
  const FallbackIcon = categoryIcons[category] || MessageCircle;

  if (imgError) {
    return <FallbackIcon className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <img 
      src={iconUrl} 
      alt="" 
      className="h-4 w-4 object-contain flex-shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

export function ModelSelector({ selectedModel, onModelChange, mode = 'chat', onModeChange }: ModelSelectorProps) {
  const { activeModels, isLoading } = usePublicModels();

  // Set default model on first load - default to Cosmo AI (auto)
  useEffect(() => {
    if (!isLoading && !selectedModel) {
      onModelChange('auto');
    }
  }, [isLoading, selectedModel, onModelChange]);

  // Filter to only show OpenRouter models (hide Lovable AI from users)
  const openRouterModels = activeModels.filter(m => m.provider === 'OpenRouter');

  // Group OpenRouter models by category (best_for)
  const groupedModels = openRouterModels.reduce((acc, model) => {
    const category = model.best_for || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {} as Record<string, typeof openRouterModels>);

  if (isLoading) {
    return (
      <div className="w-[220px] h-10 rounded-full border border-border bg-muted/50 animate-pulse" />
    );
  }

  // When in image mode, show static Cosmo Ai (Image) indicator
  if (mode === 'image') {
    return (
      <div className="flex items-center gap-2 px-4 h-10 rounded-full border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed">
        <ImageIcon className="h-4 w-4 text-primary" />
        <span>{COSMO_AI_NAME} (Image)</span>
      </div>
    );
  }

  // Get display value for the selected model
  const getDisplayValue = () => {
    if (selectedModel === 'auto') return COSMO_AI_NAME;
    const model = activeModels.find(m => m.model_id === selectedModel);
    return model?.name || selectedModel;
  };

  // Get icon for selected model
  const getSelectedIcon = () => {
    if (selectedModel === 'auto') {
      return <img src={cosmoLogoUrl} alt={COSMO_AI_NAME} className="h-4 w-4 object-contain" />;
    }
    const model = activeModels.find(m => m.model_id === selectedModel);
    const category = (model?.best_for || 'conversation') as ModelCategory;
    return <ModelIcon modelId={selectedModel} category={category} />;
  };

  return (
    <Select value={selectedModel || 'auto'} onValueChange={onModelChange}>
      <SelectTrigger className="w-[220px] rounded-full">
        <div className="flex items-center gap-2">
          {getSelectedIcon()}
          <span className="truncate">{getDisplayValue()}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="text-left">
        <SelectItem value="auto" className="text-left">
          <div className="flex items-center gap-2 justify-start">
            <img src={cosmoLogoUrl} alt={COSMO_AI_NAME} className="h-4 w-4 object-contain flex-shrink-0" />
            <span className="text-left">{COSMO_AI_NAME} - Auto-select best model</span>
          </div>
        </SelectItem>
        {categoryOrder.map((category) => {
          const models = groupedModels[category];
          if (!models?.length) return null;
          
          return (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase text-left">
                {categoryLabels[category] || category}
              </div>
              {models.map((model) => (
                <SelectItem key={model.model_id} value={model.model_id} className="text-left">
                  <div className="flex items-center gap-2 justify-start">
                    <ModelIcon modelId={model.model_id} category={(model.best_for || 'conversation') as ModelCategory} />
                    <span className="truncate text-left">{model.name}</span>
                    {model.is_free && (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
