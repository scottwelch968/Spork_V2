/**
 * useChatFunctions Hook
 * 
 * Integration bridge between the function-first chat system and React UI.
 * Provides backward-compatible interface for UnifiedChatInterface while
 * using the new event-driven architecture internally.
 * 
 * NOTE: Uses legacy types for backward compatibility with existing UI.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatEventBus } from '@/lib/chatFunctions';
import { cosmo2 } from '@/cosmo2/client';
import type {
  ModelSelectionUI as ModelSelection,
  ResponseChunk,
  ResponseComplete,
} from '@/cosmo/types/system';

export interface UseChatFunctionsOptions {
  workspaceId?: string;
  chatId?: string;
  personaId?: string;
  onChunk?: (chunk: ResponseChunk) => void;
  onComplete?: (result: ResponseComplete) => void;
  onError?: (error: Error) => void;
  onModelSelected?: (selection: ModelSelection) => void;
}

export interface UseChatFunctionsResult {
  // State
  isLoading: boolean;
  isStreaming: boolean;
  currentRequestId: string | null;
  streamingContent: string;
  modelSelection: ModelSelection | null;
  error: Error | null;

  // Actions
  sendMessage: (content: string, model?: string) => Promise<ResponseComplete | null>;
  cancelRequest: () => void;
  clearError: () => void;
  reset: () => void;
}

export function useChatFunctions(options: UseChatFunctionsOptions = {}): UseChatFunctionsResult {
  const { user, session } = useAuth();
  const {
    workspaceId,
    chatId,
    personaId,
    onChunk,
    onComplete,
    onError,
    onModelSelected,
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [modelSelection, setModelSelection] = useState<ModelSelection | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for cleanup and cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Subscribe to events for current request
  useEffect(() => {
    if (!currentRequestId) return;

    const unsubChunk = chatEventBus.subscribe(
      'response:chunk',
      (payload) => {
        const chunk = payload as ResponseChunk;
        if (chunk.requestId !== currentRequestId) return;

        if (isMountedRef.current) {
          setStreamingContent(chunk.fullContent);
          setIsStreaming(true);
          onChunk?.(chunk);
        }
      },
      currentRequestId
    );

    const unsubComplete = chatEventBus.subscribe(
      'response:complete',
      (payload) => {
        const result = payload as ResponseComplete;
        if (result.requestId !== currentRequestId) return;

        if (isMountedRef.current) {
          setIsStreaming(false);
          setIsLoading(false);
          onComplete?.(result);
        }
      },
      currentRequestId
    );

    const unsubModel = chatEventBus.subscribe(
      'model:selected',
      (payload) => {
        const selection = payload as ModelSelection;
        if (selection.requestId !== currentRequestId) return;

        if (isMountedRef.current) {
          setModelSelection(selection);
          onModelSelected?.(selection);
        }
      },
      currentRequestId
    );

    const unsubMetadata = chatEventBus.subscribe(
      'response:metadata',
      (payload) => {
        const selection = payload as ModelSelection;
        if (selection.requestId !== currentRequestId) return;

        if (isMountedRef.current) {
          setModelSelection(selection);
          onModelSelected?.(selection);
        }
      },
      currentRequestId
    );

    const unsubError = chatEventBus.subscribe(
      'error:occurred',
      (payload) => {
        const err = payload as { requestId: string; message: string };
        if (err.requestId !== currentRequestId) return;

        if (isMountedRef.current) {
          const error = new Error(err.message);
          setError(error);
          setIsLoading(false);
          setIsStreaming(false);
          onError?.(error);
        }
      },
      currentRequestId
    );

    return () => {
      unsubChunk();
      unsubComplete();
      unsubModel();
      unsubMetadata();
      unsubError();
    };
  }, [currentRequestId, onChunk, onComplete, onError, onModelSelected]);

  /**
   * Send a message through the function-first pipeline
   */
  /*
   * NEW Implementation: Cosmo 2.0 API Client
   * Legacy logic removed. History management delegated to client/API.
   */
  const sendMessage = useCallback(async (
    content: string,
    model?: string
  ): Promise<ResponseComplete | null> => {
    if (!user) {
      const error = new Error('User not authenticated');
      setError(error);
      onError?.(error);
      return null;
    }

    // Reset state
    setError(null);
    setIsLoading(true);
    setStreamingContent('');
    setModelSelection(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Submit request to COSMO 2.0
      const requestPayload = {
        input: content,
        userId: user.id,
        context: {
          workspaceId,
          chatId,
          personaId,
        },
        preferences: {
          forceModelId: model
        }
      };

      const stream = cosmo2.executeStream(requestPayload);

      let fullContent = '';
      let requestId = `req_${Date.now()}`; // Temporary ID until we parse it from stream?

      // If we could get requestId early, we should set it. 
      // For now, set it to indicate active request.
      setCurrentRequestId(requestId);

      for await (const chunk of stream) {
        if (!isMountedRef.current) break;

        try {
          const parsed = JSON.parse(chunk);

          // Capture ID from first chunk if available
          if (parsed.requestId) {
            requestId = parsed.requestId;
            setCurrentRequestId(requestId);
          }

          // Handle content delta
          const delta = parsed.choices?.[0]?.delta?.content || parsed.delta || parsed.content || '';
          if (delta) {
            fullContent += delta;
            setStreamingContent(fullContent);
            setIsStreaming(true);

            // Emit legacy chunk format for compatibility
            onChunk?.({
              requestId,
              content: delta,
              fullContent,
              isComplete: false,
              model: model || 'cosmo-v2'
            } as any);
          }

          // Handle metadata (model selection)
          if (parsed.modelId || parsed.model) {
            const modelName = parsed.modelId || parsed.model;
            const selection = {
              requestId,
              model: modelName,
              provider: 'cosmo-v2', // derived?
              reason: 'Selected by Cosmo',
              confidence: 1
            } as any;
            setModelSelection(selection);
            onModelSelected?.(selection);
          }

        } catch (e) {
          console.warn("Error parsing chunk", e);
        }
      }

      const result: ResponseComplete = {
        requestId,
        content: fullContent,
        timestamp: Date.now(),
        metadata: {
          model: (modelSelection as any)?.model || 'cosmo-v2'
        }
      } as any;

      if (isMountedRef.current) {
        setIsLoading(false);
        setIsStreaming(false);
        onComplete?.(result);
      }

      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');

      if (isMountedRef.current) {
        setError(error);
        setIsLoading(false);
        setIsStreaming(false);
        onError?.(error);
      }

      return null;
    }
  }, [user, session, workspaceId, chatId, personaId, onError, onChunk, onComplete, onModelSelected]);

  /**
   * Cancel the current request
   */
  const cancelRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentRequestId(null);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentRequestId(null);
    setStreamingContent('');
    setModelSelection(null);
    setError(null);
  }, []);

  return {
    isLoading,
    isStreaming,
    currentRequestId,
    streamingContent,
    modelSelection,
    error,
    sendMessage,
    cancelRequest,
    clearError,
    reset,
  };
}

export default useChatFunctions;
