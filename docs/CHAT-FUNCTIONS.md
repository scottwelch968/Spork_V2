# Chat Functions - Function-First Architecture

> **Version:** 1.0  
> **Location:** `src/lib/chatFunctions/`

---

## Overview

SPORK's chat system uses a **function-first architecture** where:

- **Functions** are independent, actor-agnostic units of work
- **Actors** (users, AI agents, system) can invoke any allowed function
- **Containers** are optional UI projections of function outputs
- **Events** connect functions to containers through pub/sub pattern

This architecture enables extensibility without modifying existing code.

> **Note**: Chat Functions are **AI Tools** as defined in [AI-DEVELOPMENT.md](./AI-DEVELOPMENT.md) - single-responsibility, schema-validated operations that can be invoked by any actor (user, AI agent, system, webhook).

---

## Core Principles

### 1. Function Independence

Functions operate independently and can be called by any actor:

```typescript
// A function doesn't know or care who called it
async function generateImage(input: ImageInput): Promise<ImageOutput> {
  // Just do the work
  const result = await callImageAPI(input);
  
  // Emit events for interested parties
  chatEventBus.emit('image:generated', result);
  
  return result;
}
```

### 2. Actor Agnosticism

Same function, different callers:

```typescript
// User clicks "Generate Image" button
await executeFunction('image_generation', { prompt: '...' }, 'user');

// AI agent decides to generate image
await executeFunction('image_generation', { prompt: '...' }, 'ai_agent');

// System scheduled task
await executeFunction('image_generation', { prompt: '...' }, 'system');

// Webhook trigger
await executeFunction('image_generation', { prompt: '...' }, 'webhook');
```

### 3. Optional Display

Functions can operate silently:

```typescript
// With UI display
const result = await executeFunction('analyze_sentiment', data, 'user', {
  display: true
});

// Silent (system-to-system)
const result = await executeFunction('analyze_sentiment', data, 'system', {
  display: false
});
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         ACTORS                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  User   │ │ Editor  │ │  Agent  │ │ System  │ │ Webhook │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼──────────┘
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT HANDLER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - Load actor config from database                       │    │
│  │  - Validate function permissions                         │    │
│  │  - Build execution plan                                  │    │
│  │  - Execute functions in sequence                         │    │
│  │  - Handle errors per-function                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FUNCTIONS                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  Chat   │ │  Image  │ │ Analyze │ │ Search  │ │ Custom  │   │
│  │  Core   │ │   Gen   │ │  Text   │ │  Web    │ │   ...   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼──────────┘
        │          │          │          │          │
        └──────────┴──────────┴──────────┴──────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EVENT BUS                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Events: request:submitted, model:selected,              │    │
│  │          response:chunk, response:complete,              │    │
│  │          image:generated, actions:determined             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTAINERS (UI)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │ UserMessage │ │ModelResponse│ │ ImageResult │ ...            │
│  │ Container   │ │ Container   │ │ Container   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### chat_functions

Stores function metadata and configuration:

```sql
CREATE TABLE chat_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  
  -- Schema definitions
  input_schema JSONB,           -- JSON Schema for input validation
  output_schema JSONB,          -- JSON Schema for output structure
  output_format TEXT,           -- 'text', 'json', 'stream', 'binary'
  
  -- Event configuration
  events_emitted TEXT[],        -- Events this function emits
  
  -- Dependencies
  depends_on TEXT[],            -- Function keys this depends on
  requires_context TEXT[],      -- Context types required
  
  -- Discovery
  tags TEXT[],                  -- Semantic tags for Cosmo matching
  cosmo_priority INTEGER,       -- Priority in auto-selection
  
  -- Code location
  code_path TEXT,               -- Path to function implementation
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_core BOOLEAN DEFAULT false, -- Core functions cannot be disabled
  
  -- Metadata
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### chat_actors

Stores actor types and their permissions:

```sql
CREATE TABLE chat_actors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT UNIQUE NOT NULL,  -- 'user', 'ai_agent', 'system', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Permissions
  allowed_functions TEXT[],         -- Function keys actor can invoke
  
  -- Behavior configuration
  function_sequence JSONB,          -- Default execution sequence
  context_defaults JSONB,           -- Default context settings
  default_display_mode TEXT,        -- 'full', 'minimal', 'silent'
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  
  -- Metadata
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### chat_containers

Stores UI container configurations:

```sql
CREATE TABLE chat_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Event subscription
  subscribes_to TEXT[],             -- Event names to listen for
  function_key TEXT REFERENCES chat_functions(function_key),
  
  -- Rendering configuration
  content_type TEXT,                -- 'text', 'image', 'code', 'mixed'
  render_schema JSONB,              -- UI rendering schema
  style_config JSONB,               -- Styling configuration
  display_config JSONB,             -- Display behavior
  format_config JSONB,              -- Content formatting
  
  -- Targeting
  target_actors TEXT[],             -- Actor types this renders for
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  is_core BOOLEAN DEFAULT false,
  is_deletable BOOLEAN DEFAULT true,
  
  -- Metadata
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Event System

### ChatEventBus

Central event emitter for function-container communication:

```typescript
// src/lib/chatFunctions/eventBus.ts

class ChatEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  
  subscribe(eventName: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener);
    
    // Return unsubscribe function
    return () => this.listeners.get(eventName)?.delete(listener);
  }
  
  emit(eventName: string, payload: any, requestId?: string): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(payload, requestId);
        } catch (error) {
          console.error(`Error in listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  clear(): void {
    this.listeners.clear();
  }
}

export const chatEventBus = new ChatEventBus();
```

### Standard Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `request:submitted` | `{ content, actor, timestamp }` | User/actor submitted request |
| `model:selected` | `{ model, provider, cosmoSelected }` | Model routing complete |
| `response:start` | `{ model, requestId }` | Response streaming started |
| `response:chunk` | `{ content, delta }` | Response chunk received |
| `response:complete` | `{ content, tokens, cost }` | Response finished |
| `response:error` | `{ error, code, details }` | Error occurred |
| `image:generating` | `{ prompt, model }` | Image generation started |
| `image:generated` | `{ url, prompt, metadata }` | Image ready |
| `actions:determined` | `{ actions[] }` | Suggested actions ready |

### Using Events in Components

```typescript
// src/hooks/useChatFunctionSubscriber.ts

export function useChatFunctionSubscriber(
  eventName: string,
  handler: (payload: any) => void,
  requestId?: string
) {
  useEffect(() => {
    const unsubscribe = chatEventBus.subscribe(eventName, (payload, eventRequestId) => {
      // Filter by requestId if provided
      if (!requestId || requestId === eventRequestId) {
        handler(payload);
      }
    });
    
    return unsubscribe;
  }, [eventName, handler, requestId]);
}

// Usage in component
function ResponseContainer() {
  const [content, setContent] = useState('');
  
  useChatFunctionSubscriber('response:chunk', (payload) => {
    setContent(prev => prev + payload.delta);
  });
  
  return <div>{content}</div>;
}
```

---

## Function Registry

### Registry Service

```typescript
// src/lib/chatFunctions/registry.ts

interface FunctionRegistry {
  functions: Map<string, FunctionConfig>;
  actors: Map<string, ActorConfig>;
  containers: Map<string, ContainerConfig>;
}

const cache: FunctionRegistry = {
  functions: new Map(),
  actors: new Map(),
  containers: new Map(),
};

export async function loadRegistry(supabase: SupabaseClient): Promise<void> {
  const [functions, actors, containers] = await Promise.all([
    supabase.from('chat_functions').select('*').eq('is_enabled', true),
    supabase.from('chat_actors').select('*').eq('is_enabled', true),
    supabase.from('chat_containers').select('*').eq('is_enabled', true),
  ]);
  
  // Populate cache
  functions.data?.forEach(f => cache.functions.set(f.function_key, f));
  actors.data?.forEach(a => cache.actors.set(a.actor_type, a));
  containers.data?.forEach(c => cache.containers.set(c.container_key, c));
}

