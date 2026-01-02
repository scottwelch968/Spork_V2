/**
 * Presentation Layer - Chat Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

/**
 * ChatContext - Context for routing chat display
 * Provides explicit type discrimination for personal vs workspace contexts
 */
export type ChatContext = 
  | { type: 'personal' }
  | { type: 'workspace'; workspaceId: string };

/**
 * UIMessage - Message type for chat display
 * Includes UI-only fields like imageUrl, isSavedToMedia, senderName
 */
export interface UIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image';
  imageUrl?: string;
  model?: string;
  messageId?: string;
  isSavedToMedia?: boolean;
  // User attribution for workspace chats
  userId?: string;
  senderName?: string;
  // Cosmo AI routing metadata for display
  cosmo_selected?: boolean;
  detected_category?: string;
}

/**
 * ChatConfig - Chat configuration for display
 * For passing workspace AI instructions and compliance rules to UI
 */
export interface ChatConfig {
  aiInstructions?: string | null;
  complianceRule?: string | null;
}

/**
 * MessageHeaderMessage - Message subset for MessageHeader component
 * Contains only fields needed for header display
 */
export interface MessageHeaderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  cosmo_selected?: boolean;
  detected_category?: string;
}
