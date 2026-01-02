import { createContext, useContext, useState, useRef, ReactNode, RefObject } from 'react';
import type { ChatContext as ChatContextType } from '@/presentation/types';

interface ChatInputState {
  selectedModel: string;
  selectedPersona: string;
  chatMode: 'chat' | 'image';
  isLoading: boolean;
  context: ChatContextType | null;
}

interface ChatInputActions {
  onSend: (content: string, files?: File[]) => void;
  onModelChange: (model: string) => void;
  onPersonaChange: (personaId: string) => void;
  onModeChange: (mode: 'chat' | 'image') => void;
  onRefresh: () => void;
}

interface ChatInputContextType {
  // State
  state: ChatInputState;
  setState: (updates: Partial<ChatInputState>) => void;
  
  // Actions - set by UnifiedChatInterface
  actions: ChatInputActions | null;
  setActions: (actions: ChatInputActions) => void;
  
  // Visibility
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  
  // Ref for scroll calculations (input height)
  inputRef: RefObject<HTMLDivElement>;
}

const ChatInputContext = createContext<ChatInputContextType | undefined>(undefined);

export function ChatInputProvider({ children }: { children: ReactNode }) {
  const [state, setStateInternal] = useState<ChatInputState>({
    selectedModel: 'auto',
    selectedPersona: '',
    chatMode: 'chat',
    isLoading: false,
    context: null,
  });
  
  const [actions, setActions] = useState<ChatInputActions | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  
  const setState = (updates: Partial<ChatInputState>) => {
    setStateInternal(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <ChatInputContext.Provider value={{
      state,
      setState,
      actions,
      setActions,
      isVisible,
      setIsVisible,
      inputRef,
    }}>
      {children}
    </ChatInputContext.Provider>
  );
}

export function useChatInput() {
  const context = useContext(ChatInputContext);
  if (context === undefined) {
    throw new Error('useChatInput must be used within a ChatInputProvider');
  }
  return context;
}
