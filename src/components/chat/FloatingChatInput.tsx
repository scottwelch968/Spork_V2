import { useChatInput } from '@/contexts/ChatInputContext';
import { MessageInput } from './MessageInput';

/**
 * FloatingChatInput - Viewport-fixed chat input
 * 
 * This component renders OUTSIDE the main page layout as a sibling,
 * making it completely independent of page scroll and container nesting.
 * 
 * Position: fixed to viewport bottom, centered horizontally
 * Z-index: 50 to float above all page content
 */
export function FloatingChatInput() {
  const { state, actions, isVisible, inputRef } = useChatInput();
  
  // Don't render if not visible or no actions registered
  if (!isVisible || !actions) {
    return null;
  }
  
  return (
    <div 
      ref={inputRef}
      className="fixed bottom-0 z-50 pointer-events-none"
      style={{
        left: 'var(--left-sidebar-width, 64px)',
        right: 'var(--right-sidebar-width, 0px)',
      }}
    >
      <div className="max-w-[920px] mx-auto px-6 pb-4 pointer-events-auto">
        <div className="bg-background rounded-t-lg">
          <MessageInput
            onSend={actions.onSend}
            isLoading={state.isLoading}
            mode={state.chatMode}
            onModeChange={actions.onModeChange}
            onRefresh={actions.onRefresh}
            selectedModel={state.selectedModel}
            onModelChange={actions.onModelChange}
            selectedPersona={state.selectedPersona}
            onPersonaChange={actions.onPersonaChange}
            context={state.context || undefined}
          />
        </div>
      </div>
    </div>
  );
}
