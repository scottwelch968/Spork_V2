/**
 * Presentation Layer - Space Chat Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

/**
 * SpaceChat - Workspace chat list item display type
 */
export interface SpaceChat {
  id: string;
  space_id: string;
  user_id: string;
  title: string;
  persona_id: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
  // Profile info for the chat creator display
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

/**
 * SpaceChatMessage - Workspace chat message display type
 */
export interface SpaceChatMessage {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  tokens_used: number | null;
  created_at: string;
}
