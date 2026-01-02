import { useState, useRef, useCallback } from 'react';
import type { UIMessage as Message } from '@/presentation/types';

interface UseMessagesReturn {
  messages: Message[];
  streamingMessage: Message | null;
  isLoading: boolean;
  isLoadingExistingChat: boolean;
  messageCountRef: React.MutableRefObject<number>;
  isAddingMessageRef: React.MutableRefObject<boolean>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setStreamingMessage: React.Dispatch<React.SetStateAction<Message | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingExistingChat: React.Dispatch<React.SetStateAction<boolean>>;
  addUserMessage: (content: string) => number;
  addAssistantMessage: (message: Message) => void;
  updateStreamingMessage: (message: Message | null) => void;
  resetMessages: () => void;
  rollbackLastMessage: () => void;
}

export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExistingChat, setIsLoadingExistingChat] = useState(false);
  
  const messageCountRef = useRef(0);
  const isAddingMessageRef = useRef(false);

  const addUserMessage = useCallback((content: string): number => {
    isAddingMessageRef.current = true;
    const userMessage: Message = { role: 'user', content };
    const newMessageIndex = messageCountRef.current;
    messageCountRef.current += 1;
    
    setMessages(prev => [...prev, userMessage]);
    setStreamingMessage(null);
    setIsLoading(true);
    
    return newMessageIndex;
  }, []);

  const addAssistantMessage = useCallback((message: Message) => {
    messageCountRef.current += 1;
    setMessages(prev => [...prev, message]);
    setStreamingMessage(null);
  }, []);

  const updateStreamingMessage = useCallback((message: Message | null) => {
    setStreamingMessage(message);
  }, []);

  const resetMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
    messageCountRef.current = 0;
  }, []);

  const rollbackLastMessage = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
    messageCountRef.current -= 1;
  }, []);

  return {
    messages,
    streamingMessage,
    isLoading,
    isLoadingExistingChat,
    messageCountRef,
    isAddingMessageRef,
    setMessages,
    setStreamingMessage,
    setIsLoading,
    setIsLoadingExistingChat,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    resetMessages,
    rollbackLastMessage,
  };
}
