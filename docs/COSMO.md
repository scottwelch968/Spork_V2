# COSMO - Comprehensive Operating System Management Orchestrator

> **Version:** 1.0  
> **Location:** `supabase/functions/_shared/cosmo/`

---

## Definition

**C.O.S.M.O** = **C**omprehensive **O**perating **S**ystem **M**anagement **O**rchestrator

COSMO is the "god layer" that orchestrates all AI interactions in SPORK. It acts as the central nervous system, making intelligent decisions about:

- **Intent Analysis** - Understanding what the user wants
- **Function Selection** - Determining which capabilities to invoke
- **Model Routing** - Selecting the optimal AI model
- **Prompt Enhancement** - Building context-rich prompts
- **Response Processing** - Handling and formatting AI responses

> **Architectural Classification**: COSMO is SPORK's implementation of an **AI Agent** as defined in [AI-DEVELOPMENT.md](./AI-DEVELOPMENT.md). It exhibits the key agent characteristics: autonomous planning, multi-step execution, state management, and goal-driven loops.

---

## Architecture Overview

COSMO is the **god layer** - all AI interactions flow through COSMO. Other modules are **tools** that COSMO uses:

```
                    ┌─────────────────────────────────────┐
                    │           orchestrator.ts           │
                    │      (COSMO - The God Layer)        │
                    │   - Receives all AI requests        │
                    │   - Makes all orchestration decisions│
                    │   - Coordinates all tools           │
                    └─────────────────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ intentAnalyzer  │       │ functionSelector│       │functionExecutor │
│ (Understanding) │       │  (Planning)     │       │ (Execution Tool)│
│                 │       │                 │       │                 │
│ - Analyze prompt│       │ - Match funcs   │       │ - Run functions │
│ - Detect intent │       │ - Score relevance│      │ - Return results│
│ - Load from DB  │       │ - Order execution│      │ - Emit events   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   modelRouter   │       │ promptEnhancer  │       │responseProcessor│
│ (Model Selection)│      │ (Context Builder)│      │ (Output Handler)│
│                 │       │                 │       │                 │
│ - Select model  │       │ - Build context │       │ - Process stream│
│ - Cost weighting│       │ - Add persona   │       │ - Extract entities│
│ - Tier fallback │       │ - Add knowledge │       │ - Calculate cost│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Key Architectural Principle

**COSMO decides, tools execute.** The functionExecutor is NOT a separate orchestrator - it's a tool that COSMO uses to run functions. COSMO determines:
- Which functions to execute (via functionSelector)
- In what order to execute them
- What context to pass to them
- How to use their results

---

## Internal Contract Types

COSMO uses three core types that define its internal contract, ensuring type safety and consistency across all pipeline stages:

### NormalizedRequest

After receiving a raw `CosmoRequest`, COSMO normalizes it to guarantee all required fields are present:

```typescript
interface NormalizedRequest extends CosmoRequest {
  // GUARANTEED fields (no longer optional)
  requestType: CosmoRequestType;   // 'chat' | 'webhook' | 'system_task' | 'agent_action' | 'api_call'
  source: CosmoRequestSource;       // Who initiated the request
  responseMode: CosmoResponseMode;  // 'stream' | 'batch' | 'silent'
  priority: CosmoPriority;          // 'low' | 'normal' | 'high' | 'critical'
  
  // Normalization metadata
  normalizedAt: string;             // ISO timestamp
  requestId: string;                // Unique request ID
}
```

### CosmoContext

The shared state object that flows through the entire pipeline. Each stage can read previous results and add its own:

```typescript
interface CosmoContext {
  // Immutable after init
  request: NormalizedRequest;
  supabase: SupabaseClient;
  settings: SystemSettings;
  
  // Accumulated during pipeline
  intent?: EnhancedIntentAnalysis;
  functionSelection?: FunctionSelection;
  modelSelection?: ModelSelection;
  enhancedPrompt?: EnhancedPrompt;
  
