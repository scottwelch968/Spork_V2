import { useState, useEffect, useCallback } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import { useSpace } from '@/hooks/useSpace';
import { useUnifiedPersonas } from '@/hooks/useUnifiedPersonas';
import type { ChatContext as ChatContextType } from '@/presentation/types';

interface UseChatStateProps {
  context: ChatContextType;
  onUpdateChat?: (updates: { title?: string; model?: string; persona_id?: string }) => void;
}

interface UseChatStateReturn {
  selectedModel: string;
  selectedPersona: string;
  chatMode: 'chat' | 'image';
  setSelectedModel: (model: string) => void;
  handleModelChange: (model: string) => void;
  handlePersonaChange: (personaId: string) => Promise<void>;
  setChatMode: (mode: 'chat' | 'image') => void;
  personas: Array<{ id: string; name: string; is_default?: boolean; [key: string]: any }>;
}

export function useChatState({ context, onUpdateChat }: UseChatStateProps): UseChatStateReturn {
  const isWorkspaceChat = context.type === 'workspace';
  const workspaceId = isWorkspaceChat ? context.workspaceId : undefined;

  const { data: personas = [] } = useUnifiedPersonas(context);
  const { selectedPersona: contextPersona, setSelectedPersona: setContextPersona } = useChatContext();
  const { spaces, updateSelectedPersona } = useSpace();

  const currentWorkspace = context.type === 'workspace' && workspaceId 
    ? spaces?.find(w => w.id === workspaceId) 
    : null;

  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [chatMode, setChatMode] = useState<'chat' | 'image'>('chat');

  // Load persona based on context
  useEffect(() => {
    if (personas.length === 0) return;

    // Already have a valid persona selected
    if (selectedPersona && personas.some(p => p.id === selectedPersona)) {
      return;
    }

    if (context.type === 'workspace' && currentWorkspace) {
      // Try workspace's saved persona first
      if (currentWorkspace.selected_persona_id) {
        const storedPersona = personas.find(p => p.id === currentWorkspace.selected_persona_id);
        if (storedPersona) {
          setSelectedPersona(storedPersona.id);
          return;
        }
      }
      
      // Fall back to default persona
      const defaultPersona = personas.find(p => p.is_default);
      if (defaultPersona) {
        setSelectedPersona(defaultPersona.id);
      } else if (personas.length > 0) {
        setSelectedPersona(personas[0].id);
      }
    } else {
      // Personal chat - check context first
      if (contextPersona) {
        const personaExists = personas.some(p => p.id === contextPersona);
        if (personaExists) {
          setSelectedPersona(contextPersona);
          return;
        }
      }
      
      // Fall back to default
      const defaultPersona = personas.find(p => p.is_default);
      if (defaultPersona) {
        setSelectedPersona(defaultPersona.id);
      }
    }
  }, [personas.length, context.type, currentWorkspace?.id, currentWorkspace?.selected_persona_id, contextPersona]);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    onUpdateChat?.({ model });
  }, [onUpdateChat]);

  const handlePersonaChange = useCallback(async (personaId: string) => {
    setSelectedPersona(personaId);

    if (context.type === 'workspace' && workspaceId) {
      try {
        await updateSelectedPersona({ workspaceId, personaId });
      } catch (error) {
        console.error('Failed to save workspace persona:', error);
      }
    } else {
      setContextPersona(personaId);
    }

    onUpdateChat?.({ persona_id: personaId });
  }, [context.type, workspaceId, updateSelectedPersona, setContextPersona, onUpdateChat]);

  return {
    selectedModel,
    selectedPersona,
    chatMode,
    setSelectedModel,
    handleModelChange,
    handlePersonaChange,
    setChatMode,
    personas,
  };
}
