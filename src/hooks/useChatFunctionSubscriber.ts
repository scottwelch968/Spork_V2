/**
 * Chat Function Subscriber Hook
 * 
 * React hook for subscribing to chat function events.
 * Provides reactive state updates for UI components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatEventBus } from '@/lib/chatFunctions/eventBus';
import type {
  ChatFunctionEvent,
  DataRequest,
  ModelSelectionUI as ModelSelection,
  ResponseChunk,
  ResponseComplete,
  ActionsResult,
  FunctionError,
  ChatFunctionEventPayloads,
} from '@/cosmo/types/system';

export interface ChatFunctionState {
  // Request state
  currentRequest: DataRequest | null;
  isSubmitting: boolean;
  
  // Model state
  modelSelection: ModelSelection | null;
  isSelectingModel: boolean;
  isModelReady: boolean;
  
  // Response state
  isStreaming: boolean;
  streamingContent: string;
  response: ResponseComplete | null;
  
  // Actions state
  actions: ActionsResult | null;
  
  // Error state
  error: FunctionError | null;
}

const initialState: ChatFunctionState = {
  currentRequest: null,
  isSubmitting: false,
  modelSelection: null,
  isSelectingModel: false,
  isModelReady: false,
  isStreaming: false,
  streamingContent: '',
  response: null,
  actions: null,
  error: null,
};

/**
 * Subscribe to chat function events for a specific request
 */
export function useChatFunctionSubscriber(requestId?: string) {
  const [state, setState] = useState<ChatFunctionState>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Reset state for new request
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Request events
    unsubscribes.push(
      chatEventBus.subscribe('request:submitted', (payload) => {
        const p = payload as DataRequest;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          currentRequest: p,
          isSubmitting: true,
          error: null,
        }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('request:validated', (payload) => {
        const p = payload as { requestId: string };
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({ ...prev, isSubmitting: false }));
      }, requestId)
    );

    // Model events
    unsubscribes.push(
      chatEventBus.subscribe('model:selecting', (payload) => {
        const p = payload as { requestId: string };
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({ ...prev, isSelectingModel: true }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('model:selected', (payload) => {
        const p = payload as ModelSelection;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          modelSelection: p,
          isSelectingModel: false,
        }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('model:ready', (payload) => {
        const p = payload as { requestId: string };
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({ ...prev, isModelReady: true }));
      }, requestId)
    );

    // Response events
    unsubscribes.push(
      chatEventBus.subscribe('response:started', (payload) => {
        const p = payload as { requestId: string };
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          isStreaming: true,
          streamingContent: '',
        }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:chunk', (payload) => {
        const p = payload as ResponseChunk;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          streamingContent: p.fullContent,
        }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:metadata', (payload) => {
        const p = payload as ModelSelection;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          modelSelection: p,
        }));
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:complete', (payload) => {
        const p = payload as ResponseComplete;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          isStreaming: false,
          response: p,
          streamingContent: '',
        }));
      }, requestId)
    );

    // Actions events
    unsubscribes.push(
      chatEventBus.subscribe('actions:determined', (payload) => {
        const p = payload as ActionsResult;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({ ...prev, actions: p }));
      }, requestId)
    );

    // Error events
    unsubscribes.push(
      chatEventBus.subscribe('error:occurred', (payload) => {
        const p = payload as FunctionError;
        if (requestId && p.requestId !== requestId) return;
        setState(prev => ({
          ...prev,
          error: p,
          isSubmitting: false,
          isSelectingModel: false,
          isStreaming: false,
        }));
      }, requestId)
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [requestId]);

  return {
    ...state,
    reset,
  };
}

/**
 * Subscribe to specific event types only
 */
export function useChatEventListener<T extends ChatFunctionEvent>(
  event: T,
  callback: (payload: ChatFunctionEventPayloads[T]) => void,
  requestId?: string
) {
  useEffect(() => {
    const unsubscribe = chatEventBus.subscribe(event, callback, requestId);
    return unsubscribe;
  }, [event, callback, requestId]);
}

/**
 * Get current streaming state
 */
export function useStreamingState(requestId?: string) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      chatEventBus.subscribe('response:started', () => {
        setIsStreaming(true);
        setContent('');
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:chunk', (payload) => {
        const p = payload as ResponseChunk;
        setContent(p.fullContent);
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:complete', () => {
        setIsStreaming(false);
      }, requestId)
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [requestId]);

  return { isStreaming, content };
}

/**
 * Get model selection state
 */
export function useModelSelectionState(requestId?: string) {
  const [selection, setSelection] = useState<ModelSelection | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    unsubscribes.push(
      chatEventBus.subscribe('model:selected', (payload) => {
        setSelection(payload as ModelSelection);
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('model:ready', () => {
        setIsReady(true);
      }, requestId)
    );

    unsubscribes.push(
      chatEventBus.subscribe('response:metadata', (payload) => {
        setSelection(payload as ModelSelection);
      }, requestId)
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [requestId]);

  return { selection, isReady };
}
