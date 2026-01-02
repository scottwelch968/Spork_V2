import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Bot, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getModelIconUrl, getProviderIconColor } from '@/utils/modelIcons';
import { getAppMediaUrl, MEDIA_PATHS } from '@/utils/mediaUrl';
import type { ActionBoxStage } from '@/hooks/useModelActionBox';

const cosmoLogoUrl = getAppMediaUrl(MEDIA_PATHS.logo);

interface ModelInfo {
  modelId: string;
  modelName: string;
  isAuto: boolean;
  category?: string;
}

interface ModelActionBoxProps {
  // For live streaming - uses stage from hook
  stage?: ActionBoxStage;
  modelInfo: ModelInfo | null;
  // Mode: 'live' uses stage prop, 'historical' always renders ready state
  mode?: 'live' | 'historical';
  // For historical messages - control default expanded state
  defaultExpanded?: boolean;
}

export function ModelActionBox({ stage, modelInfo, mode = 'live', defaultExpanded = false }: ModelActionBoxProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // For historical mode, always render as ready state
  const effectiveStage = mode === 'historical' ? 'ready' : stage;

  // Don't render for idle or closed stages (live mode only)
  if (mode === 'live' && (effectiveStage === 'idle' || effectiveStage === 'closed')) {
    return null;
  }

  // Don't render without model info
  if (!modelInfo) {
    return null;
  }

  const { modelId, modelName, isAuto, category } = modelInfo;

  // Determine icon based on stage and isAuto
  const getIconUrl = () => {
    if (effectiveStage === 'analyzing') {
      // Always Cosmo during analyzing
      return cosmoLogoUrl;
    }
    if (isAuto) {
      // For Cosmo, show Cosmo branding
      return cosmoLogoUrl;
    }
    // Manual model: show model's icon
    return getModelIconUrl(modelId, getProviderIconColor(modelId));
  };

  const iconUrl = getIconUrl();
  const categoryLabel = category || 'this task';

  // ANALYZING stage - Cosmo is analyzing (live mode only)
  if (effectiveStage === 'analyzing') {
    return (
      <div className="border border-border rounded-xl bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-5 w-5">
            <AvatarImage src={cosmoLogoUrl} alt="Cosmo Ai" className="p-0.5" />
            <AvatarFallback className="bg-primary/10">
              <Bot className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          
          <span className="text-sm text-foreground">
            <span className="font-medium">Cosmo Ai</span>
            <span className="text-muted-foreground"> is analyzing your request...</span>
          </span>
        </div>
      </div>
    );
  }

  // BOOTING stage - Model is booting up (live mode only)
  if (effectiveStage === 'booting') {
    return (
      <div className="border border-border rounded-xl bg-muted/30 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar className="h-5 w-5">
            <AvatarImage src={iconUrl} alt={modelName} className="p-0.5" />
            <AvatarFallback className="bg-primary/10">
              <Bot className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          
          <span className="text-sm text-foreground">
            Booting up your Ai...
          </span>
        </div>
      </div>
    );
  }

  // READY stage - Model selected and ready (collapsible) - used for both live and historical
  if (effectiveStage === 'ready') {
    return (
      <div className="border border-border rounded-xl bg-muted/30 overflow-hidden mt-2 mb-5">
        {/* Collapsible Header - Completed State */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          
          <Avatar className="h-5 w-5">
            <AvatarImage src={iconUrl} alt={modelName} className="p-0.5" />
            <AvatarFallback className="bg-primary/10">
              <Bot className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          
          <Check className="h-3.5 w-3.5 text-green-500" />
          
          <span className="text-sm text-foreground">
            {isAuto ? (
              <>
                <span className="font-medium">Cosmo Ai</span>
                <span className="text-muted-foreground"> selected {modelName}</span>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">Using </span>
                <span className="font-medium">{modelName}</span>
              </>
            )}
          </span>
        </button>

        {/* Expanded Content - Routing Details */}
        {expanded && (
          <div className="px-4 pb-3 pt-1 border-t border-border/50">
            <div className="space-y-1.5 pl-7">
              {isAuto && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Category detected: <span className="text-foreground">{categoryLabel}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Model selected: <span className="text-foreground">{modelName}</span></span>
                  </div>
                </>
              )}
              {!isAuto && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>Using: <span className="text-foreground">{modelName}</span></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
