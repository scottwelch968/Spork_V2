import { useState, useCallback } from 'react';
import { cosmo2 } from '@/cosmo2/client';
import type { SporkEditorMessage } from '@/presentation/types';
import type { CodeChange } from '@/cosmo/actions';

export type { CodeChange };
export type ChatMessage = SporkEditorMessage;

interface UseSporkEditorChatProps {
  modelId: string;
  activeFile: string | null;
  activeFileContent: string;
}

export function useSporkEditorChat({
  modelId,
  activeFile,
  activeFileContent
}: UseSporkEditorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Build V2 Request
      const requestPayload = {
        input: content,
        context: {
          attachments: activeFile ? [{
            id: activeFile,
            type: 'document',
            name: activeFile,
            content: activeFileContent // Need to check if content is supported in AttachmentRef or if we put it in context string
          } as any] : [], // Temporary cast as AttachmentRef type in client.ts assumes ref, not inline content usually. 
          // Alternatively, put file context in the prompt for now as before.
        }
      };

      // If AttachmentRef doesn't support content, strict context string is safer:
      const promptWithContext = activeFile && activeFileContent
        ? `Current file: ${activeFile}\n\n\`\`\`\n${activeFileContent}\n\`\`\`\n\nTask: ${content}`
        : content;

      const response = await cosmo2.execute({
        input: promptWithContext,
        // userId? editor might handle auth internally or we get it from useAuth if needed, but here we just execute.
      });

      // Parse response - expecting either plain text or structured code changes
      let assistantMessage: ChatMessage;

      // Check for structured output in result
      const structured = response.result?.structured as any;

      if (structured?.changes && Array.isArray(structured.changes)) {
        // Structured response with code changes
        assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: structured.explanation || response.result?.output || 'Here are the suggestions:',
          timestamp: new Date(),
          codeChanges: structured.changes,
          explanation: structured.explanation
        };
      } else {
        // Plain text response
        assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.result?.output || 'No response',
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, modelId, activeFile, activeFileContent]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages
  };
}