  // Execution tracking
  startTime: number;
  functionsInvoked: string[];
  actionsExecuted: string[];
  tiersAttempted: TierAttempt[];
  
  // Debug data accumulator
  debug: Partial<CosmoDebugData>;
}
```

### ExecutionResult

The unified result type returned by all handlers before response formatting:

```typescript
interface ExecutionResult {
  success: boolean;
  
  // Response data (varies by request type)
  stream?: ReadableStream;    // For streaming responses
  content?: string;           // For batch responses
  data?: unknown;             // For structured data (webhooks, tasks)
  
  // Metadata (present on all results)
  actualModelUsed: string;
  cosmoSelected: boolean;
  detectedCategory: string | null;
  costTier: 'low' | 'balanced' | 'premium' | null;
  processingTimeMs: number;
  
  // Execution details
  functionsInvoked: string[];
  actionsExecuted: string[];
  tiersAttempted: TierAttempt[];
  
  // Token/cost tracking
  tokens?: { prompt: number; completion: number; total: number };
  cost?: number;
  
  // Error handling
  error?: ExecutionError;
}
```

### Data Flow Through Contract Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        COSMO Pipeline Flow                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CosmoRequest                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  normalizeRequest() ──► NormalizedRequest                               │
│       │                                                                  │
│       ▼                                                                  │
│  initContext() ──────► CosmoContext { request, settings, startTime }    │
│       │                                                                  │
│       ▼                                                                  │
│  analyzeIntent() ────► context.intent = ...                             │
│       │                                                                  │
│       ▼                                                                  │
│  selectFunctions() ──► context.functionSelection = ...                  │
│       │                                                                  │
│       ▼                                                                  │
│  executeFunctions() ─► context.functionsInvoked.push(...)               │
│       │                                                                  │
│       ▼                                                                  │
│  routeToModel() ─────► context.modelSelection = ...                     │
│       │                                                                  │
│       ▼                                                                  │
│  enhancePrompt() ────► context.enhancedPrompt = ...                     │
│       │                                                                  │
│       ▼                                                                  │
│  tieredFallback() ───► context.tiersAttempted.push(...)                 │
│       │                                                                  │
│       ▼                                                                  │
│  buildExecutionResult(context, opts) ──► ExecutionResult                │
│       │                                                                  │
│       ▼                                                                  │
│  formatResponse(result, responseMode) ──► Response                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Reference

### 1. orchestrator.ts (COSMO - The God Layer)

The main entry point that IS COSMO. All other modules are tools it uses.

#### Key Exports

```typescript
// Main orchestration function - THE entry point for all AI
export async function orchestrate(request: CosmoRequest): Promise<Response>

// HTTP request handler for edge functions
export async function handleChatRequest(req: Request): Promise<Response>

// CORS headers for edge functions
export const corsHeaders: Record<string, string>
```

#### Orchestration Flow (COSMO's Decision Process)

```typescript
async function orchestrate(request: CosmoRequest): Promise<Response> {
  // 1. COSMO loads system settings
  const settings = await loadSettings(supabase);
  
  // 2. COSMO analyzes user intent (understanding)
  const intent = await analyzeIntent(prompt, routingConfig, apiKey);
  
  // 3. COSMO selects functions to execute (planning)
  const functions = await selectFunctions(intent, supabase);
  
  // 4. COSMO executes non-chat functions using its executor tool
  const functionResults = await executeFunctions(batchRequest, supabase);
  
  // 5. COSMO routes to optimal model (model selection)
  const model = await routeToModel(intent, request, settings);
  
  // 6. COSMO enhances prompt with context AND function results
  const enhanced = await enhancePrompt(request, intent, supabase, functionResults);
  
  // 7. COSMO executes with tiered fallback
  const response = await executeTieredFallback(model, enhanced, settings);
  
  // 8. COSMO processes and streams response
  return processResponse(response, metadata);
}
```

#### Tiered Fallback System

```
Tier 1: Primary Model (user-selected or auto-routed by COSMO)
    │
    ▼ (on failure)
