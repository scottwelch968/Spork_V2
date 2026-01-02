import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageMessageResponse } from '../ImageMessageResponse';

interface ModelResponseContainerProps {
  index: number;
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  isExpired?: boolean;
  isSavedToMedia?: boolean;
  messageId?: string;
  model?: string;
  isStreaming?: boolean;
  onSaveToMedia?: (imageUrl: string, prompt: string, messageId?: string, model?: string) => Promise<void>;
}

export function ModelResponseContainer({ 
  index, 
  content, 
  type = 'text',
  imageUrl,
  isExpired,
  isSavedToMedia,
  messageId,
  model,
  isStreaming,
  onSaveToMedia
}: ModelResponseContainerProps) {
  return (
    <div 
      data-container="model-response"
      data-message-index={index}
      className="model-response-container max-w-[920px] mx-auto px-6"
    >
      <div className="px-2">
        {/* Streaming indicator */}
        {isStreaming && !content && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {/* Expired image */}
        {isExpired && (
          <ImageMessageResponse 
            imageUrl=""
            prompt={content}
            isExpired={true}
            onSaveToMedia={async () => {}}
          />
        )}

        {/* Active image */}
        {!isExpired && type === 'image' && imageUrl && (
          <ImageMessageResponse 
            imageUrl={imageUrl}
            prompt={content}
            isSavedToMedia={isSavedToMedia}
            onSaveToMedia={() => onSaveToMedia?.(imageUrl, content, messageId, model)}
          />
        )}

        {/* Text response */}
        {!isExpired && type === 'text' && content && (
          <div className="prose prose-chat dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
