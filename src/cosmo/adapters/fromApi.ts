/**
 * API Adapter
 * 
 * Converts direct API calls into NormalizedRequest.
 */

import { normalizeRequest } from '../normalizer';
import type { 
  NormalizedRequest, 
  CosmoMessage,
  CosmoResponseMode,
  CosmoPriority,
} from '../contracts';

export interface ApiInput {
  content: string;
  messages?: CosmoMessage[];
  model?: string;
  chatId?: string;
  workspaceId?: string;
  personaId?: string;
  userId?: string;
  authToken?: string;
  responseMode?: CosmoResponseMode;
  priority?: CosmoPriority;
  callbackUrl?: string;
  apiKey?: string;
  clientId?: string;
}

/**
 * Convert API call to NormalizedRequest
 */
export function fromApi(input: ApiInput): NormalizedRequest {
  return normalizeRequest(
    {
      content: input.content,
      messages: input.messages || [],
      requestedModel: input.model,
      chatId: input.chatId,
      workspaceId: input.workspaceId,
      personaId: input.personaId,
      userId: input.userId,
      authToken: input.authToken,
      callbackUrl: input.callbackUrl,
      requestType: 'api_call',
      source: {
        type: 'api',
        id: input.clientId,
        metadata: {
          apiKey: input.apiKey ? '[REDACTED]' : undefined,
        },
      },
      responseMode: input.responseMode || 'batch',
      priority: input.priority || 'normal',
    }
  );
}