export function isFunctionEnabled(functionKey: string): boolean {
  return cache.functions.has(functionKey);
}

export function isActorAllowed(actorType: string, functionKey: string): boolean {
  const actor = cache.actors.get(actorType);
  if (!actor) return false;
  return actor.allowed_functions?.includes(functionKey) ?? false;
}

export function getFunctionConfig(functionKey: string): FunctionConfig | undefined {
  return cache.functions.get(functionKey);
}

export function getActorConfig(actorType: string): ActorConfig | undefined {
  return cache.actors.get(actorType);
}

export function getFunctionsByTags(tags: string[]): FunctionConfig[] {
  return Array.from(cache.functions.values()).filter(f =>
    f.tags?.some(tag => tags.includes(tag))
  );
}
```

---

## Event Handler

Central orchestrator that processes all function requests:

```typescript
// src/lib/chatFunctions/eventHandler.ts

interface EventHandlerRequest {
  actorType: string;
  interfaceType: 'ui' | 'api' | 'webhook' | 'system' | 'agent';
  content: any;
  context?: Record<string, any>;
}

interface EventHandlerResult {
  success: boolean;
  outputs: Record<string, any>;
  containers: ContainerConfig[];
  errors?: Array<{ function: string; error: string }>;
}

export async function handleRequest(
  request: EventHandlerRequest
): Promise<EventHandlerResult> {
  // 1. Load actor configuration
  const actorConfig = getActorConfig(request.actorType);
  if (!actorConfig) {
    throw new Error(`Unknown actor type: ${request.actorType}`);
  }
  
  // 2. Build execution plan from function_sequence
  const plan = buildExecutionPlan(actorConfig.function_sequence);
  
  // 3. Execute functions in sequence
  const outputs: Record<string, any> = {};
  const errors: Array<{ function: string; error: string }> = [];
  
  for (const step of plan) {
    // Check if function is allowed for this actor
    if (!isActorAllowed(request.actorType, step.functionKey)) {
      continue;
    }
    
    // Check if function is enabled
    if (!isFunctionEnabled(step.functionKey)) {
      continue;
    }
    
    try {
      // Execute function
      const result = await executeFunction(step.functionKey, {
        ...request.content,
        ...outputs, // Include outputs from previous functions
      });
      
      outputs[step.functionKey] = result;
      
      // Emit completion event
      chatEventBus.emit(`${step.functionKey}:complete`, result);
      
    } catch (error) {
      errors.push({ function: step.functionKey, error: error.message });
      
      // Handle error based on configuration
      if (step.onError === 'fail') {
        throw error;
      } else if (step.onError === 'retry') {
        // Retry logic
      }
      // 'continue' - just move to next function
    }
  }
  
  // 4. Match containers for outputs
  const containers = matchContainers(outputs);
  
  return { success: true, outputs, containers, errors };
}
```

---

## Dynamic Container Rendering

### DynamicContainer Component

Universal renderer that interprets `render_schema`:

```typescript
// src/components/chat/DynamicContainer.tsx

interface DynamicContainerProps {
  config: ContainerConfig;
  data: Record<string, any>;
}

export function DynamicContainer({ config, data }: DynamicContainerProps) {
  const resolvedData = resolveTemplates(config.render_schema, data);
  
  return (
    <div className={cn(config.style_config?.containerClass)}>
      {renderPrimitive(resolvedData)}
    </div>
  );
}

