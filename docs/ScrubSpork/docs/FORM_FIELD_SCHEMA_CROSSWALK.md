# Form-field → Schema Crosswalk (Durable vs UI-only)
This maps Spork admin forms to likely COSMO persistence targets.

## Durable system state vs UI-only hints
**Durable system state** = affects routing/tooling/execution/cost/determinism. Persist + audit.
**Metadata** = helpful for humans; safe to persist but not execution-critical.
**UI-only** = presentation, filters, dialog state; do not persist.

## Admin Models → `public.ai_models` (from Spork schema docs)
Fields observed in ModelForm (via `formData.*`):
- `best_for` — Durable
- `best_for_description` — Metadata
- `context_length` — Durable
- `default_frequency_penalty` — Durable
- `default_max_tokens` — Durable
- `default_presence_penalty` — Durable
- `default_temperature` — Durable
- `default_top_k` — Durable
- `default_top_p` — Durable
- `description` — Metadata
- `display_order` — Durable
- `is_active` — Durable
- `is_default` — Durable
- `is_free` — Durable
- `max_completion_tokens` — Durable
- `model_id` — Durable
- `name` — Durable
- `pricing_completion` — Durable
- `pricing_prompt` — Durable
- `provider` — Durable
- `rate_limit_rpm` — Durable
- `rate_limit_tpm` — Durable
- `requires_api_key` — Durable

Schema reference (excerpt):
```sql
AI model configuration and metadata.

```sql
CREATE TABLE public.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  description TEXT,
  best_for model_category NOT NULL DEFAULT 'general',
  best_for_description TEXT,
  context_length INTEGER DEFAULT 128000,
  max_completion_tokens INTEGER DEFAULT 4096,
  input_modalities JSONB DEFAULT '["text"]',
  output_modalities JSONB DEFAULT '["text"]',
  pricing_prompt NUMERIC DEFAULT 0,
  pricing_completion NUMERIC DEFAULT 0,
  default_temperature NUMERIC DEFAULT 0.7,
  default_top_p NUMERIC DEFAULT 0.95,
  default_top_k INTEGER DEFAULT 0,
  default_max_tokens INTEGER DEFAULT 2048,
  default_frequency_penalty NUMERIC DEFAULT 0,
  default_presence_penalty NUMERIC DEFAULT 0,
  supported_parameters JSONB DEFAULT '["temperature", "top_p", "max_tokens"]',
  rate_limit_rpm INTEGER DEFAULT 60,
  rate_limit_tpm INTEGER DEFAULT 100000,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  requires_api_key BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE
```

## Default Model Config → `public.system_settings` (JSON settings)
Fields observed in ModelConfigTab:
- `default-model` — Durable (stored as setting keys / JSON)
- `fallback-model` — Durable (stored as setting keys / JSON)
- `image-model` — Durable (stored as setting keys / JSON)
- `kb-model` — Durable (stored as setting keys / JSON)

Schema reference (excerpt):
```sql
Global system configuration.

```sql
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view system settings" ON public.system_settings
  FOR SELECT USING (true);
```

**Key system settings:**
- `default_model` - Default AI model for chat
- `fallback_model` - Fallback model when primary fails
- `image_model` - Model for image generation
- `knowledge_base_model` - Model for knowledge base queries
- `video_model` - Model for video generation
- `global_ai_instructions
```

## Pre-Message / Context Injection → `public.system_settings`
Fields observed in PreMessageConfigTab:
- `auto-select-model` — Durable (affects context assembly; must be logged)
- `include-ai-instructions` — Durable (affects context assembly; must be logged)
- `include-files` — Durable (affects context assembly; must be logged)
- `include-history` — Durable (affects context assembly; must be logged)
- `include-images` — Durable (affects context assembly; must be logged)
- `include-knowledge-base` — Durable (affects context assembly; must be logged)
- `include-persona` — Durable (affects context assembly; must be logged)
- `include-personal-context` — Durable (affects context assembly; must be logged)
- `max-history` — Durable (affects context assembly; must be logged)

## Fallback Models → `public.fallback_models` (if present) or `system_settings`
Fields observed in FallbackModelForm:
- `context_length` — Durable
- `default_frequency_penalty` — Durable
- `default_max_tokens` — Durable
- `default_presence_penalty` — Durable
- `default_temperature` — Durable
- `default_top_k` — Durable
- `default_top_p` — Durable
- `description` — Metadata
- `display_order` — Durable
- `icon_url` — Durable
- `max_completion_tokens` — Durable
- `model_id` — Durable
- `name` — Metadata
- `pricing_completion` — Durable
- `pricing_prompt` — Durable
- `provider` — Durable
- `rate_limit_rpm` — Durable
- `rate_limit_tpm` — Durable