Tier 2: Similar Model (same provider, different version)
    │
    ▼ (on failure)
Tier 3: Fallback Model (configured in system_settings)
    │
    ▼ (on failure)
Error Response with structured error details
```

---

### 2. functionExecutor.ts (COSMO's Execution Tool)

A **TOOL** that COSMO uses to execute functions. It does NOT make decisions - it runs what COSMO tells it to.

#### Key Exports

```typescript
// Execute a single function
export async function executeFunction(
  request: FunctionExecutionRequest,
  supabase: SupabaseClient
): Promise<FunctionExecutionResult>

// Execute multiple functions (sequential or parallel)
export async function executeFunctions(
  request: BatchExecutionRequest,
  supabase: SupabaseClient
): Promise<BatchExecutionResult>

// Check if function is available
export async function isFunctionAvailable(functionKey: string, supabase: SupabaseClient): Promise<boolean>

// Get all available functions
export async function getAvailableFunctions(supabase: SupabaseClient): Promise<string[]>
```

#### Execution Flow

```
COSMO decides which functions to run
    │
    ▼
functionExecutor receives request
    │
    ▼
Load function config from database
    │
    ▼
Execute function logic
    │
    ▼
Return results to COSMO
    │
    ▼
COSMO uses results in prompt enhancement
```

---

### 3. actionResolver.ts (Intent-to-Action Routing)

Maps detected intents to executable actions with parameter extraction.

#### Key Exports

```typescript
// Resolve intent to action plan
export async function resolveIntentToActions(
  intent: EnhancedIntentAnalysis,
  supabase: SupabaseClient
): Promise<ActionPlan>

// Extract parameters from prompt
export function extractParameters(
  prompt: string,
  patterns: Record<string, string>
): Record<string, string>

// Extract named entities
export function extractEntities(
  prompt: string
): ExtractedEntity[]

// Check conditions for action execution
export function checkConditions(
  conditions: ActionCondition[],
  context: Record<string, unknown>
): boolean
```

#### Action Resolution Flow

```
Intent Analysis Result
    │
    ▼
Load action mappings from cosmo_action_mappings
    │
    ▼
Filter by intent_key + evaluate conditions
    │
    ▼
Sort by priority (highest first)
    │
    ▼
Extract parameters using regex patterns
    │
    ▼
Build ActionPlan with ordered actions
```

#### Action Types

| Type | Description |
|------|-------------|
| `function` | Execute a chat function |
| `chain` | Execute a function chain |
| `model_call` | Direct model API call |
| `external_api` | Call external API |
| `system` | System-level operation |

---

### 4. intentAnalyzer.ts (Intent Detection)

Analyzes user prompts to determine intent, required functions, and context needs.

#### Key Exports

```typescript
// Main analysis function
export async function analyzeIntent(
  prompt: string,
  routingConfig?: ModelRoutingConfig,
  apiKey?: string
): Promise<IntentAnalysis>

// Utility functions
export function requiresFunction(intent: IntentAnalysis, functionKey: string): boolean
export function needsContext(intent: IntentAnalysis, contextType: ContextNeed): boolean
export async function getAvailableCategories(): Promise<string[]>
export function refreshIntentCache(): void
```

#### Detection Strategy

1. **Database-First Detection**
   - Load intents from `cosmo_intents` table (5-minute cache)
   - Match keywords against user prompt
   - Calculate confidence based on match count

2. **AI-Powered Fallback**
   - If confidence < 0.6, use AI model to analyze
   - Extract category and confidence from AI response
   - Merge with database-defined functions and context needs

#### Intent Categories

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| `coding` | Code generation/debugging | code, function, bug, debug |
| `writing` | Content creation | write, draft, essay, blog |
| `analysis` | Data/text analysis | analyze, compare, evaluate |
| `creative` | Creative tasks | story, poem, creative |
| `research` | Information gathering | research, find, search |
| `conversation` | General chat | hello, thanks, how are you |
| `math` | Calculations | calculate, math, equation |
| `translation` | Language translation | translate, convert |

---

### 3. functionSelector.ts (Function Selection)

Selects and orders functions to execute based on detected intent.

#### Key Exports

```typescript
// Main selection function
export async function selectFunctions(
  intent: IntentAnalysis,
  supabase: SupabaseClient
): Promise<FunctionSelection>

