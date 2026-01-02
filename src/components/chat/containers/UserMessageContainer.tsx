interface UserMessageContainerProps {
  index: number;
  content: string;
  senderName?: string;
  isWorkspace?: boolean;
}

export function UserMessageContainer({ 
  index,
  content, 
  senderName, 
  isWorkspace,
}: UserMessageContainerProps) {
  return (
    <div 
      data-container="user-message"
      data-message-index={index}
      className="user-message-container max-w-[920px] mx-auto px-6"
    >
      <div className="border border-border border-l-4 border-l-primary rounded-xl bg-muted/50 px-5 py-3 space-y-1 shadow-sm">
        <div className="font-semibold text-sm text-foreground">
          {isWorkspace && senderName ? senderName : 'You'}
        </div>
        <div className="text-foreground whitespace-pre-wrap leading-relaxed pl-2">
          {content}
        </div>
      </div>
    </div>
  );
}
