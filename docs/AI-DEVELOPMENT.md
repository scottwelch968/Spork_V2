# AI Development Guide - Tools, Assistants & Agents

> **Version:** 1.0  
> **Last Updated:** December 2024

---

## Overview

This guide provides engineering-grade definitions for the three fundamental AI building blocks: **Tools**, **Assistants**, and **Agents**. Understanding these distinctions is critical for proper architecture design in SPORK.

### Quick Classification

| Concept | Autonomy | Loop | SPORK Implementation |
|---------|----------|------|---------------------|
| **AI Tool** | None | No | Edge Functions, `chat_functions` |
| **AI Assistant** | Reactive | No | Personas, Prompt Profiles |
| **AI Agent** | Autonomous | Yes | COSMO Orchestrator |

### The Boundary Test

Ask: **Does it have autonomy + a loop?**

- **Tool**: No. It just executes one operation.
- **Assistant**: Usually no. It responds, maybe calls tools, but doesn't self-drive multi-step completion.
- **Agent**: Yes. It plans and iterates until completion.

---

## AI Tool

### Clear Definition

An **AI Tool** is a single capability exposed through a strict interface (function/API) that an AI system can call to do one job: fetch data, write to a DB, send an email, run a calculation, search, transform text, etc.

### What It "Is" in Code

- A function or endpoint with:
  - Well-defined inputs (schema)
  - Deterministic side effects (or none)
  - Well-defined outputs (schema)
  - Auth + permission checks
  - Validation + error handling
- **"Tool" is not a chat persona. It's an executable primitive.**

### Technical Runtime Flow

```
1. Model decides it needs an external operation
       │
       ▼
2. Model emits a structured call: { tool_name, args }
       │
       ▼
3. Tool runner validates args, runs the tool, returns { result }
       │
       ▼
4. Model uses the result to continue
```

### SPORK Implementation: Edge Functions & Chat Functions

In SPORK, AI Tools are implemented as:

1. **Edge Functions** (`supabase/functions/`)
   - `image-generation` - Generate images via AI models
   - `knowledge-base` - Query document knowledge base
   - `send-email` - Send emails via configured providers
   - `enhance-prompt` - Enhance user prompts

2. **Chat Functions** (`chat_functions` table)
   - Database-registered functions with schemas
   - Discoverable by COSMO for auto-selection
   - See: [CHAT-FUNCTIONS.md](./CHAT-FUNCTIONS.md)

### Coding Methodology

Treat tools like **production APIs**:

| Principle | Implementation |
|-----------|----------------|
| **Single Responsibility** | One tool = one job. No multi-purpose tools. |
| **Input Validation** | Use Zod/JSON schema, fail loudly, return safe errors |
| **Idempotency** | For "write" tools when possible (avoid double charges/writes) |
| **Observability** | Log tool name, latency, and non-sensitive metadata |
| **Security** | No hardcoded secrets; enforce auth/authorization; prevent injection |

### Tool Template (Server)

```typescript
// Standard SPORK Edge Function Tool Pattern
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Validate input (schema)
    const { input } = await req.json();
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input: expected string');
    }

    // 3. AuthZ
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Execute (single responsibility)
    const result = await performOperation(input);

    // 5. Return typed result
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // 6. Never leak secrets in errors/logs
    console.error('Tool error:', error.message);
    return new Response(JSON.stringify({
      error: error.message,
      code: error.code || 'TOOL_ERROR'
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### Good Tool Examples

| Tool | Purpose |
|------|---------|
| `searchCRMContacts(query)` | Search contacts in CRM |
| `createInvoice(customerId, lineItems)` | Create billing invoice |
| `fetchReservations(dateRange)` | Get reservations |
| `summarizeTranscript(text)` | Summarize text content |
| `generateImage(prompt, model)` | Generate AI image |
| `queryKnowledgeBase(query, workspaceId)` | Search documents |

---

## AI Assistant

### Clear Definition

An **AI Assistant** is a conversational layer that:

- Understands user intent via dialogue
- Produces responses (text/structured)
- Optionally uses tools
- Usually stays **reactive** (responds to the user) rather than autonomously driving multi-step plans

### What It "Is" in Code

- A chat endpoint + prompt/instructions + memory policy + tool access policy
- Often implemented as:
  - A message loop: `messages[]` → model → response
  - Optional "tool call" handling

### Technical Runtime Flow

```
1. User message arrives
       │
       ▼