// Utility functions
export async function getAvailableFunctions(supabase: SupabaseClient): Promise<FunctionCandidate[]>
export async function getFunctionConfig(supabase: SupabaseClient, key: string): Promise<FunctionCandidate | null>
export async function isFunctionAvailable(supabase: SupabaseClient, key: string): Promise<boolean>
```

#### Selection Algorithm

```typescript
function scoreFunctionRelevance(func: FunctionCandidate, intent: IntentAnalysis): number {
  let score = 0;
  
  // Direct match with required functions
  if (intent.requiredFunctions.includes(func.function_key)) {
    score += 100;
  }
  
  // Tag matching
  const matchingTags = func.tags?.filter(tag => 
    intent.requiredFunctions.some(rf => rf.includes(tag))
  );
  score += (matchingTags?.length || 0) * 20;
  
  // Description relevance
  if (func.description && intent.category) {
    const words = intent.category.toLowerCase().split(/\s+/);
    const descLower = func.description.toLowerCase();
    words.forEach(word => {
      if (descLower.includes(word)) score += 10;
    });
  }
  
  return score;
}
```

#### Execution Order Priority

1. Data-fetching functions (retrieve context)
2. Processing functions (transform data)
3. Output functions (generate response)

---

### 4. modelRouter.ts (Model Routing)

Selects the optimal AI model based on intent, cost preferences, and availability.

#### Key Exports

```typescript
// Main routing function
export async function routeToModel(
  intent: IntentAnalysis,
  request: CosmoRequest,
  settings: SystemSettings
): Promise<ModelSelection>

// Utility functions
export function getCostTier(weight: number): 'low' | 'balanced' | 'premium'
export function getCostTierLabel(tier: string): string
export function selectModelByWeight(models: ModelCandidate[], weight: number): ModelCandidate
export async function getAvailableModels(supabase: SupabaseClient): Promise<ModelCandidate[]>
export async function getFallbackModel(supabase: SupabaseClient): Promise<ModelCandidate | null>
export async function getSimilarModel(supabase: SupabaseClient, model: ModelCandidate): Promise<ModelCandidate | null>
```

#### Cost-Performance Weighting

| Slider Value | Tier | Behavior |
|--------------|------|----------|
| 0-33 | Low Cost | Select from cheapest 1/3 of capable models |
| 34-66 | Balanced | Select from middle 1/3 by price |
| 67-100 | Premium Quality | Select from most expensive/best 1/3 |

#### Model Selection Flow

```
1. Filter models by:
   - is_active = true
   - Supports required modalities
   - Matches intent category (best_for)

2. Sort by pricing_completion (ascending)

3. Apply cost-tier selection:
   - Low: first third
   - Balanced: middle third
   - Premium: last third

4. Return selected model with reasoning
```

---

### 5. promptEnhancer.ts (Prompt Enhancement)

Builds context-rich prompts by adding relevant information.

#### Key Exports

```typescript
// Main enhancement function
export async function enhancePrompt(
  request: CosmoRequest,
  intent: IntentAnalysis,
  supabase: SupabaseClient
): Promise<EnhancedPrompt>

// Context building
export async function buildContext(
  request: CosmoRequest,
  supabase: SupabaseClient
): Promise<PromptContext>

