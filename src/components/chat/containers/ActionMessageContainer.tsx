import { ModelActionBox } from '../ModelActionBox';

type ActionBoxStage = 'idle' | 'analyzing' | 'booting' | 'ready' | 'closed';

interface ActionMessageContainerProps {
  index: number;
  modelInfo: {
    modelId: string;
    modelName: string;
    isAuto: boolean;
    category?: string;
  };
  isStreaming?: boolean;
  stage?: ActionBoxStage;
}

export function ActionMessageContainer({ 
  index, 
  modelInfo, 
  isStreaming, 
  stage 
}: ActionMessageContainerProps) {
  return (
    <div 
      data-container="action-message"
      data-message-index={index}
      className="action-message-container max-w-[920px] mx-auto px-6"
    >
      <div className="px-2">
        <ModelActionBox
          mode={isStreaming ? 'live' : 'historical'}
          stage={stage}
          modelInfo={modelInfo}
          defaultExpanded={false}
        />
      </div>
    </div>
  );
}
