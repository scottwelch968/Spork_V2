import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { chatEvents } from './useChatEvents';
import { queueSave } from './useChatPersistence';
import { useModelActionBox } from './useModelActionBox';
import { getModelDisplayName } from '@/utils/modelDisplayName';
import type { UIMessage as Message, ChatContext, ChatConfig } from '@/presentation/types';

interface UseChatAPIOptions {
  context: ChatContext;
  messagesTable: string;
  config?: ChatConfig;
}

interface StreamResult {
  content: string;
  actualModelUsed: string;
  cosmoSelected: boolean;
  detectedCategory: string;
}

export function useChatAPI({ context, messagesTable, config }: UseChatAPIOptions) {
  const { toast } = useToast();
  const actionBox = useModelActionBox();

  const streamChatResponse = useCallback(async (
    allMessages: Message[],
    model: string,
    chatId: string,
    personaId?: string,
    onStreamUpdate?: (message: Message) => void,
  ): Promise<StreamResult | null> => {
    const isAutoModel = model === 'auto';
    const modelDisplayName = getModelDisplayName(model, isAutoModel ? 'Cosmo Ai' : model);
    actionBox.reset();
    actionBox.start(model, modelDisplayName, isAutoModel);

    const requestBody: any = {
      messages: allMessages,
      model,
      chatId,
      personaId,
    };

    if (context.type === 'workspace') {
      requestBody.workspaceId = context.workspaceId;
      requestBody.spaceContext = {
        aiInstructions: config?.aiInstructions,
        complianceRule: config?.complianceRule,
      };
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jbefxpxvnwpgqonjaznr.supabase.co';
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZWZ4cHh2bndwZ3Fvbmphem5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTk1MzAsImV4cCI6MjA4MDA5NTUzMH0.UH2yW-Q0jsBBv73fdO3ZBalsBdf2jxi7wafIF1wTk58';
    const CHAT_URL = `${SUPABASE_URL}/functions/v1/chat`;
    
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    if (!accessToken) {
      toast({
        variant: 'destructive',
        title: 'Session expired',
        description: 'Please sign in again.',
      });
      return null;
    }
    
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 429) {
      toast({ variant: 'destructive', title: 'Rate limit exceeded', description: 'Please try again later.' });
      return null;
    }

    if (response.status === 402) {
      toast({ variant: 'destructive', title: 'Payment required', description: 'Please add funds to continue using AI features.' });
      return null;
    }

    if (!response.ok || !response.body) {
      throw new Error('Failed to start stream');
    }

    chatEvents.emit('stream-started', { model, isAuto: isAutoModel, chatId });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';
    let actualModelUsed = model;
    let cosmoSelected = model === 'auto';
    let detectedCategory = '';

    // Initial streaming message
    onStreamUpdate?.({
      role: 'assistant',
      content: '',
      model: model,
      cosmo_selected: cosmoSelected,
      detected_category: '',
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.type === 'metadata') {
            if (parsed.actualModelUsed) actualModelUsed = parsed.actualModelUsed;
            if (typeof parsed.cosmoSelected === 'boolean') cosmoSelected = parsed.cosmoSelected;
            if (parsed.detectedCategory) detectedCategory = parsed.detectedCategory;
            
            actionBox.setModelSelected(actualModelUsed, parsed.actualModelName || actualModelUsed, detectedCategory);
            
            chatEvents.emit('metadata-received', {
              actualModelUsed,
              actualModelName: parsed.actualModelName,
              cosmoSelected,
              detectedCategory,
            });
            
            onStreamUpdate?.({
              role: 'assistant',
              content: assistantContent,
              model: actualModelUsed,
              cosmo_selected: cosmoSelected,
              detected_category: detectedCategory,
            });
            continue;
          }
          
          const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (chunk) {
            assistantContent += chunk;
            
            chatEvents.emit('stream-chunk', {
              content: chunk,
              fullContent: assistantContent,
              model: actualModelUsed,
            });
            
            onStreamUpdate?.({
              role: 'assistant',
              content: assistantContent,
              model: actualModelUsed,
              cosmo_selected: cosmoSelected,
              detected_category: detectedCategory,
            });
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE chunk:', jsonStr, parseError);
          continue;
        }
      }
    }
    
    // Process remaining buffer for metadata
    if (textBuffer.trim()) {
      const lines = textBuffer.split('\n');
      for (const rawLine of lines) {
        let line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'metadata') {
            if (parsed.actualModelUsed) actualModelUsed = parsed.actualModelUsed;
            if (parsed.cosmoSelected) cosmoSelected = true;
            if (parsed.detectedCategory) detectedCategory = parsed.detectedCategory;
          }
        } catch {
          // Ignore
        }
      }
    }

    actionBox.close();

    if (assistantContent.trim()) {
      // Queue save
      queueSave(messagesTable, {
        chat_id: chatId,
        role: 'assistant',
        content: assistantContent,
        model: actualModelUsed,
        cosmo_selected: cosmoSelected,
        detected_category: detectedCategory || null,
      });

      chatEvents.emit('response-complete', {
        model: actualModelUsed,
        content: assistantContent,
        cosmoSelected,
        detectedCategory,
      });

      return {
        content: assistantContent,
        actualModelUsed,
        cosmoSelected,
        detectedCategory,
      };
    }

    return null;
  }, [context, config, messagesTable, toast, actionBox]);

  return {
    streamChatResponse,
    actionBox,
  };
}
