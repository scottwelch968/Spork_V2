import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ImageMessageResponse } from '../ImageMessageResponse';
import { MessageActions } from '../MessageActions';

interface ResponseContentContainerProps {
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  isExpired?: boolean;
  isSavedToMedia?: boolean;
  messageIndex: number;
  messageId?: string;
  model?: string;
  isSpaceChat?: boolean;
  spaceId?: string;
  isStreaming?: boolean;
  onSaveToMedia?: (imageUrl: string, prompt: string, messageId?: string, model?: string) => Promise<void>;
}

export function ResponseContentContainer({
  content,
  type = 'text',
  imageUrl,
  isExpired,
  isSavedToMedia,
  messageIndex,
  messageId,
  model,
  isSpaceChat,
  spaceId,
  isStreaming,
  onSaveToMedia,
}: ResponseContentContainerProps) {
  // Streaming with no content yet
  if (isStreaming && !content) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Thinking...</span>
      </div>
    );
  }

  // Expired image
  if (isExpired) {
    return (
      <ImageMessageResponse 
        imageUrl=""
        prompt={content}
        isExpired={true}
        onSaveToMedia={async () => {}}
      />
    );
  }

  // Active image
  if (type === 'image' && imageUrl) {
    return (
      <ImageMessageResponse 
        imageUrl={imageUrl}
        prompt={content}
        isSavedToMedia={isSavedToMedia}
        onSaveToMedia={() => onSaveToMedia?.(imageUrl, content, messageId, model)}
      />
    );
  }

  // Text response
  return (
    <div className="response-content-container">
      <div className="prose prose-chat dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
      {!isStreaming && (
        <MessageActions
          content={content}
          messageIndex={messageIndex}
          isSpaceChat={isSpaceChat}
          spaceId={spaceId}
        />
      )}
    </div>
  );
}
