import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ChatContextType {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedPersona?: string;
  setSelectedPersona: (personaId: string) => void;
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;
  // Workspace awareness
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MODEL: 'spork_selected_model',
  PERSONA: 'spork_selected_persona',
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.MODEL) || 'auto';
    }
    return 'auto';
  });
  
  const [selectedPersona, setSelectedPersona] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.PERSONA) || undefined;
    }
    return undefined;
  });
  
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (selectedPersona) {
      localStorage.setItem(STORAGE_KEYS.PERSONA, selectedPersona);
    } else {
      localStorage.removeItem(STORAGE_KEYS.PERSONA);
    }
  }, [selectedPersona]);

  return (
    <ChatContext.Provider value={{
      selectedModel,
      setSelectedModel,
      selectedPersona,
      setSelectedPersona,
      pendingPrompt,
      setPendingPrompt,
      currentWorkspaceId,
      setCurrentWorkspaceId
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
