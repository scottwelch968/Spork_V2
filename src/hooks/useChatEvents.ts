/**
 * Chat Event System
 * 
 * Provides a typed event emitter for chat message lifecycle events.
 * Used for debugging and potential future analytics/hooks.
 */

type ChatEventType = 
  | 'stream-started'
  | 'stream-chunk'
  | 'metadata-received'
  | 'response-complete'
  | 'error';

interface StreamStartedPayload {
  model: string;
  isAuto: boolean;
  chatId: string | null;
}

interface StreamChunkPayload {
  content: string;
  fullContent: string;
  model: string;
}

interface MetadataReceivedPayload {
  actualModelUsed: string;
  actualModelName?: string;
  cosmoSelected: boolean;
  detectedCategory: string;
}

interface ResponseCompletePayload {
  messageId?: string;
  model: string;
  content: string;
  cosmoSelected: boolean;
  detectedCategory: string;
}

interface ErrorPayload {
  phase: string;
  error: Error;
  recoverable: boolean;
}

type ChatEventPayload = {
  'stream-started': StreamStartedPayload;
  'stream-chunk': StreamChunkPayload;
  'metadata-received': MetadataReceivedPayload;
  'response-complete': ResponseCompletePayload;
  'error': ErrorPayload;
};

type ChatEventListener<T extends ChatEventType> = (payload: ChatEventPayload[T]) => void;

class ChatEventEmitter {
  private listeners: Map<ChatEventType, Set<ChatEventListener<any>>> = new Map();
  private debugMode = false;

  constructor() {
    const eventTypes: ChatEventType[] = [
      'stream-started',
      'stream-chunk',
      'metadata-received',
      'response-complete',
      'error',
    ];
    eventTypes.forEach(type => this.listeners.set(type, new Set()));
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  on<T extends ChatEventType>(event: T, listener: ChatEventListener<T>): () => void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(listener);
    }
    return () => this.off(event, listener);
  }

  off<T extends ChatEventType>(event: T, listener: ChatEventListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit<T extends ChatEventType>(event: T, payload: ChatEventPayload[T]): void {
    if (this.debugMode) {
      console.log(`[ChatEvent] ${event}:`, payload);
    }
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`[ChatEvent] Error in ${event} listener:`, error);
        }
      });
    }
  }

  clear(): void {
    this.listeners.forEach(set => set.clear());
  }
}

export const chatEvents = new ChatEventEmitter();

// Enable debug mode in development
if (import.meta.env.DEV) {
  chatEvents.setDebugMode(true);
}

export type {
  ChatEventType,
  ChatEventPayload,
  StreamStartedPayload,
  StreamChunkPayload,
  MetadataReceivedPayload,
  ResponseCompletePayload,
  ErrorPayload,
};
