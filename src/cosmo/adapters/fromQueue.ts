/**
 * Queue Adapter
 * 
 * Converts queued request items into NormalizedRequest.
 */

import { normalizeRequest } from '../normalizer';
import type { 
  NormalizedRequest, 
  CosmoRequestType, 
  CosmoPriority,
  CosmoMessage,
} from '../contracts';

export interface QueueItemInput {
  id: string;
  requestPayload: {
    content?: string;
    messages?: CosmoMessage[];
    chatId?: string;
    workspaceId?: string;
    personaId?: string;
    requestedModel?: string;
    userId?: string;
    authToken?: string;
  };
  requestType?: string;
  priority?: string;
  userId: string;
  workspaceId: string;
  callbackUrl?: string;
  batchId?: string;
}

/**
 * Convert queue item to NormalizedRequest
 */
export function fromQueue(input: QueueItemInput): NormalizedRequest {
  const payload = input.requestPayload;
  
  return normalizeRequest(
    {
      content: payload.content || '',
      messages: payload.messages || [],
      chatId: payload.chatId,
      workspaceId: input.workspaceId || payload.workspaceId,
      personaId: payload.personaId,
      requestedModel: payload.requestedModel,
      userId: input.userId || payload.userId,
      authToken: payload.authToken,
      callbackUrl: input.callbackUrl,
      requestType: (input.requestType as CosmoRequestType) || 'chat',
      source: {
        type: 'system',
        id: input.id,
        metadata: {
          batchId: input.batchId,
          queueId: input.id,
        },
      },
      responseMode: 'batch',
      priority: (input.priority as CosmoPriority) || 'normal',
    },
    {
      requestId: input.id, // Preserve queue item ID as request ID
    }
  );
}
