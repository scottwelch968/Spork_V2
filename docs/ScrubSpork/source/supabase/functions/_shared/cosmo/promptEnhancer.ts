/**
 * Cosmo Prompt Enhancer
 * Builds enhanced prompts with context injection based on intent analysis
 */

import { info, warn, debug } from './logger.ts';
import type { 
  CosmoRequest,
  CosmoMessage,
  IntentAnalysis,
  PromptContext,
  EnhancedPrompt,
  ContextSources,
  SystemSettings,
} from './types.ts';
import { needsContext } from './intentAnalyzer.ts';

/**
 * Fetch persona system prompt
 */
async function fetchPersonaPrompt(
  supabase: any,
  personaId: string,
  isSpaceChat: boolean
): Promise<string | null> {
  const table = isSpaceChat ? 'space_personas' : 'personas';
  
  const { data, error } = await supabase
    .from(table)
    .select('system_prompt')
    .eq('id', personaId)
    .single();

  if (error) {
    warn('Error fetching persona', { table, error: error.message });
    return null;
  }

  return data?.system_prompt || null;
}

/**
 * Fetch user's personal context
 */
async function fetchPersonalContext(
  supabase: any,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('personal_context')
    .eq('user_id', userId)
    .single();

  if (error) {
    warn('Error fetching personal context', { error: error.message });
    return null;
  }

  return data?.personal_context || null;
}

/**
 * Fetch knowledge base context for workspace
 */
async function fetchKnowledgeBaseContext(
  supabase: any,
  workspaceId: string,
  maxDocs: number = 5
): Promise<string | null> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('content, title')
    .eq('workspace_id', workspaceId)
    .limit(maxDocs);

  if (error) {
    warn('Error fetching knowledge base', { error: error.message });
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data
    .map((d: { title: string; content: string }) => `[${d.title}]: ${d.content.slice(0, 1000)}`)
    .join('\n\n');
}

/**
 * Fetch conversation history
 */
async function fetchHistory(
  supabase: any,
  chatId: string,
  maxMessages: number = 20
): Promise<CosmoMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(maxMessages);

  if (error) {
    warn('Error fetching history', { error: error.message });
    return [];
  }

  // Reverse to get chronological order
  return (data || []).reverse().map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

/**
 * Build context based on intent and settings
 */
export async function buildContext(
  request: CosmoRequest,
  intent: IntentAnalysis,
  settings: SystemSettings,
  supabase: any
): Promise<PromptContext> {
  const preMessageConfig = settings.pre_message_config || {};
  const isSpaceChat = !!request.workspaceId;
  
  const context: PromptContext = {};

  // 1. Formatting rules (always if enabled)
  const formattingConfig = settings.response_formatting_rules;
  if (formattingConfig?.enabled && formattingConfig.rules) {
    context.formattingRules = formattingConfig.rules;
    debug('Context: Added formatting rules');
  }

  // 2. AI Instructions (space-specific or global)
  if (isSpaceChat && request.spaceContext?.aiInstructions) {
    context.spaceAiInstructions = request.spaceContext.aiInstructions;
    debug('Context: Added space AI instructions');
  } else if (!isSpaceChat && settings.ai_instructions?.enabled && settings.ai_instructions.instructions) {
    context.aiInstructions = settings.ai_instructions.instructions;
    debug('Context: Added global AI instructions');
  }

  // 3. Compliance rule (space only)
  if (isSpaceChat && request.spaceContext?.complianceRule) {
    context.complianceRule = request.spaceContext.complianceRule;
    debug('Context: Added compliance rule');
  }

  // 4. Persona (if needed and configured)
  if (preMessageConfig.include_persona && request.personaId && needsContext(intent, 'persona')) {
    const persona = await fetchPersonaPrompt(supabase, request.personaId, isSpaceChat);
    if (persona) {
      context.personaPrompt = persona;
      debug('Context: Added persona prompt');
    }
  }

  // 5. Personal context (individual chats only)
  if (preMessageConfig.include_personal_context && !isSpaceChat && request.userId && needsContext(intent, 'personal_context')) {
    const personal = await fetchPersonalContext(supabase, request.userId);
    if (personal) {
      context.personalContext = personal;
      debug('Context: Added personal context');
    }
  }

  // 6. Knowledge base (space chats only)
  if (preMessageConfig.include_knowledge_base && isSpaceChat && request.workspaceId && needsContext(intent, 'knowledge_base')) {
    const kb = await fetchKnowledgeBaseContext(supabase, request.workspaceId);
    if (kb) {
      context.knowledgeBaseContext = kb;
      debug('Context: Added knowledge base');
    }
  }

  // 7. Conversation history
  if (preMessageConfig.include_history && request.chatId && needsContext(intent, 'history')) {
    const history = await fetchHistory(supabase, request.chatId, preMessageConfig.max_history_messages);
    if (history.length > 0) {
      context.historyMessages = history;
      debug('Context: Added history messages', { count: history.length });
    }
  }

  return context;
}

