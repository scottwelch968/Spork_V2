/**
 * COSMO BRIDGE
 * 
 * Converts between system types, presentation types, and canonical COSMO contracts.
 * This is the boundary layer for type translation.
 */

import { normalizeRequest } from './normalizer';
import type { 
  NormalizedRequest, 
  CosmoRequestSource,
  CosmoResponseMode,
  ModelSelection,
  ExecutionResult,
} from './contracts';
import type {
  DataRequest,
  ModelSelectionUI,
  ResponseComplete,
  ActorType,
} from '@/cosmo/types/system';

/**
 * Map actor type to COSMO source type
 */
function mapActorTypeToSource(actorType: ActorType): CosmoRequestSource['type'] {
  switch (actorType) {
    case 'user':
    case 'editor':
      return 'user';
    case 'agent':
      return 'agent';
    case 'system':
      return 'system';
    case 'webhook':
      return 'webhook';
    case 'api':
      return 'api';
    default:
      return 'user';
  }
}

/**
 * Map display mode to COSMO response mode
 */
function mapDisplayModeToResponseMode(displayMode: string): CosmoResponseMode {
  switch (displayMode) {
    case 'ui':
      return 'stream';
    case 'minimal':
      return 'batch';
    case 'silent':
      return 'silent';
    default:
      return 'stream';
  }
}

/**
 * Convert UI DataRequest to NormalizedRequest
 */
export function uiToNormalized(uiRequest: DataRequest): NormalizedRequest {
  return normalizeRequest(
    {
      content: uiRequest.content,
      messages: [],
      chatId: uiRequest.context.chatId,
      workspaceId: uiRequest.context.workspaceId,
      personaId: uiRequest.context.personaId,
      requestedModel: uiRequest.model,
      userId: uiRequest.actor.id,
      requestType: 'chat',
      source: {
        type: mapActorTypeToSource(uiRequest.actor.type),
        id: uiRequest.actor.id,
        metadata: uiRequest.actor.metadata,
      },
      responseMode: mapDisplayModeToResponseMode(uiRequest.context.displayMode),
      priority: 'normal',
    },
    {
      requestId: uiRequest.requestId,
      normalizedAt: new Date(uiRequest.timestamp).toISOString(),
    }
  );
}

/**
 * Convert UI ModelSelection to canonical ModelSelection
 */
export function uiModelSelectionToCanonical(ui: ModelSelectionUI): ModelSelection {
  return {
    selectedModel: ui.selectedModel,
    selectedModelName: ui.selectedModelName,
    cosmoSelected: ui.cosmoSelected,
    detectedCategory: ui.detectedCategory,
    costTier: null,
    reason: ui.reason || '',
  };
}

/**
 * Convert canonical ExecutionResult to UI ResponseComplete
 */
export function executionResultToUI(
  result: ExecutionResult,
  requestId: string
): ResponseComplete {
  return {
    requestId,
    content: result.content || '',
    model: result.actualModelUsed,
    modelName: result.actualModelUsed,
    cosmoSelected: result.cosmoSelected,
    detectedCategory: result.detectedCategory || undefined,
    messageId: undefined,
    tokensUsed: result.tokens?.total,
  };
}

/**
 * Convert canonical ModelSelection to UI ModelSelection
 */
export function modelSelectionToUI(
  canonical: ModelSelection,
  requestId: string
): ModelSelectionUI {
  return {
    requestId,
    selectedModel: canonical.selectedModel,
    selectedModelName: canonical.selectedModelName,
    cosmoSelected: canonical.cosmoSelected,
    detectedCategory: canonical.detectedCategory,
    reason: canonical.reason,
  };
}