2. Assistant prompt + conversation state assembled
       │
       ▼
3. Model generates either:
   - Direct answer OR
   - Tool call(s) + then final answer
       │
       ▼
4. State saved (messages, summaries, preferences)
```

### SPORK Implementation: Personas & Prompt Profiles

In SPORK, AI Assistants are implemented as:

1. **Personas** (`personas` / `space_personas` tables)
   - System prompts defining assistant behavior
   - Custom instructions per use case
   - Icon and identity configuration

2. **Prompt Library** (`ai_prompt_library` table)
   - Pre-built assistant roles for specific tasks
   - E.g., "Accessibility Reviewer", "API Architect", "Marketing Writer"
   - Specialized by system prompt and output format

3. **Chat Interface** (`UnifiedChatInterface`)
   - Message loop with history
   - Persona-driven system prompts
   - Tool access via COSMO

### Coding Methodology

| Principle | Implementation |
|-----------|----------------|
| **Separation of Concerns** | UI, state, and data access separated |
| **State Design First** | What you store, how you summarize, what you forget |
| **Tool Whitelist** | Only allow specific tools for each assistant |
| **Refuse/Redirect Policy** | Handle unsafe requests gracefully |
| **No Silent Side Effects** | Confirm before destructive actions |

### Assistant Template (Chat)

```typescript
// SPORK Persona-Based Assistant Pattern
interface AssistantConfig {
  systemPrompt: string;       // Persona system prompt
  toolWhitelist: string[];    // Allowed function keys
  memoryPolicy: 'full' | 'summary' | 'none';
  maxHistoryMessages: number;
}

async function handleAssistantMessage(
  userMessage: string,
  history: Message[],
  config: AssistantConfig
): Promise<AssistantResponse> {
  // 1. Build system prompt with policies
  const systemPrompt = buildSystemPrompt(config);
  
  // 2. Manage message history (summarization)
  const managedHistory = manageHistory(history, config.memoryPolicy);
  
  // 3. Check for tool needs
  const toolNeeds = detectToolNeeds(userMessage, config.toolWhitelist);
  
  // 4. Execute allowed tools only
  let toolResults = {};
  if (toolNeeds.length > 0) {
    toolResults = await executeAllowedTools(toolNeeds, config.toolWhitelist);
  }
  
  // 5. Generate response
  const response = await generateResponse({
    systemPrompt,
    history: managedHistory,
    userMessage,
    toolResults
  });
  
  // 6. Format and return
  return formatResponse(response, config);
}
```

### Assistant Patterns in SPORK

Your prompt library contains many "assistant roles" - these are assistants specialized by:

- **System prompt** - Defines expertise and behavior
- **Output format** - How responses are structured
- **Tool access** - Which capabilities are available

Examples:
- Accessibility Reviewer → Reviews for WCAG compliance
- API Architect → Designs REST/GraphQL APIs
- Marketing Writer → Creates marketing content
- Code Debugger → Analyzes and fixes code issues

---

## AI Agent

### Clear Definition

An **AI Agent** is an assistant plus **autonomy**: it can plan, execute multiple steps, call multiple tools, maintain a task state, and stop when a goal is met—often without the user micromanaging each step.

> If a tool is "a function" and an assistant is "a chat brain," an agent is "a chat brain with a loop and a plan."

### What It "Is" in Code

An agent typically includes:

| Component | Purpose |
|-----------|---------|
| **Goal/Task Spec** | What the agent is trying to achieve |
| **Planner** | Creates execution steps |
| **Executor** | Calls tools |
| **State Machine** | Tracks progress, retries, failures |
| **Memory** | Short-term scratchpad + durable logs |
| **Safety Gates** | Human-in-the-loop approvals |

### Technical Runtime Flow (Agent Loop)

```
1. INTERPRET goal
       │
       ▼
2. PLAN: break goal into steps
       │
       ▼
3. ACT: call tool(s)
       │
       ▼
4. OBSERVE: read tool results
       │
       ▼
5. REFLECT: decide next step / adjust plan
       │
       ▼