/**
 * Assemble system prompt from context parts
 */
function assembleSystemPrompt(context: PromptContext): string {
  const parts: string[] = [];

  if (context.formattingRules) {
    parts.push(context.formattingRules);
  }

  if (context.spaceAiInstructions) {
    parts.push(context.spaceAiInstructions);
  } else if (context.aiInstructions) {
    parts.push(context.aiInstructions);
  }

  if (context.complianceRule) {
    parts.push(`Compliance Rule: ${context.complianceRule}`);
  }

  if (context.personaPrompt) {
    parts.push(`Persona Instructions: ${context.personaPrompt}`);
  }

  if (context.personalContext) {
    parts.push(`User Context: ${context.personalContext}`);
  }

  if (context.knowledgeBaseContext) {
    parts.push(`Knowledge Base Context:\n${context.knowledgeBaseContext}`);
  }

  return parts.length > 0
    ? parts.join('\n\n')
    : 'You are a helpful AI assistant. Keep answers clear and concise.';
}

/**
 * Build context sources tracking object
 */
function buildContextSources(context: PromptContext): ContextSources {
  return {
    formatting_rules: !!context.formattingRules,
    ai_instructions: !!context.aiInstructions,
    space_ai_instructions: !!context.spaceAiInstructions,
    compliance_rule: !!context.complianceRule,
    persona: !!context.personaPrompt,
    personal_context: !!context.personalContext,
    knowledge_base: !!context.knowledgeBaseContext,
    history: !!context.historyMessages && context.historyMessages.length > 0,
    history_count: context.historyMessages?.length || 0,
  };
}

/**
 * Main prompt enhancement function - COSMO builds the optimal prompt
 * 
 * @param request - The original request
 * @param intent - Analyzed intent
 * @param settings - System settings
 * @param supabase - Database client
 * @param functionResults - Results from COSMO's function executor (optional)
 */
export async function enhancePrompt(
  request: CosmoRequest,
  intent: IntentAnalysis,
  settings: SystemSettings,
  supabase: any,
  functionResults?: Record<string, unknown>
): Promise<EnhancedPrompt> {
  info('=== COSMO: Enhancing Prompt ===');

  // Build context based on intent needs
  const context = await buildContext(request, intent, settings, supabase);

  // Assemble system prompt
  let systemPrompt = assembleSystemPrompt(context);
  
  // Inject function results into prompt if COSMO executed any functions
  if (functionResults && Object.keys(functionResults).length > 0) {
    debug('COSMO: Injecting function results into context', { count: Object.keys(functionResults).length });
    
    const functionContext = Object.entries(functionResults)
      .map(([key, value]) => {
        // Format function results for the AI to use
        const resultStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        return `[Function: ${key}]\n${resultStr}`;
      })
      .join('\n\n');
    
    systemPrompt += `\n\n--- Function Results (use this data in your response) ---\n${functionContext}`;
  }

  // Build message array with history if available
  let messages = [...request.messages];
  if (context.historyMessages && context.historyMessages.length > 0) {
    messages = [...context.historyMessages, ...request.messages];
  }

  const result: EnhancedPrompt = {
    systemPrompt,
    messages,
    contextSources: buildContextSources(context),
  };

  info('Prompt enhancement complete', {
    systemPromptLength: systemPrompt.length,
    messageCount: messages.length,
    sources: result.contextSources,
    functionResultsIncluded: functionResults ? Object.keys(functionResults).length : 0,
  });

  return result;
}

/**
 * Preview what context would be included (for debugging)
 */
export function previewContextSources(
  intent: IntentAnalysis,
  isSpaceChat: boolean
): string[] {
  const sources: string[] = [];

  if (needsContext(intent, 'persona')) sources.push('persona');
  if (needsContext(intent, 'history')) sources.push('history');
  if (!isSpaceChat && needsContext(intent, 'personal_context')) sources.push('personal_context');
  if (isSpaceChat && needsContext(intent, 'knowledge_base')) sources.push('knowledge_base');

  return sources;
}
