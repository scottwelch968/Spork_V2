import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Sparkles } from 'lucide-react';
import { getModelIconUrl, getProviderIconColor } from '@/utils/modelIcons';
import { getAppMediaUrl, MEDIA_PATHS } from '@/utils/mediaUrl';
import type { MessageHeaderMessage } from '@/presentation/types';

const cosmoLogoUrl = getAppMediaUrl(MEDIA_PATHS.logo);

interface MessageHeaderProps {
  message: MessageHeaderMessage;
  activeModels?: { model_id: string; name: string }[];
}

export function MessageHeader({ message, activeModels }: MessageHeaderProps) {
  const getModelDisplayName = () => {
    if (!message.model || message.model === 'auto') return null;
    const model = activeModels?.find(m => m.model_id === message.model);
    if (model?.name) return model.name;
    // Fallback: extract from model ID (e.g., "anthropic/claude-3" -> "Claude 3")
    const parts = message.model.split('/');
    const last = parts[parts.length - 1];
    return last.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getCategory = () => {
    if (!message.detected_category) return null;
    return message.detected_category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const getIconUrl = () => {
    if (message.cosmo_selected) return cosmoLogoUrl;
    if (!message.model || message.model === 'auto') return cosmoLogoUrl;
    return getModelIconUrl(message.model, getProviderIconColor(message.model));
  };

  const modelDisplayName = getModelDisplayName();
  const category = getCategory();
  const iconUrl = getIconUrl();
  const isCosmoRouted = message.cosmo_selected;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-7 w-7 flex-shrink-0">
        {iconUrl && <AvatarImage src={iconUrl} alt="AI" className="p-1" />}
        <AvatarFallback className="bg-primary/10">
          <Bot className="h-3.5 w-3.5 text-primary" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex items-center gap-2 flex-wrap">
        {/* Cosmo Routed Attribution */}
        {isCosmoRouted && modelDisplayName ? (
          <span className="text-sm">
            <span className="font-semibold text-foreground">Cosmo Ai</span>
            <span className="text-muted-foreground mx-1">selected</span>
            <span className="font-semibold text-foreground">{modelDisplayName}</span>
          </span>
        ) : isCosmoRouted ? (
          <span className="font-semibold text-sm text-foreground">Cosmo Ai</span>
        ) : modelDisplayName ? (
          <span className="font-semibold text-sm text-foreground">{modelDisplayName}</span>
        ) : (
          <span className="font-semibold text-sm text-foreground">Cosmo Ai</span>
        )}
        
        {/* Category Badge */}
        {category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            {category}
          </span>
        )}
      </div>
    </div>
  );
}
