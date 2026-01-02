import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useMessages } from './useMessages';
import { useChatAPI } from './useChatAPI';
import { queueSave } from './useChatPersistence';
import { logActivity } from '@/utils/logActivity';
import { chatEvents } from './useChatEvents';
import type { ChatContext, UIMessage as Message, ChatConfig } from '@/presentation/types';

interface UseChatUnifiedOptions {
  context: ChatContext;
  chatId?: string;
  config?: ChatConfig;
  onChatCreated?: (chatId: string) => void;
  onModelSync?: (model: string) => void;
  preventNavigation?: boolean;
}

export function useChatUnified({ context, chatId: externalChatId, config, onChatCreated, onModelSync, preventNavigation }: UseChatUnifiedOptions) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const urlChatId = context.type === 'personal' ? searchParams.get('id') : null;
  const activeChatId = externalChatId || urlChatId;
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(activeChatId || null);
  const pendingNavigationRef = useRef<string | null>(null);

  const chatsTable = context.type === 'personal' ? 'chats' : 'space_chats';
  const messagesTable = context.type === 'personal' ? 'messages' : 'space_chat_messages';
  const queryKey = context.type === 'personal' ? ['user-chats'] : ['space-chats', context.workspaceId];

  // Compose smaller hooks
  const {
    messages,
    streamingMessage,
    isLoading,
    isLoadingExistingChat,
    messageCountRef,
    isAddingMessageRef,
    setMessages,
    setIsLoading,
    setIsLoadingExistingChat,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    resetMessages,
    rollbackLastMessage,
  } = useMessages();

  const { streamChatResponse, actionBox } = useChatAPI({
    context,
    messagesTable,
    config,
  });

  // Load existing chat when ID changes
  useEffect(() => {
    if (isAddingMessageRef.current || isLoading || streamingMessage) return;
    if (activeChatId === currentChatId && messages.length > 0) return;
    
    if (activeChatId) {
      loadExistingChat(activeChatId);
    } else {
      resetMessages();
      setCurrentChatId(null);
    }
  }, [activeChatId]);

  const loadExistingChat = useCallback(async (chatId: string) => {
    setIsLoadingExistingChat(true);
    try {
      const { data: chatExists, error: chatCheckError } = await supabase
        .from(chatsTable)
        .select('id')
        .eq('id', chatId)
        .maybeSingle();
      
      if (chatCheckError || !chatExists) {
        console.warn('Chat not found (may have been deleted):', chatId);
        resetMessages();
        setCurrentChatId(null);
        if (context.type === 'personal') {
          navigate('/chat', { replace: true });
        }
        return;
      }
      
      const selectQuery = context.type === 'workspace'
        ? '*, profiles:user_id (first_name, last_name)'
        : '*';
      
      const { data, error } = await supabase
        .from(messagesTable)
        .select(selectQuery)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = (data || []).map((msg: any) => {
        const senderName = msg.profiles 
          ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}`.trim() || 'Team Member'
          : undefined;
        
        if (msg.content.startsWith('[IMAGE:')) {
          const urlEnd = msg.content.indexOf(']');
          const imageUrl = msg.content.slice(7, urlEnd);
          const prompt = msg.content.slice(urlEnd + 2);
          const isSavedToMedia = (imageUrl.includes('/user-files/') || imageUrl.includes('/workspace-files/')) 
            && !imageUrl.includes('/temp-ai-images/');
          
          return {
            role: msg.role as 'user' | 'assistant',
            content: prompt,
            type: 'image' as const,
            imageUrl,
            model: msg.model || undefined,
            messageId: msg.id,
            isSavedToMedia,
            userId: msg.user_id,
            senderName,
            cosmo_selected: msg.cosmo_selected || false,
            detected_category: msg.detected_category || '',
          };
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          model: msg.model || undefined,
          messageId: msg.id,
          userId: msg.user_id,
          senderName,
          cosmo_selected: msg.cosmo_selected || false,
          detected_category: msg.detected_category || '',
        };
      });

      setMessages(loadedMessages);
      messageCountRef.current = loadedMessages.length;
      setCurrentChatId(chatId);
      
      const lastAssistantMessage = loadedMessages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage && onModelSync) {
        const modelToSync = lastAssistantMessage.cosmo_selected ? 'auto' : (lastAssistantMessage.model || 'auto');
        onModelSync(modelToSync);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chat history.',
      });
    } finally {
      setIsLoadingExistingChat(false);
    }
  }, [chatsTable, messagesTable, toast, context.type, onModelSync, navigate, resetMessages, setMessages, setIsLoadingExistingChat]);

  const sendMessage = useCallback(async (content: string, model: string, personaId?: string, files?: File[]) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'Please sign in to send messages.',
      });
      return;
    }

    // PHASE 1: OPTIMISTIC UI
    isAddingMessageRef.current = true;
    const userMessage: Message = { role: 'user', content };
    addUserMessage(content);

    try {
      let chatId = currentChatId;
      
      // Create new chat if needed
      if (!chatId) {
        const { data, error: chatError } = await supabase.functions.invoke('chat-messages', {
          body: context.type === 'personal' 
            ? {
                action: 'create_chat',
                title: content.slice(0, 50),
                model,
                persona_id: personaId || null,
              }
            : {
                action: 'create_space_chat',
                space_id: context.workspaceId,
                title: content.slice(0, 50),
                model,
                persona_id: personaId || null,
              },
        });

        if (chatError) throw chatError;
        chatId = data.data.id;
        setCurrentChatId(chatId);
        
        if (context.type === 'personal') {
          pendingNavigationRef.current = chatId;
        }
        
        onChatCreated?.(chatId);
        queryClient.invalidateQueries({ queryKey });
        
        // Log activity (non-blocking)
        logActivity({
          appSection: context.type === 'personal' ? 'main_chat' : 'workspace',
          actorId: user.id,
          action: 'created',
          resourceType: 'chat',
          resourceId: chatId,
          resourceName: content.slice(0, 50),
          workspaceId: context.type === 'workspace' ? context.workspaceId : undefined,
        }).catch(err => console.error('Activity log failed:', err));
      }

      // Queue user message save (NON-BLOCKING)
      const messageData: any = {
        chat_id: chatId,
        role: 'user',
        content,
      };
      if (context.type === 'workspace') {
        messageData.user_id = user.id;
      }
      queueSave(messagesTable, messageData);

      // API call with streaming
      const result = await streamChatResponse(
        [...messages, userMessage],
        model,
        chatId,
        personaId,
        updateStreamingMessage,
      );

      if (result) {
        addAssistantMessage({
          role: 'assistant',
          content: result.content,
          model: result.actualModelUsed,
          cosmo_selected: result.cosmoSelected,
          detected_category: result.detectedCategory,
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateStreamingMessage(null);
      chatEvents.emit('error', {
        phase: 'api-call',
        error: error as Error,
        recoverable: true,
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsLoading(false);
      isAddingMessageRef.current = false;
      
      if (pendingNavigationRef.current && !preventNavigation) {
        navigate(`/chat?id=${pendingNavigationRef.current}`, { replace: true });
        pendingNavigationRef.current = null;
      }
    }
  }, [messages, currentChatId, user, toast, navigate, queryClient, context, chatsTable, messagesTable, queryKey, config, onChatCreated, addUserMessage, addAssistantMessage, updateStreamingMessage, streamChatResponse, setIsLoading]);

  const sendImageMessage = useCallback(async (
    prompt: string,
    generateImageFn: (prompt: string, selectedModel?: string) => Promise<{ url: string; model?: string; cosmoSelected?: boolean; detectedCategory?: string } | undefined>,
    selectedModel?: string
  ) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'Please sign in to generate images.',
      });
      return;
    }

    // PHASE 1: OPTIMISTIC UI
    addUserMessage(prompt);
    isAddingMessageRef.current = true;

    try {
      let chatId = currentChatId;
      let isNewChat = false;
      
      if (!chatId) {
        const { data, error: chatError } = await supabase.functions.invoke('chat-messages', {
          body: context.type === 'personal'
            ? {
                action: 'create_chat',
                title: prompt.slice(0, 50),
                model: 'image-generation',
              }
            : {
                action: 'create_space_chat',
                space_id: context.workspaceId,
                title: prompt.slice(0, 50),
                model: 'image-generation',
              },
        });

        if (chatError) throw chatError;
        chatId = data.data.id;
        isNewChat = true;
        setCurrentChatId(chatId);
      }

      // Queue user message save (NON-BLOCKING)
      const messageData: any = {
        chat_id: chatId,
        role: 'user',
        content: prompt,
      };
      if (context.type === 'workspace') {
        messageData.user_id = user.id;
      }
      queueSave(messagesTable, messageData);

      // Generate image
      const result = await generateImageFn(prompt, selectedModel);
      
      if (!result?.url) {
        throw new Error('Image generation failed');
      }

      const cosmoSelected = result?.cosmoSelected || false;
      const detectedCategory = result?.detectedCategory || 'image_generation';
      const actualModel = result?.model || 'image-generation';

      addAssistantMessage({
        role: 'assistant',
        content: prompt,
        type: 'image',
        imageUrl: result.url,
        model: actualModel,
        cosmo_selected: cosmoSelected,
        detected_category: detectedCategory,
        isSavedToMedia: false,
      });

      // Queue image message save (NON-BLOCKING)
      queueSave(messagesTable, {
        chat_id: chatId,
        role: 'assistant',
        content: `[IMAGE:${result.url}]\n${prompt}`,
        model: actualModel,
        cosmo_selected: cosmoSelected,
        detected_category: detectedCategory,
      });

      if (isNewChat) {
        if (context.type === 'personal') {
          navigate(`/chat?id=${chatId}`, { replace: true });
        }
        onChatCreated?.(chatId);
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast({ variant: 'destructive', title: 'Rate Limit Exceeded', description: 'Please wait a moment before generating another image.' });
      } else if (error.message?.includes('Payment required') || error.message?.includes('402')) {
        toast({ variant: 'destructive', title: 'Credits Required', description: 'Please add credits to continue.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate image. Please try again.' });
      }
      rollbackLastMessage();
    } finally {
      setIsLoading(false);
      isAddingMessageRef.current = false;
    }
  }, [user, currentChatId, navigate, queryClient, toast, context, chatsTable, messagesTable, queryKey, onChatCreated, addUserMessage, addAssistantMessage, rollbackLastMessage, setIsLoading]);

  const resetChat = useCallback(() => {
    resetMessages();
    setCurrentChatId(null);
    if (context.type === 'personal') {
      navigate('/chat', { replace: true });
    }
  }, [navigate, context, resetMessages]);

  return {
    messages,
    streamingMessage,
    isLoading,
    isLoadingExistingChat,
    hasExistingChat: !!activeChatId,
    currentChatId,
    sendMessage,
    sendImageMessage,
    resetChat,
    context,
    actionBox,
  };
}