// Preview function
export function previewContextSources(context: PromptContext): ContextSources
```

#### Context Layers

```
┌─────────────────────────────────────────────┐
│ 1. Response Formatting Rules (if enabled)   │
├─────────────────────────────────────────────┤
│ 2. Global AI Instructions                   │
├─────────────────────────────────────────────┤
│ 3. Workspace/Space AI Instructions          │
├─────────────────────────────────────────────┤
│ 4. Compliance Rules (industry-specific)     │
├─────────────────────────────────────────────┤
│ 5. Persona System Prompt                    │
├─────────────────────────────────────────────┤
│ 6. Personal Context (user preferences)      │
├─────────────────────────────────────────────┤
│ 7. Knowledge Base (relevant documents)      │
├─────────────────────────────────────────────┤
│ 8. Conversation History                     │
└─────────────────────────────────────────────┘
```

#### Context Source Tracking

```typescript
interface ContextSources {
  ai_instructions: boolean;      // Global AI instructions applied
  space_ai_instructions: boolean; // Workspace instructions applied
  compliance_rule: boolean;       // Compliance rules applied
  persona: boolean;               // Persona prompt applied
  personal_context: boolean;      // User context applied
  knowledge_base: boolean;        // Documents referenced
  history: boolean;               // Conversation history included
  history_count?: number;         // Number of messages included
}
```

---

### 6. responseProcessor.ts (Response Processing)

Processes AI responses, extracts entities, and calculates costs.

#### Key Exports

```typescript
// Main processing function
export function processResponse(content: string): ProcessedResponse

// SSE event creation
export function createMetadataEvent(metadata: CosmoMetadata): string
export function createActionsEvent(actions: SuggestedAction[]): string

// Cost calculation
export function estimateTokens(text: string): { prompt: number; completion: number; total: number }
export function calculateCost(tokens: TokenCounts, pricingPrompt: number, pricingCompletion: number): number

// Debug logging
export async function saveDebugLog(
  supabase: SupabaseClient,
  debugData: CosmoDebugData,
  workspaceId?: string,
  chatId?: string,
  userId?: string
): Promise<void>
```

#### Entity Extraction

```typescript
// Extracted from responses
interface ExtractedEntity {
  type: 'url' | 'date' | 'code' | 'email';
  value: string;
  position: number;
}
```

#### Suggested Actions

```typescript
// Generated based on response content
interface SuggestedAction {
  type: 'save' | 'export' | 'regenerate' | 'copy';
  label: string;
  icon: string;
}
```

---

### 7. types.ts (Type Definitions)

Central type definitions for all COSMO modules.

#### Core Types

```typescript
// Request structure
interface CosmoRequest {
  messages: CosmoMessage[];
  model?: string;
  autoSelect?: boolean;
  workspaceId?: string;
  spaceId?: string;
  chatId?: string;
  personaId?: string;
  temperature?: number;
  maxTokens?: number;
}

// Response metadata
interface CosmoMetadata {
  model: string;
  provider: string;
  actualModelUsed: string;
  cosmoSelected: boolean;
  detectedCategory: string;
  costTier: 'low' | 'balanced' | 'premium';
  contextSources: ContextSources;
  processingTime: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
}
```

---

## Database Schema

### cosmo_intents

```sql
CREATE TABLE cosmo_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  required_functions TEXT[] DEFAULT '{}',
  context_needs TEXT[] DEFAULT '{}',
  preferred_models TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### cosmo_function_chains