6. FINISH or handoff (loop back to step 2 if not done)
```

### SPORK Implementation: COSMO Orchestrator

In SPORK, the AI Agent pattern is implemented as **COSMO** (Comprehensive Operating System Management Orchestrator):

```
┌─────────────────────────────────────────────────────────────┐
│                    COSMO (The God Layer)                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Intent       │  │ Function     │  │ Model        │       │
│  │ Analyzer     │  │ Selector     │  │ Router       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Function     │  │ Prompt       │  │ Response     │       │
│  │ Executor     │  │ Enhancer     │  │ Processor    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

COSMO modules map to agent components:

| Agent Component | COSMO Module |
|-----------------|--------------|
| Goal Interpreter | `intentAnalyzer.ts` |
| Planner | `functionSelector.ts` + `actionResolver.ts` |
| Executor | `functionExecutor.ts` |
| State Machine | `orchestrator.ts` (tiered fallback, retry logic) |
| Memory | `cosmo_debug_logs`, conversation history |
| Safety Gates | Tool permissions, approval workflows |

See: [COSMO.md](./COSMO.md) for full documentation.

### Coding Methodology

Use an explicit engineering framework:

#### Agent Build Checklist

**1. Define the Contract**
```typescript
interface AgentContract {
  inputs: {
    goal: string;
    constraints: string[];
    permissions: string[];
  };
  outputs: {
    artifact: any;
    actionLog: ActionLogEntry[];
    status: 'completed' | 'failed' | 'needs_approval';
  };
}
```

**2. Define State**
```typescript
interface AgentState {
  status: 'idle' | 'planning' | 'acting' | 'waiting_approval' | 'done' | 'failed';
  steps: Array<{
    tool: string;
    args: Record<string, any>;
    result: any;
    attempts: number;
  }>;
  currentStepIndex: number;
}
```

**3. Tool Policy**
```typescript
interface ToolPolicy {
  allowedTools: string[];           // Which tools can it use?
  approvalRequired: string[];       // Which tools need human approval?
  maxExecutionsPerTool: number;     // Prevent runaway loops
}
```

**4. Reliability**
- Retries with exponential backoff for network/tool failures
- Idempotency keys for write operations
- Time/step budget to prevent runaway loops

**5. Security**
- Per-step permission checks
- Prevent prompt injection via tool outputs (treat as untrusted)
- Rate limiting per user/workspace

**6. Observability**
- Store every action + result in agent run log
- Track costs, latency, success/failure rates
- Enable debugging and audit trails

### Agent Template (Orchestrator)

```typescript
// SPORK Agent Pattern (COSMO-style)
interface AgentConfig {
  maxSteps: number;
  timeoutMs: number;
  toolPolicy: ToolPolicy;
  retryConfig: RetryConfig;
}

async function runAgent(
  goal: string,
  context: AgentContext,
  config: AgentConfig
): Promise<AgentResult> {
  const state: AgentState = {
    status: 'planning',
    steps: [],
    currentStepIndex: 0
  };
  
  const actionLog: ActionLogEntry[] = [];
  
  try {
    // 1. INTERPRET: Analyze the goal
    const intent = await analyzeIntent(goal);
    
    // 2. PLAN: Create execution steps
    const plan = await createPlan(intent, config.toolPolicy);
    state.steps = plan.steps;
    
    // 3. EXECUTE LOOP
    while (state.currentStepIndex < state.steps.length) {
      // Check timeout
      if (Date.now() - startTime > config.timeoutMs) {
        throw new Error('Agent timeout exceeded');
      }
      
      const step = state.steps[state.currentStepIndex];
      state.status = 'acting';
      
      // Check if approval required
      if (config.toolPolicy.approvalRequired.includes(step.tool)) {
        state.status = 'waiting_approval';
        await waitForApproval(step);
      }
      
      try {
        // 4. ACT: Execute the tool
        const result = await executeTool(step.tool, step.args);
        step.result = result;
        
        // 5. OBSERVE & LOG
        actionLog.push({
          tool: step.tool,
          args: step.args,
          result,
          timestamp: new Date().toISOString()
        });
        
        // 6. REFLECT: Adjust plan if needed
        const adjustment = await reflectOnResult(result, state.steps.slice(state.currentStepIndex + 1));
        if (adjustment.replaceRemainingSteps) {
          state.steps = [...state.steps.slice(0, state.currentStepIndex + 1), ...adjustment.newSteps];
        }
        
        state.currentStepIndex++;
        
      } catch (error) {
        step.attempts++;
        if (step.attempts < config.retryConfig.maxRetries) {
          await delay(config.retryConfig.backoffMs * step.attempts);
          continue; // Retry
        }
        throw error;
      }
    }
    
    // 7. FINISH
    state.status = 'done';
    return {
      artifact: compileResults(state.steps),
      actionLog,
      status: 'completed'
    };
    
  } catch (error) {
    state.status = 'failed';
    return {
      artifact: null,
      actionLog,
      status: 'failed',
      error: error.message
    };
  }
}
```