function renderPrimitive(schema: RenderSchema): ReactNode {
  switch (schema.type) {
    case 'card':
      return (
        <Card className={schema.className}>
          {schema.children?.map(renderPrimitive)}
        </Card>
      );
      
    case 'text':
      return (
        <p className={schema.className}>
          {schema.content}
        </p>
      );
      
    case 'image':
      return (
        <img 
          src={schema.src} 
          alt={schema.alt} 
          className={schema.className} 
        />
      );
      
    case 'list':
      return (
        <ul className={schema.className}>
          {schema.items?.map((item, i) => (
            <li key={i}>{renderPrimitive(item)}</li>
          ))}
        </ul>
      );
      
    case 'row':
      return (
        <div className={cn('flex gap-2', schema.className)}>
          {schema.children?.map(renderPrimitive)}
        </div>
      );
      
    case 'button':
      return (
        <Button 
          variant={schema.variant}
          onClick={() => handleAction(schema.action)}
        >
          {schema.label}
        </Button>
      );
      
    case 'badge':
      return <Badge variant={schema.variant}>{schema.content}</Badge>;
      
    case 'divider':
      return <Separator className={schema.className} />;
      
    case 'grid':
      return (
        <div className={cn('grid', schema.className)}>
          {schema.children?.map(renderPrimitive)}
        </div>
      );
      
    case 'conditional':
      if (evaluateCondition(schema.condition, data)) {
        return schema.then ? renderPrimitive(schema.then) : null;
      }
      return schema.else ? renderPrimitive(schema.else) : null;
      
    default:
      return null;
  }
}

// Template resolution: {{fieldName}} → actual value
function resolveTemplates(schema: any, data: Record<string, any>): any {
  if (typeof schema === 'string') {
    return schema.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
  }
  
  if (Array.isArray(schema)) {
    return schema.map(item => resolveTemplates(item, data));
  }
  
  if (typeof schema === 'object' && schema !== null) {
    return Object.fromEntries(
      Object.entries(schema).map(([key, value]) => [
        key,
        resolveTemplates(value, data)
      ])
    );
  }
  
  return schema;
}
```

### Render Schema Example

```json
{
  "type": "card",
  "className": "p-4 border rounded-lg",
  "children": [
    {
      "type": "row",
      "className": "items-center gap-3",
      "children": [
        {
          "type": "image",
          "src": "{{imageUrl}}",
          "alt": "Generated image",
          "className": "w-16 h-16 rounded"
        },
        {
          "type": "text",
          "content": "{{prompt}}",
          "className": "text-sm text-muted-foreground"
        }
      ]
    },
    {
      "type": "divider",
      "className": "my-3"
    },
    {
      "type": "row",
      "className": "justify-end gap-2",
      "children": [
        {
          "type": "button",
          "variant": "outline",
          "label": "Download",
          "action": { "type": "download", "url": "{{imageUrl}}" }
        },
        {
          "type": "button",
          "variant": "default",
          "label": "Use in Chat",
          "action": { "type": "insert", "content": "{{imageUrl}}" }
        }
      ]
    }
  ]
}
```

---

## Adding New Functions

### Three-Step Pattern

#### Step 1: Database Registration

Register in `chat_functions` table:

```sql
INSERT INTO chat_functions (
  function_key,
  name,
  description,
  category,
  input_schema,
  output_schema,
  events_emitted,
  tags,
  code_path,
  is_enabled
) VALUES (
  'google_maps',
  'Google Maps',
  'Search locations and get map data',
  'integration',
  '{"type": "object", "properties": {"query": {"type": "string"}}}',
  '{"type": "object", "properties": {"results": {"type": "array"}}}',
  ARRAY['maps:searching', 'maps:result', 'maps:error'],
  ARRAY['maps', 'location', 'navigation', 'places', 'directions'],
  'src/lib/chatFunctions/integrations/googleMaps.ts',
  true
);
```

#### Step 2: Function Implementation

```typescript
// src/lib/chatFunctions/integrations/googleMaps.ts

import { chatEventBus } from '../eventBus';
import { isFunctionEnabled, isActorAllowed } from '../registry';

interface MapsInput {
  query: string;
  type?: 'search' | 'directions' | 'geocode';
}

interface MapsOutput {
  results: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  }>;
  mapUrl?: string;
}

