/**
 * Presentation Layer - Editor Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

import type { CodeChange } from '@/cosmo/actions';

/**
 * SporkEditorMessage - Chat message display for Spork Editor
 * Includes editor-specific fields like codeChanges and explanation
 */
export interface SporkEditorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeChanges?: CodeChange[];
  explanation?: string;
}
