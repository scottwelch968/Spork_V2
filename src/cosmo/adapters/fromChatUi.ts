/**
 * Chat UI Adapter
 * 
 * Converts UI chat requests into NormalizedRequest.
 * This adapter is used by useChatFunctions and useChatUnified hooks.
 */

import { normalizeRequest } from '../normalizer';
import type { NormalizedRequest, CosmoMessage } from '../contracts';

export interface ChatUiInput {
  content: string;
  userId: string;
  authToken?: string;
  model?: string;
  chatId?: string;
  workspaceId?: string;
  personaId?: string;
  messages?: CosmoMessage[];
  spaceContext?: {
    aiInstructions?: string;
    complianceRule?: string;
  };
}

/**
 * Convert UI chat request to NormalizedRequest
 */
export function fromChatUi(input: ChatUiInput): NormalizedRequest {
  return normalizeRequest(
    {
      content: input.content,
      messages: input.messages || [],
      userId: input.userId,
      authToken: input.authToken,
      requestedModel: input.model,
      chatId: input.chatId,
      workspaceId: input.workspaceId,
      personaId: input.personaId,
      spaceContext: input.spaceContext,
      requestType: 'chat',
      source: {
        type: 'user',
        id: input.userId,
      },
      responseMode: 'stream',
      priority: 'normal',
    }
  );
}
