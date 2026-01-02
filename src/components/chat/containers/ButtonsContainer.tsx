import { MessageActions } from '../MessageActions';

interface ButtonsContainerProps {
  index: number;
  content: string;
  chatTitle?: string;
  isSpaceChat?: boolean;
  spaceId?: string;
  onRegenerate?: () => void;
}

export function ButtonsContainer({ 
  index, 
  content, 
  chatTitle,
  isSpaceChat,
  spaceId,
  onRegenerate 
}: ButtonsContainerProps) {
  return (
    <div 
      data-container="buttons"
      data-message-index={index}
      className="buttons-container max-w-[920px] mx-auto px-6"
    >
      <div className="px-2">
        <MessageActions
          content={content}
          messageIndex={index}
          chatTitle={chatTitle}
          isSpaceChat={isSpaceChat}
          spaceId={spaceId}
          onRegenerate={onRegenerate}
        />
      </div>
    </div>
  );
}
