import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cosmo2 } from '@/cosmo2/client';
import { useSpace } from './useSpace';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import type { UIMessage } from '@/presentation/types';

type Message = UIMessage;

// Helper to invoke chat-messages edge function
async function invokeChatMessages(action: string, params: Record<string, any>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase.functions.invoke('chat-messages', {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

export function useChat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlChatId = searchParams.get('id');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExistingChat, setIsLoadingExistingChat] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { isSpaceReady } = useSpace();
  const { toast } = useToast();
  const { user } = useAuth();

  // Ref flag to prevent race condition during active operations
  const isAddingMessageRef = useRef(false);

  // Load existing chat when URL has chat ID
  useEffect(() => {
    // Skip loading if we're in the middle of adding a message
    if (isAddingMessageRef.current) return;

    if (urlChatId) {
      loadExistingChat(urlChatId);
    } else {
      // New chat - reset state
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [urlChatId]);

  const loadExistingChat = useCallback(async (chatId: string) => {
    setIsLoadingExistingChat(true);
    try {
      const result = await invokeChatMessages('get_messages', { chat_id: chatId });
      const data = result?.data || [];

      const loadedMessages: Message[] = data.map((msg: any) => {
        // Check if this is an image message with [IMAGE:url] marker
        if (msg.content.startsWith('[IMAGE:')) {
          const urlEnd = msg.content.indexOf(']');
          const imageUrl = msg.content.slice(7, urlEnd);
          const prompt = msg.content.slice(urlEnd + 2); // Skip ]\n

          // Detect if this image was saved to user's media library (user-files bucket only)
          const isSavedToMedia = imageUrl.includes('/user-files/');

          return {
            role: msg.role as 'user' | 'assistant',
            content: prompt,
            type: 'image' as const,
            imageUrl,
            model: msg.model || undefined,
            messageId: msg.id,
            isSavedToMedia,
          };
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          model: msg.model || undefined,
          messageId: msg.id,
        };
      });

      setMessages(loadedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Failed to load chat:', error);
      // Don't show toast on initial load - just log the error
    } finally {
      setIsLoadingExistingChat(false);
    }
  }, []);

  /* 
   * NEW Implementation: Cosmo 2.0 API Client
   * Legacy logic removed. History management delegated to client/API.
   */
  const sendMessage = useCallback(async (content: string, model: string, personaId?: string, files?: File[]) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in.' });
      return;
    }

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let conversationId = currentChatId || undefined;
      let assistantContent = '';

      // Prepare request
      const requestPayload = {
        input: content,
        userId: user.id,
        context: {
          conversationId,
          personaId,
          // Handle files as attachments if needed, converting to AttachmentRef
        },
        preferences: {
          forceModelId: model
        }
      };

      const stream = cosmo2.executeStream(requestPayload);

      for await (const chunk of stream) {
        try {
          const parsed = JSON.parse(chunk);
          // Assuming standard chunk format: { choices: [{ delta: { content: "..." } }] }
          // OR Cosmo V2 format: { result: { output: "..." } } or { delta: "..." }
          // Adjusting to common OpenAI-like delta for now, or check types.
          // The chunk yielded by client is raw data string.

          // If it's OpenAI compatible:
          const delta = parsed.choices?.[0]?.delta?.content || parsed.delta || parsed.content || '';

          // If conversationId is returned in first chunk, capture it
          if (parsed.conversationId && !conversationId) {
            conversationId = parsed.conversationId;
            setCurrentChatId(conversationId);
            // Update URL silently
            window.history.replaceState(null, '', `/chat?id=${conversationId}`);
          }

          if (delta) {
            assistantContent += delta;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, content: assistantContent, model }];
              }
              return [...prev, { role: 'assistant', content: assistantContent, model }];
            });
          }
        } catch (e) {
          console.warn("Error parsing stream chunk", e);
        }
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send message.' });
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentChatId, user, toast]);

  // Stub loadExistingChat as V2 doesn't have history API in this context yet
  const loadExistingChat = useCallback(async (chatId: string) => {
    // TODO: Implement cosmo2.getConversation(chatId) when available
    console.warn("History loading not implemented for Cosmo 2.0 yet");
    setCurrentChatId(chatId);
  }, []);

  // New sendImageMessage - shows user message IMMEDIATELY, then generates image
  const sendImageMessage = useCallback(async (
    prompt: string,
    generateImageFn: (prompt: string, selectedModel?: string) => Promise<{ url: string } | undefined>,
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

    // 1. IMMEDIATELY add user message (switches view from welcome to chat)
    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true); // Shows loading indicator right away

    // Set flag to prevent useEffect race condition
    isAddingMessageRef.current = true;

    try {
      // 2. Create chat if needed
      let chatId = currentChatId;
      let isNewChat = false;

      if (!chatId) {
        const result = await invokeChatMessages('create_chat', {
          title: prompt.slice(0, 50),
          model: 'image-generation',
        });

        if (!result?.data) throw new Error('Failed to create chat');
        chatId = result.data.id;
        isNewChat = true;
        setCurrentChatId(chatId);
      }

      // Save user message to DB via edge function
      await invokeChatMessages('add_message', {
        chat_id: chatId,
        role: 'user',
        content: prompt,
      });

      // 3. Generate image (loading indicator already visible)
      const result = await generateImageFn(prompt, selectedModel);

      if (!result?.url) {
        throw new Error('Image generation failed');
      }

      // 4. Add image response to state
      const imageMessage: Message = {
        role: 'assistant',
        content: prompt,
        type: 'image',
        imageUrl: result.url,
        model: 'image-generation',
      };
      setMessages(prev => [...prev, imageMessage]);

      // 5. Save image message to DB and get the ID via edge function
      const saveResult = await invokeChatMessages('add_message', {
        chat_id: chatId,
        role: 'assistant',
        content: `[IMAGE:${result.url}]\n${prompt}`,
        model: 'image-generation',
      });

      // 6. Update local state with messageId for Save to Media functionality
      if (saveResult?.data?.id) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].type === 'image') {
            updated[lastIndex] = { ...updated[lastIndex], messageId: saveResult.data.id };
          }
          return updated;
        });
      }

      // 7. Update URL if new chat
      if (isNewChat) {
        navigate(`/chat?id=${chatId}`, { replace: true });
        queryClient.invalidateQueries({ queryKey: ['user-chats'] });
      }
    } catch (error: any) {
      console.error('Image generation error:', error);

      // Show appropriate error message
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast({
          variant: 'destructive',
          title: 'Rate Limit Exceeded',
          description: 'Please wait a moment before generating another image.',
        });
      } else if (error.message?.includes('Payment required') || error.message?.includes('402')) {
        toast({
          variant: 'destructive',
          title: 'Credits Required',
          description: 'Please add credits to your workspace to continue.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to generate image. Please try again.',
        });
      }
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      isAddingMessageRef.current = false;
    }
  }, [user, currentChatId, navigate, queryClient, toast]);

  // Keep addImageMessage for backward compatibility (when image URL is already known)
  const addImageMessage = useCallback(async (prompt: string, imageUrl: string) => {
    if (!user) return;

    isAddingMessageRef.current = true;

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);

    try {
      let chatId = currentChatId;
      let isNewChat = false;

      if (!chatId) {
        const result = await invokeChatMessages('create_chat', {
          title: prompt.slice(0, 50),
          model: 'image-generation',
        });

        if (!result?.data) throw new Error('Failed to create chat');
        chatId = result.data.id;
        isNewChat = true;
      }

      await invokeChatMessages('add_message', {
        chat_id: chatId,
        role: 'user',
        content: prompt,
      });

      const imageMessage: Message = {
        role: 'assistant',
        content: prompt,
        type: 'image',
        imageUrl,
        model: 'image-generation',
      };
      setMessages(prev => [...prev, imageMessage]);

      const saveResult = await invokeChatMessages('add_message', {
        chat_id: chatId,
        role: 'assistant',
        content: `[IMAGE:${imageUrl}]\n${prompt}`,
        model: 'image-generation',
      });

      // Update local state with messageId for Save to Media functionality
      if (saveResult?.data?.id) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].type === 'image') {
            updated[lastIndex] = { ...updated[lastIndex], messageId: saveResult.data.id };
          }
          return updated;
        });
      }

      if (isNewChat) {
        setCurrentChatId(chatId);
        navigate(`/chat?id=${chatId}`, { replace: true });
        queryClient.invalidateQueries({ queryKey: ['user-chats'] });
      }
    } catch (error) {
      console.error('Failed to save image message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save image to chat history.',
      });
    } finally {
      isAddingMessageRef.current = false;
    }
  }, [user, currentChatId, navigate, queryClient, toast]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    navigate('/chat', { replace: true });
  }, [navigate]);

  return {
    messages,
    isLoading,
    isLoadingExistingChat,
    hasExistingChat: !!urlChatId,
    isReady: isSpaceReady,
    sendMessage,
    sendImageMessage,
    addImageMessage,
    resetChat,
  };
}
