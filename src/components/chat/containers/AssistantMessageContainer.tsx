import { ModelActionBox } from '../ModelActionBox';
import { ResponseContentContainer } from './ResponseContentContainer';

interface AssistantMessageContainerProps {
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  isExpired?: boolean;
  isSavedToMedia?: boolean;
  messageIndex: number;
  messageId?: string;
  model: string;
  modelName: string;
  isAuto: boolean;
  category?: string;
  isSpaceChat?: boolean;
  spaceId?: string;
  isStreaming?: boolean;
  onSaveToMedia?: (imageUrl: string, prompt: string, messageId?: string, model?: string) => Promise<void>;
}

export function AssistantMessageContainer({
  content,
  type = 'text',
  imageUrl,
  isExpired,
  isSavedToMedia,
  messageIndex,
  messageId,
  model,
  modelName,
  isAuto,
  category,
  isSpaceChat,
  spaceId,
  isStreaming,
  onSaveToMedia,
}: AssistantMessageContainerProps) {
  return (
    <div className="assistant-message-container space-y-3">
      <ModelActionBox
        mode="historical"
        modelInfo={{
          modelId: model,
          modelName,
          isAuto,
          category,
        }}
        defaultExpanded={false}
      />
      
      <ResponseContentContainer
        content={content}
        type={type}
        imageUrl={imageUrl}
        isExpired={isExpired}
        isSavedToMedia={isSavedToMedia}
        messageIndex={messageIndex}
        messageId={messageId}
        model={model}
        isSpaceChat={isSpaceChat}
        spaceId={spaceId}
        isStreaming={isStreaming}
        onSaveToMedia={onSaveToMedia}
      />
    </div>
  );
}
