import { Badge } from '@/admin/ui/badge';
import { MessageCircle, Code, Search, BarChart3, Brain, Image, Video } from 'lucide-react';
import type { ModelCategory } from '@/types/models';

interface ModelCategoryBadgeProps {
  category: ModelCategory;
}

const categoryConfig: Record<ModelCategory, { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' }> = {
  conversation: { label: 'Conversational', icon: MessageCircle, variant: 'default' },
  coding: { label: 'Coding', icon: Code, variant: 'success' },
  research: { label: 'Research', icon: Search, variant: 'secondary' },
  analysis: { label: 'Analysis', icon: BarChart3, variant: 'warning' },
  deep_think: { label: 'Deep Think', icon: Brain, variant: 'outline' },
  image_generation: { label: 'Image Gen', icon: Image, variant: 'outline' },
  video_generation: { label: 'Video Gen', icon: Video, variant: 'outline' },
};

export const ModelCategoryBadge = ({ category }: ModelCategoryBadgeProps) => {
  const config = categoryConfig[category] || categoryConfig.conversation;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1.5">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