```sql
CREATE TABLE cosmo_function_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  trigger_intents TEXT[] DEFAULT '{}',
  function_sequence JSONB DEFAULT '[]',
  fallback_chain_id UUID REFERENCES cosmo_function_chains(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### cosmo_action_mappings

```sql
CREATE TABLE cosmo_action_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT NOT NULL,           -- References cosmo_intents.intent_key
  action_key TEXT NOT NULL,           -- Unique identifier for the action
  action_type TEXT NOT NULL,          -- function, chain, model_call, external_api, system
  action_config JSONB DEFAULT '{}',   -- Action-specific configuration
  parameter_patterns JSONB DEFAULT '{}', -- Regex patterns for parameter extraction
  required_context TEXT[] DEFAULT '{}', -- Context types needed for execution
  conditions JSONB DEFAULT '{}',      -- Conditional execution rules
  priority INTEGER DEFAULT 50,        -- Execution priority (higher = first)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### cosmo_debug_logs

```sql
CREATE TABLE cosmo_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT,
  user_id UUID REFERENCES profiles(id),
  workspace_id UUID REFERENCES workspaces(id),
  chat_id UUID,
  original_message TEXT NOT NULL,
  detected_intent TEXT,
  intent_patterns TEXT[],
  requested_model TEXT,
  auto_select_enabled BOOLEAN,
  selected_model TEXT,
  model_provider TEXT,
  model_config JSONB,
  context_sources JSONB,
  system_prompt_preview TEXT,
  full_system_prompt TEXT,
  persona_prompt TEXT,
  ai_instructions TEXT,
  tiers_attempted JSONB,
  fallback_used BOOLEAN,
  response_time_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost NUMERIC,
  success BOOLEAN,
  error_message TEXT,
  api_request_body JSONB,
  api_response_headers JSONB,
  openrouter_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Configuration

### System Settings Keys

| Key | Type | Description |
|-----|------|-------------|
| `default_model` | string | Default model when auto-select disabled |
| `cosmo_routing_config` | JSONB | Cosmo brain model and settings |
| `fallback_model` | JSONB | Fallback model configuration |
| `response_formatting_rules` | JSONB | Response formatting guidelines |
| `ai_instructions` | string | Global AI instructions |

### Cosmo Routing Config Structure

```typescript
interface CosmoRoutingConfig {
  model_id: string;           // Model used as Cosmo's "brain"
  cost_weight: number;        // 0-100 cost-performance slider
  enable_auto_select: boolean; // Enable/disable auto-selection
  category_overrides: {       // Force specific models per category
    [category: string]: string;
  };
}
```

---

## Usage Examples

### Basic Chat Integration

```typescript
import { handleChatRequest, corsHeaders } from '../_shared/cosmo/index.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  return handleChatRequest(req);
});
```

### Custom Orchestration

```typescript
import { 
  analyzeIntent, 
  selectFunctions, 
  routeToModel, 
  enhancePrompt 
} from '../_shared/cosmo/index.ts';

async function customFlow(request: CosmoRequest) {
  // 1. Get intent
  const intent = await analyzeIntent(request.messages[0].content);
  
  // 2. Check if specific function needed
  if (requiresFunction(intent, 'image_generation')) {
    return handleImageGeneration(request);
  }
  
  // 3. Standard flow
  const functions = await selectFunctions(intent, supabase);
  const model = await routeToModel(intent, request, settings);
  const enhanced = await enhancePrompt(request, intent, supabase);
  
  // Continue with model call...
}
```

### Debug Logging

```typescript
import { saveDebugLog } from '../_shared/cosmo/index.ts';

const debugData: CosmoDebugData = {
  operation_type: 'chat',
  original_message: prompt,
  detected_intent: intent.category,
  selected_model: model.model_id,
  context_sources: contextSources,
  // ... more fields
};

