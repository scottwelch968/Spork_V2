import { ReactNode } from 'react';

interface MessageContainerProps {
  role: 'user' | 'assistant' | 'system';
  children: ReactNode;
  isStreaming?: boolean;
}

export function MessageContainer({ role, children, isStreaming }: MessageContainerProps) {
  return (
    <div 
      data-message-role={role}
      data-streaming={isStreaming ? 'true' : undefined}
      className="message-container max-w-[920px] mx-auto px-6 mt-2 first:mt-0 animate-fade-in"
    >
      <div className="px-2">
        {children}
      </div>
    </div>
  );
}
