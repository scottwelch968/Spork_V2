import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePublicModels } from '@/hooks/usePublicModels';
import { Sparkles } from 'lucide-react';
import { COSMO_AI_AUTO_DESCRIPTION } from '@/utils/modelDisplayName';

interface SpaceModelSelectorProps {
  selectedModel: string | null;
  onModelChange: (model: string) => void;
}

// Category display names for grouping
const categoryLabels: Record<string, string> = {
  conversation: 'Conversational',
  coding: 'Coding',
  research: 'Research',
  analysis: 'Analysis',
  deep_think: 'Deep Think',
  image_generation: 'Image Generation',
  video_generation: 'Video Generation',
};

// Explicit category display order (top to bottom)
const categoryOrder = [
  'conversation',
  'coding',
  'research',
  'analysis',
  'deep_think',
  'image_generation',
  'video_generation',
] as const;

export function SpaceModelSelector({ selectedModel, onModelChange }: SpaceModelSelectorProps) {
  const { models } = usePublicModels();
  
  // Filter to only show active OpenRouter models (hide Lovable AI from users)
  const openRouterModels = models.filter(m => m.is_active && m.provider === 'OpenRouter');

  // Group models by category (best_for)
  const groupedModels = openRouterModels.reduce((acc, model) => {
    const category = model.best_for || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(model);
    return acc;
  }, {} as Record<string, typeof openRouterModels>);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Default Model</label>
      <Select value={selectedModel || 'system-default'} onValueChange={(value) => onModelChange(value === 'system-default' ? '' : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system-default">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {COSMO_AI_AUTO_DESCRIPTION}
            </div>
          </SelectItem>
          {categoryOrder.map((category) => {
            const categoryModels = groupedModels[category];
            if (!categoryModels?.length) return null;
            
            return (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                  {categoryLabels[category] || category}
                </div>
                {categoryModels.map((model) => (
                  <SelectItem key={model.id} value={model.model_id}>
                    {model.name}
                  </SelectItem>
                ))}
              </div>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