---

## Summary: The 3-Layer Structure

In SPORK's architecture:

| Layer | Implementation | Location |
|-------|----------------|----------|
| **Tools** | Edge Functions, Chat Functions | `supabase/functions/`, `chat_functions` table |
| **Assistants** | Personas, Prompt Profiles | `personas`, `ai_prompt_library` tables |
| **Agents** | COSMO Orchestrator | `supabase/functions/_shared/cosmo/` |

### Development Flow

When building new AI capabilities:

```
1. START with a Tool
   - Build the atomic capability first
   - Validate inputs, handle errors, return typed results
   
2. WRAP with an Assistant (if conversational)
   - Add persona/system prompt
   - Define tool access policy
   - Implement memory/state management
   
3. ORCHESTRATE with Agent (if multi-step)
   - Define goal contract
   - Build execution plan
   - Implement loop with safety gates
```

---

## App Store ↔ COSMO Protocol

All App Store items (Tools, Assistants, Agents) communicate with COSMO through an explicit protocol that enforces permission boundaries.

### What Each Type Can Request

| Operation | Tool | Assistant | Agent |
|-----------|------|-----------|-------|
| `ai.complete` | ✅ | ✅ | ✅ |
| `ai.generateImage` | ✅ | ✅ | ✅ |
| `chat.send` | ❌ | ✅ | ✅ |
| `tool.invoke` | ❌ | ✅ | ✅ |
| `agent.plan` | ❌ | ❌ | ✅ |
| `agent.execute` | ❌ | ❌ | ✅ |
| `external.call` | ✅ | ✅ | ✅ |

### What COSMO Can Deny

- `permission_denied` - App lacks required permission
- `operation_not_allowed` - Operation not allowed for app type
- `rate_limited` - Too many requests
- `quota_exceeded` - Workspace quota exceeded
- `integration_not_connected` - External provider not connected

### Retry & Failure Handling

| App Type | Max Retries | On Failure |
|----------|-------------|------------|
| Tool | 0 | Throw immediately |
| Assistant | 2 | Graceful error message |
| Agent | 5 | Reflect and adjust plan |

---

## External Integration Protocol

App Store items can connect to external services (Slack, Google Drive, HubSpot, etc.) through COSMO's External Integration system.

### Supported Providers

- **Communication**: Slack, Microsoft Teams
- **Storage**: Google Drive, OneDrive
- **CRM**: HubSpot
- **Productivity**: Notion
- **Development**: GitHub

### Connection Flow

1. App requests connection via `sporkApi.external.requestConnection('slack')`
2. User is redirected to OAuth authorization
3. Tokens stored securely in Supabase Vault
4. App can make authenticated calls via `sporkApi.external.call()`

### Database Tables

- `external_providers` - Supported provider configurations
- `user_integrations` - User-level OAuth tokens
- `workspace_integrations` - Shared workspace integrations
- `app_item_integrations` - Links apps to integrations

---

## Cross-References

- **Architecture Overview**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Function Implementation**: [CHAT-FUNCTIONS.md](./CHAT-FUNCTIONS.md)
- **COSMO Agent System**: [COSMO.md](./COSMO.md)
- **Testing Patterns**: [TESTING.md](./TESTING.md)

---

## Appendix: Decision Tree

```
Is it a Tool, Assistant, or Agent?

START: Does it execute a single operation?
  │
  ├─YES→ Does it have a chat interface?
  │        │
  │        ├─NO→  [TOOL] - Edge function, API endpoint
  │        │
  │        └─YES→ Does it drive multi-step plans autonomously?
  │                 │
  │                 ├─NO→  [ASSISTANT] - Persona, chat endpoint
  │                 │
  │                 └─YES→ [AGENT] - COSMO orchestrator
  │
  └─NO→ It's probably an AGENT
        (multi-step, autonomous, loops until goal met)
```
