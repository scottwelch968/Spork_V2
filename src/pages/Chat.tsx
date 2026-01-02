import { UnifiedChatInterface } from '@/components/chat/UnifiedChatInterface';

export default function Chat() {
  return (
    <div className="h-[calc(100vh-64px)]">
      <UnifiedChatInterface context={{ type: 'personal' }} />
    </div>
  );
}
