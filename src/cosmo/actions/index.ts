/**
 * COSMO Action Layer
 * 
 * Barrel export for all action types and interfaces.
 * The Action Layer is COSMO's communication protocol to output layers.
 * 
 * @see docs/governance/amendments/001-ACTION-LAYER-ARCHITECTURE.md
 */

// Code change action type
export type { CodeChange } from './types';

// Core action types
export type {
  ActionTarget,
  ActionPriority,
  ActionContext,
  CosmoAction,
  AllActionTypes,
} from './types';

// Layer-specific action types
export type {
  PresentationActionType,
  DatabaseActionType,
  SystemActionType,
  ExternalActionType,
} from './types';

// Typed action interfaces
export type {
  PresentationAction,
  DatabaseAction,
  SystemAction,
  ExternalAction,
} from './types';

// Common payload types
export type {
  DisplayMessagePayload,
  DisplayChunkPayload,
  DisplayErrorPayload,
  DisplayToastPayload,
  PersistMessagePayload,
  ExecuteFunctionPayload,
  RouteModelPayload,
  CallApiPayload,
} from './types';

// Action result type
export type { ActionResult } from './types';