await saveDebugLog(supabase, debugData, workspaceId, chatId, userId);
```

---

## Admin UI Integration

### Cosmo Debug Panel

Located at: `/admin/cosmo/debug`

Displays:
- Routing decisions with detected category
- Cost tier badges (green/yellow/blue)
- Models considered
- Context sources used
- Full request/response capture

### Cosmo Configuration

Located at: `/admin/ai-models` → Configuration Tab

Configures:
- Cosmo brain model selection
- Cost-performance weight slider
- Auto-select enable/disable
- Category overrides

### Intent Management

Located at: `/admin/ai-models` → Intents Tab (future)

Manages:
- Intent keywords
- Required functions per intent
- Context needs
- Priority ordering

---

## Phase 2: Intent-to-Action Routing

Phase 2 introduced the action mapping layer between intent detection and function execution:

### Enhanced Intent Analysis

```typescript
interface EnhancedIntentAnalysis extends IntentAnalysis {
  matchedMappings: ActionMapping[];
  extractedParameters: Record<string, string>;
  extractedEntities: ExtractedEntity[];
  suggestedActions: CosmoAction[];
}
```

### Action Plan Generation

```typescript
interface ActionPlan {
  actions: CosmoAction[];
  executionOrder: string[];
  parallelizable: string[][];  // Groups of actions that can run in parallel
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  requiresStreaming: boolean;
}
```

### Parameter Extraction

Action mappings define regex patterns for extracting parameters:

```typescript
// Example parameter_patterns
{
  "location": "(?:in|at|near|around)\\s+([\\w\\s,]+)",
  "date": "(today|tomorrow|\\d{1,2}/\\d{1,2}/\\d{4})",
  "count": "(\\d+)\\s*(?:items?|results?)"
}
```

---

## Phase 3: Unified Entry Point

Phase 3 established COSMO as the true god-layer with a single entry point for ALL request types.

### Request Types

| Type | Source | Description |
|------|--------|-------------|
| `chat` | User/UI | Standard chat messages |
| `webhook` | External | Incoming webhooks from integrations |
| `system_task` | Scheduler | Scheduled/cron jobs |
| `agent_action` | AI Agent | Autonomous agent operations |
| `api_call` | API Client | Direct API integrations |

### Unified Entry Point

```typescript
// ALL requests flow through orchestrate()
export async function orchestrate(request: CosmoRequest): Promise<Response> {
  // 1. Detect request type
  const requestType = detectRequestType(request);
  
  // 2. Normalize request format
  const normalized = normalizeRequest(request, requestType);
  
  // 3. Route to appropriate handler
  switch (requestType) {
    case 'chat':
      return handleChatFlow(normalized, supabase, settings);
    case 'webhook':
      return handleWebhookRequest(normalized, supabase, settings);
    case 'system_task':
      return handleSystemTaskFlow(normalized, supabase, settings);
    case 'agent_action':
      return handleAgentActionFlow(normalized, supabase, settings);
    default:
      return handleChatFlow(normalized, supabase, settings);
  }
}
```

### New Edge Functions

| Function | Purpose |
|----------|---------|
| `cosmo-webhook` | Receive and process external webhooks |
| `cosmo-task` | Execute scheduled system tasks |
| `cosmo-agent` | Handle AI agent autonomous actions |

### Response Modes

```typescript
type CosmoResponseMode = 'stream' | 'batch' | 'silent';

// stream: SSE streaming response (default for chat)
// batch: Complete JSON response
// silent: No response, just execution (for background tasks)
```

---

## COSMO Control Center (Admin UI)

Located at: `/admin/ai-models/cosmo`

### Tabs

1. **Overview** - Dashboard with stats and recent decisions
2. **Intents & Routing** - Manage intent definitions and keywords
3. **Action Mappings** - Configure intent-to-action routing
4. **Function Chains** - Define multi-function execution sequences
5. **Core Configuration** - Model routing, cost weighting, prompts
6. **Debug Console** - Live log viewer with filtering
7. **Testing Sandbox** - Test routing, enhancement, full flows

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture guide
- [Chat Functions](./CHAT-FUNCTIONS.md) - Function-first architecture
- [Testing Guide](./TESTING.md) - Testing patterns

---

*COSMO is the intelligent orchestration layer that makes SPORK's AI capabilities seamless and efficient.*