export async function searchLocation(
  input: MapsInput,
  actorType: string
): Promise<MapsOutput> {
  // 1. Check if function is enabled
  if (!isFunctionEnabled('google_maps')) {
    throw new Error('Google Maps function is disabled');
  }
  
  // 2. Check actor permissions
  if (!isActorAllowed(actorType, 'google_maps')) {
    throw new Error('Actor not allowed to use Google Maps');
  }
  
  // 3. Emit start event
  chatEventBus.emit('maps:searching', { query: input.query });
  
  try {
    // 4. Call API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(input.query)}&key=${API_KEY}`
    );
    
    const data = await response.json();
    
    const output: MapsOutput = {
      results: data.results.map((r: any) => ({
        name: r.name,
        address: r.formatted_address,
        lat: r.geometry.location.lat,
        lng: r.geometry.location.lng,
      })),
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.query)}`,
    };
    
    // 5. Emit result event
    chatEventBus.emit('maps:result', output);
    
    return output;
    
  } catch (error) {
    // 6. Emit error event
    chatEventBus.emit('maps:error', { error: error.message });
    throw error;
  }
}
```

#### Step 3: Optional UI Container

Register in `chat_containers`:

```sql
INSERT INTO chat_containers (
  container_key,
  name,
  subscribes_to,
  function_key,
  content_type,
  render_schema,
  is_enabled
) VALUES (
  'maps_result',
  'Maps Result',
  ARRAY['maps:result'],
  'google_maps',
  'mixed',
  '{
    "type": "card",
    "className": "p-4",
    "children": [
      {
        "type": "text",
        "content": "Found {{results.length}} locations",
        "className": "font-medium"
      },
      {
        "type": "list",
        "items": "{{results}}",
        "itemTemplate": {
          "type": "row",
          "children": [
            {"type": "text", "content": "{{name}}"},
            {"type": "text", "content": "{{address}}", "className": "text-muted-foreground"}
          ]
        }
      },
      {
        "type": "button",
        "label": "Open in Maps",
        "action": {"type": "link", "url": "{{mapUrl}}"}
      }
    ]
  }',
  true
);
```

---

## Container Identifiers

Each container uses data attributes for precise targeting:

```tsx
<div
  data-container="model-response"
  data-message-index={index}
  data-request-id={requestId}
>
  {/* Container content */}
</div>
```

### Standard Container Types

| Identifier | Description |
|------------|-------------|
| `user-message` | User's input message |
| `model-response` | AI model's response |
| `action-message` | System action messages |
| `image-result` | Generated image display |
| `error-message` | Error displays |
| `thinking-indicator` | Processing indicator |
| `buttons` | Action buttons |

---

## Admin UI Management

### Functions Tab

Location: `/admin/ai-models` → Functions Tab

Capabilities:
- View all registered functions
- Enable/disable non-core functions
- Edit function metadata
- View events emitted
- Manage dependencies

### Containers Tab

Location: `/admin/ai-models` → Containers Tab

Capabilities:
- View container configurations
- Edit render schemas
- Configure event subscriptions
- Set display order

### Actors Tab

Location: `/admin/ai-models` → Actors Tab

Capabilities:
- Manage actor types
- Configure allowed functions
- Set default execution sequences
- Define context defaults

### Event Flow Visualization

Location: `/admin/ai-models` → Event Flow Tab

Displays:
- Function → Events → Container relationships
- Visual flow diagram
- Subscription mappings

---

## Best Practices

### Function Design

1. **Single Responsibility** - Each function does one thing well
2. **Idempotent** - Same input produces same output
3. **Event-Driven** - Emit events at key points
4. **Error Handling** - Structured error responses
5. **Logging** - Comprehensive logging for debugging

### Event Naming

```
{domain}:{action}

Examples:
- chat:message_sent
- image:generating
- image:generated
- maps:searching
- maps:result
```

### Container Design

1. **Reusable** - Use render_schema for flexibility
2. **Responsive** - Works on all screen sizes
3. **Accessible** - Proper ARIA labels
4. **Themed** - Uses design system tokens

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System architecture guide
- [COSMO Documentation](./COSMO.md) - AI orchestration layer
- [Testing Guide](./TESTING.md) - Testing patterns

---

*The function-first architecture enables SPORK to be infinitely extensible while maintaining clean separation of concerns.*
