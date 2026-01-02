/**
 * Presentation Layer - Debug Console Display Types
 * These types are for UI rendering only. They do not perform system actions.
 */

export interface DebugContextSources {
  ai_instructions: boolean;
  space_ai_instructions: boolean;
  compliance_rule: boolean;
  persona: boolean;
  personal_context: boolean;
  knowledge_base: boolean;
  history: boolean;
  history_count?: number;
}

export interface DebugModelConfig {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface DebugTierAttempt {
  tier: number;
  tier_name: string;
  model: string;
  provider: string;
  success: boolean;
  error?: string;
  status_code?: number;
}

export interface DebugApiRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: unknown;
}

export interface DebugEntry {
  id: string;
  created_at: string;
  
  // Operation type
  operation_type: 'chat' | 'enhance_prompt';
  
  // Session info
  user_id: string | null;
  chat_id: string | null;
  workspace_id: string | null;
  
  // Joined fields for display
  user_name: string | null;
  user_email: string | null;
  workspace_name: string | null;
  is_workspace_chat: boolean;
  
  // Original input
  original_message: string;
  
  // Cosmo decision making
  detected_intent: string | null;
  intent_patterns: string[] | null;
  requested_model: string | null;
  auto_select_enabled: boolean;
  
  // Cosmo routing info
  cosmo_routing_model: string | null;
  cost_tier: 'low' | 'balanced' | 'premium' | null;
  cosmo_reasoning: string | null;
  models_considered: string[] | null;
  
  // Context sources
  context_sources: DebugContextSources;
  
  // Prompts
  system_prompt_preview: string | null;
  full_system_prompt: string | null;
  persona_prompt: string | null;
  ai_instructions: string | null;
  
  // Model selection
  selected_model: string | null;
  model_provider: string | null;
  model_config: DebugModelConfig;
  
  // Fallback chain
  tiers_attempted: DebugTierAttempt[];
  fallback_used: boolean;
  
  // Response metrics
  response_time_ms: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cost: number | null;
  
  // Status
  success: boolean;
  error_message: string | null;
  
  // Full API request/response capture
  api_request_body: DebugApiRequestBody | null;
  api_response_headers: Record<string, string> | null;
  openrouter_request_id: string | null;
}

export interface DebugFilters {
  searchTerm: string;
  startDate: Date | null;
  endDate: Date | null;
  sessionType: 'all' | 'personal' | 'workspace';
  operationType: 'all' | 'chat' | 'enhance_prompt';
}

export interface DebugState {
  logs: DebugEntry[];
  currentIndex: number;
  isLoggingEnabled: boolean;
  isLoading: boolean;
}
