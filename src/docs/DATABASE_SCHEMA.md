# Spork Database Schema Documentation

Complete database schema for the Spork AI Chat application.

## Table of Contents

- [Enums](#enums)
- [Core Tables](#core-tables)
- [Database Functions](#database-functions)
- [Storage Buckets](#storage-buckets)
- [RLS Policies Summary](#rls-policies-summary)

---

## Enums

```sql
-- User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Workspace member roles
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Subscription tiers
CREATE TYPE public.subscription_tier AS ENUM ('free', 'solo', 'team');

-- Content types for generated content
CREATE TYPE public.content_type AS ENUM ('image', 'video', 'document');

-- AI model categories
CREATE TYPE public.model_category AS ENUM (
  'general', 
  'conversation', 
  'coding', 
  'research', 
  'writing', 
  'image_generation', 
  'image_understanding', 
  'video_understanding'
);

-- Payment processors
CREATE TYPE public.payment_processor_enum AS ENUM ('stripe', 'paypal');

-- Account status
CREATE TYPE public.account_status_enum AS ENUM ('active', 'cancelled', 'suspended');

-- Subscription tier types
CREATE TYPE public.tier_type_enum AS ENUM ('trial', 'paid');

-- Subscription status
CREATE TYPE public.subscription_status_enum AS ENUM ('active', 'suspended', 'cancelled', 'expired');

-- Usage event types
CREATE TYPE public.event_type_enum AS ENUM (
  'text_generation', 
  'image_generation', 
  'video_generation', 
  'document_parsing'
);
```

---

## Core Tables

### Users & Authentication

#### profiles
Stores user profile information. Created automatically via trigger on auth.users insert.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  job_title TEXT,
  affiliate_id TEXT,
  account_status account_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of workspace collaborators" ON public.profiles
  FOR SELECT USING (
    (auth.uid() = id) OR 
    (EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.owner_id = auth.uid() AND EXISTS (
        SELECT 1 FROM workspace_activity wa
        WHERE wa.workspace_id = w.id AND wa.user_id = profiles.id
      )
    )) OR 
    (EXISTS (
      SELECT 1 FROM workspace_members wm1
      JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
      WHERE wm1.user_id = auth.uid() AND wm2.user_id = profiles.id
    ))
  );
```

#### user_roles
Stores user roles (admin, user). Uses security definer function to avoid RLS recursion.

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
```

#### user_settings
Stores user preferences and chat settings.

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  auto_chat_title BOOLEAN DEFAULT true,
  slack_message_style BOOLEAN DEFAULT false,
  send_current_date BOOLEAN DEFAULT true,
  send_ai_model_name BOOLEAN DEFAULT false,
  send_user_name BOOLEAN DEFAULT false,
  remember_chat_settings BOOLEAN DEFAULT true,
  message_voice TEXT DEFAULT 'default',
  personal_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);
```

---

### Workspaces (Spaces)

#### workspaces
Main workspace/space table for organizing user content.

```sql
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  ai_model TEXT,
  ai_instructions TEXT,
  compliance_rule TEXT,
  color_code VARCHAR(7),
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  file_quota_mb INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workspaces" ON public.workspaces
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own workspaces" ON public.workspaces
  FOR ALL USING (owner_id = auth.uid());
```

#### workspace_members
Tracks workspace membership and roles.

```sql
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role workspace_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace owners can manage members" ON public.workspace_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = workspace_members.workspace_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can view other members" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
    )
  );
```

#### workspace_invitations
Stores pending workspace invitations.

```sql
CREATE TABLE public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace admins can manage invitations" ON public.workspace_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_invitations.workspace_id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Invitees can view their invitations" ON public.workspace_invitations
  FOR SELECT USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));
```

#### workspace_activity
Logs workspace activity for audit trail and activity feeds.

```sql
CREATE TABLE public.workspace_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can log workspace activity" ON public.workspace_activity
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_activity.workspace_id AND owner_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspace_activity.workspace_id AND user_id = auth.uid())
    )
  );

CREATE POLICY "Members and owners can view workspace activity" ON public.workspace_activity
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspaces WHERE id = workspace_activity.workspace_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspace_activity.workspace_id AND user_id = auth.uid())
  );
```

---

### Chat System

#### chats
Stores user chat sessions.

```sql
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  model TEXT NOT NULL,
  persona_id UUID REFERENCES public.personas(id) ON DELETE SET NULL,
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats" ON public.chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared chats" ON public.chats
  FOR SELECT USING (auth.uid()::text IN (SELECT jsonb_array_elements_text(shared_with)));

CREATE POLICY "Users can create their own chats" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON public.chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON public.chats
  FOR DELETE USING (auth.uid() = user_id);
```

#### messages
Stores individual chat messages.

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their chats" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE id = messages.chat_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create messages in their chats" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE id = messages.chat_id AND user_id = auth.uid())
  );
```

#### folders
Chat folder organization.

```sql
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage folders in their workspaces" ON public.folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workspaces WHERE id = folders.workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can view folders in their workspaces" ON public.folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = folders.workspace_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = folders.workspace_id AND user_id = auth.uid())
      )
    )
  );
```

#### chat_folders
Junction table for chat-folder relationships.

```sql
CREATE TABLE public.chat_folders (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (chat_id, folder_id)
);

ALTER TABLE public.chat_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat folder assignments" ON public.chat_folders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM chats WHERE id = chat_folders.chat_id AND user_id = auth.uid())
  );
```

---

### Space Chat System

#### space_chats
Chats within a space/workspace context.

```sql
CREATE TABLE public.space_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title VARCHAR DEFAULT 'New Chat',
  model VARCHAR,
  persona_id UUID REFERENCES public.space_personas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chats in their spaces" ON public.space_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = space_chats.space_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_chats.space_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Space members can create chats" ON public.space_chats
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = space_chats.space_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_chats.space_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Creators can update their chats" ON public.space_chats
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Creators and space owners can delete chats" ON public.space_chats
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = space_chats.space_id AND owner_id = auth.uid())
  );
```

#### space_chat_messages
Messages within space chats.

```sql
CREATE TABLE public.space_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.space_chats(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in accessible chats" ON public.space_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM space_chats
      JOIN workspaces ON workspaces.id = space_chats.space_id
      WHERE space_chats.id = space_chat_messages.chat_id AND (
        workspaces.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_chats.space_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Space members can create messages in their chats" ON public.space_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM space_chats
      JOIN workspaces ON workspaces.id = space_chats.space_id
      WHERE space_chats.id = space_chat_messages.chat_id AND (
        workspaces.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_chats.space_id AND user_id = auth.uid())
      )
    )
  );
```

#### space_folders
Personal folder organization for spaces.

```sql
CREATE TABLE public.space_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color_code VARCHAR,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders" ON public.space_folders
  FOR ALL USING (auth.uid() = user_id);
```

---

### AI Personas

#### personas
User's personal AI personas.

```sql
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage personas in their workspaces" ON public.personas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workspaces WHERE id = personas.workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can view personas in their workspaces" ON public.personas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = personas.workspace_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = personas.workspace_id AND user_id = auth.uid())
      )
    )
  );
```

#### space_personas
Personas specific to a space.

```sql
CREATE TABLE public.space_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID,
  name VARCHAR NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon VARCHAR,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personas in their spaces" ON public.space_personas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = space_personas.space_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_personas.space_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Space members can create personas" ON public.space_personas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = space_personas.space_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = space_personas.space_id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Creators and owners can update personas" ON public.space_personas
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = space_personas.space_id AND owner_id = auth.uid())
  );

CREATE POLICY "Creators and owners can delete personas" ON public.space_personas
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM workspaces WHERE id = space_personas.space_id AND owner_id = auth.uid())
  );
```

#### persona_categories
Admin-managed persona categories.

```sql
CREATE TABLE public.persona_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.persona_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage persona categories" ON public.persona_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories" ON public.persona_categories
  FOR SELECT USING (is_active = true);
```

#### persona_templates
Admin-managed persona templates for users to discover and use.

```sql
CREATE TABLE public.persona_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.persona_categories(id) ON DELETE SET NULL,
  created_by UUID,
  name VARCHAR NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  icon VARCHAR,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_default_for_users BOOLEAN DEFAULT false,
  is_default_for_spaces BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.persona_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage persona templates" ON public.persona_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active templates" ON public.persona_templates
  FOR SELECT USING (is_active = true);
```

---

### Prompts

#### prompts
User's saved prompts.

```sql
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage prompts in their workspaces" ON public.prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = prompts.workspace_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = prompts.workspace_id AND wm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can view prompts in their workspaces" ON public.prompts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE id = prompts.workspace_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = prompts.workspace_id AND user_id = auth.uid())
      )
    )
  );
```

#### space_prompts
Prompts specific to a space.

```sql
CREATE TABLE public.space_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by UUID,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_prompts ENABLE ROW LEVEL SECURITY;

-- Similar RLS policies as space_personas
```

#### prompt_categories
Admin-managed prompt categories.

```sql
CREATE TABLE public.prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.prompt_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories" ON public.prompt_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories" ON public.prompt_categories
  FOR SELECT USING (is_active = true);
```

#### prompt_templates
Admin-managed prompt templates.

```sql
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.prompt_categories(id) ON DELETE SET NULL,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON public.prompt_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active templates" ON public.prompt_templates
  FOR SELECT USING (is_active = true);
```

---

### Space Templates

#### space_categories
Categories for space templates.

```sql
CREATE TABLE public.space_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage space categories" ON public.space_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active space categories" ON public.space_categories
  FOR SELECT USING (is_active = true);
```

#### space_templates
Pre-configured space templates.

```sql
CREATE TABLE public.space_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.space_categories(id) ON DELETE SET NULL,
  created_by UUID,
  name TEXT NOT NULL,
  description TEXT,
  color_code VARCHAR(7),
  ai_model TEXT,
  ai_instructions TEXT,
  compliance_rule TEXT,
  file_quota_mb INTEGER,
  default_personas JSONB DEFAULT '[]',
  default_prompts JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.space_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage space templates" ON public.space_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active space templates" ON public.space_templates
  FOR SELECT USING (is_active = true);
```

---

### AI Models & System Settings

#### ai_models
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage models" ON public.ai_models
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active models" ON public.ai_models
  FOR SELECT USING (is_active = true);
```

#### system_settings
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
- `global_ai_instructions` - Instructions applied to all chats
- `pre_message_config` - Pre-message context configuration

---

### Files & Knowledge Base

#### user_files
User uploaded files.

```sql
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own files" ON public.user_files
  FOR ALL USING (auth.uid() = user_id);
```

#### file_folders
File folder organization.

```sql
CREATE TABLE public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders" ON public.file_folders
  FOR ALL USING (auth.uid() = user_id);
```

#### knowledge_base
Documents for AI knowledge base.

```sql
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  content TEXT NOT NULL,
  chunks JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" ON public.knowledge_base
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload documents" ON public.knowledge_base
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their documents" ON public.knowledge_base
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their documents" ON public.knowledge_base
  FOR DELETE USING (auth.uid() = user_id);
```

#### generated_content
AI-generated images, videos, etc.

```sql
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  content_type content_type NOT NULL,
  prompt TEXT NOT NULL,
  url TEXT NOT NULL,
  model TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated content" ON public.generated_content
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create generated content" ON public.generated_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### Billing & Subscriptions

#### subscription_tiers
Subscription tier configuration.

```sql
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier_type tier_type_enum NOT NULL,
  monthly_price NUMERIC,
  monthly_token_input_quota INTEGER,
  monthly_token_output_quota INTEGER,
  daily_token_input_limit INTEGER,
  daily_token_output_limit INTEGER,
  monthly_image_quota INTEGER,
  daily_image_limit INTEGER,
  monthly_video_quota INTEGER,
  daily_video_limit INTEGER,
  monthly_document_parsing_quota INTEGER,
  monthly_file_storage_quota_mb INTEGER,
  allowed_models JSONB,
  trial_duration_days INTEGER,
  trial_usage_based BOOLEAN DEFAULT false,
  credit_price_per_unit NUMERIC,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription tiers" ON public.subscription_tiers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);
```

#### user_subscriptions
User subscription status.

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier_id UUID REFERENCES public.subscription_tiers(id) ON DELETE SET NULL,
  status subscription_status_enum NOT NULL DEFAULT 'active',
  payment_processor payment_processor_enum,
  external_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

#### usage_tracking
Period-based usage counters.

```sql
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  tokens_input_used INTEGER DEFAULT 0,
  tokens_output_used INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  videos_generated INTEGER DEFAULT 0,
  documents_parsed INTEGER DEFAULT 0,
  daily_tokens_input INTEGER DEFAULT 0,
  daily_tokens_output INTEGER DEFAULT 0,
  daily_images INTEGER DEFAULT 0,
  daily_videos INTEGER DEFAULT 0,
  daily_reset_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON public.usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON public.usage_tracking
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

#### usage_logs
Detailed usage event logging.

```sql
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID,
  action_type TEXT NOT NULL,
  model_id TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Enable realtime for live analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_logs;

CREATE POLICY "Users can view their own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs" ON public.usage_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (true);
```

#### credit_packages
One-time credit purchase packages.

```sql
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  credit_type TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price_usd NUMERIC NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage credit packages" ON public.credit_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active credit packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);
```

#### credit_purchases
User credit purchase history.

```sql
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.credit_packages(id) ON DELETE SET NULL,
  credit_type TEXT DEFAULT 'tokens',
  credits_purchased INTEGER NOT NULL,
  credits_remaining INTEGER NOT NULL,
  amount_paid NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_processor payment_processor_enum,
  external_transaction_id TEXT,
  discount_code TEXT,
  discount_amount NUMERIC,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" ON public.credit_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit purchases" ON public.credit_purchases
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage credit purchases" ON public.credit_purchases
  FOR ALL USING (auth.uid() IS NOT NULL);
```

#### payment_processors
Payment processor configuration.

```sql
CREATE TABLE public.payment_processors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  processor_type payment_processor_enum NOT NULL,
  config JSONB DEFAULT '{}',
  webhook_url TEXT,
  supports_subscriptions BOOLEAN DEFAULT true,
  supports_one_time_payments BOOLEAN DEFAULT true,
  supports_webhooks BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment processors" ON public.payment_processors
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

#### discount_codes
Promotional discount codes.

```sql
CREATE TABLE public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active discount codes" ON public.discount_codes
  FOR SELECT USING (
    is_active = true AND 
    valid_from <= now() AND 
    (valid_until IS NULL OR valid_until >= now())
  );
```

#### budget_alerts
Workspace budget alert configuration.

```sql
CREATE TABLE public.budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL,
  threshold_percentage INTEGER DEFAULT 80,
  is_enabled BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all budget alerts" ON public.budget_alerts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Workspace members can view their alerts" ON public.budget_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = budget_alerts.workspace_id AND user_id = auth.uid()
    )
  );
```

#### pricing_tiers (legacy)
Legacy pricing tier configuration.

```sql
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name subscription_tier NOT NULL UNIQUE,
  monthly_chat_tokens INTEGER DEFAULT 100000,
  monthly_image_generations INTEGER DEFAULT 10,
  monthly_video_generations INTEGER DEFAULT 2,
  monthly_document_parses INTEGER DEFAULT 20,
  monthly_cost_limit NUMERIC DEFAULT 10.00,
  price_per_month NUMERIC DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pricing tiers" ON public.pricing_tiers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view pricing tiers" ON public.pricing_tiers
  FOR SELECT USING (true);
```

---

### Email System

#### email_providers
Email service provider configuration.

```sql
CREATE TABLE public.email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  api_endpoint TEXT,
  sdk_package TEXT,
  documentation_url TEXT,
  config_schema JSONB DEFAULT '[]',
  config_values JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email providers" ON public.email_providers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view email providers" ON public.email_providers
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

#### email_templates
Email template management with versioning.

```sql
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

#### email_system_event_types
Available system events that can trigger emails.

```sql
CREATE TABLE public.email_system_event_types (
  event_type TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  available_variables JSONB DEFAULT '[]',
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_system_event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view event types" ON public.email_system_event_types
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

#### email_rules
Automated email rule configuration.

```sql
CREATE TABLE public.email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL DEFAULT 'user',
  recipient_emails TEXT[],
  cc_emails TEXT[],
  bcc_emails TEXT[],
  conditions JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 100,
  send_immediately BOOLEAN DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  max_sends_per_user_per_day INTEGER,
  max_sends_per_user_per_week INTEGER,
  deduplicate_window_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  trigger_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email rules" ON public.email_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

#### email_rule_logs
Logs for email rule executions.

```sql
CREATE TABLE public.email_rule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.email_rules(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_id TEXT,
  event_payload JSONB,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  processing_time_ms INTEGER,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.email_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rule logs" ON public.email_rule_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert rule logs" ON public.email_rule_logs
  FOR INSERT WITH CHECK (true);
```

#### email_logs
General email sending logs.

```sql
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.email_providers(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);
```

---

## Database Functions

### has_role
Security definer function to check user roles without RLS recursion.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### is_workspace_member
Security definer function to check workspace membership.

```sql
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid AND user_id = user_uuid
  );
$$;
```

### handle_updated_at
Trigger function for automatic timestamp updates.

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### handle_new_user
Trigger function for new user setup.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  workspace_id uuid;
  default_user_persona RECORD;
  default_space_persona RECORD;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Create default workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (new.id, 'My Workspace')
  RETURNING id INTO workspace_id;
  
  -- Fetch default persona template for new users
  SELECT * INTO default_user_persona 
  FROM persona_templates 
  WHERE is_default_for_users = true AND is_active = true 
  LIMIT 1;
  
  -- If no default found, use fallback
  IF default_user_persona.id IS NULL THEN
    default_user_persona.name := 'General Assistant';
    default_user_persona.description := 'Helpful AI assistant for everyday tasks';
    default_user_persona.system_prompt := 'You are a helpful, friendly AI assistant. Provide clear, accurate, and concise responses to user questions.';
    default_user_persona.icon := NULL;
  END IF;
  
  -- Create default persona in user's personal library
  INSERT INTO public.personas (workspace_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    default_user_persona.name,
    default_user_persona.description,
    default_user_persona.system_prompt,
    default_user_persona.icon,
    true,
    new.id
  );
  
  -- Fetch default persona template for new spaces
  SELECT * INTO default_space_persona 
  FROM persona_templates 
  WHERE is_default_for_spaces = true AND is_active = true 
  LIMIT 1;
  
  -- If no default found, use same as user default
  IF default_space_persona.id IS NULL THEN
    default_space_persona := default_user_persona;
  END IF;
  
  -- Create default persona for workspace's Space AI Config
  INSERT INTO public.space_personas (space_id, name, description, system_prompt, icon, is_default, created_by)
  VALUES (
    workspace_id,
    default_space_persona.name,
    default_space_persona.description,
    default_space_persona.system_prompt,
    default_space_persona.icon,
    true,
    new.id
  );
  
  -- Increment use counts if templates exist
  IF default_user_persona.id IS NOT NULL THEN
    UPDATE persona_templates SET use_count = use_count + 1 WHERE id = default_user_persona.id;
  END IF;
  IF default_space_persona.id IS NOT NULL AND default_space_persona.id != default_user_persona.id THEN
    UPDATE persona_templates SET use_count = use_count + 1 WHERE id = default_space_persona.id;
  END IF;
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### handle_user_settings_updated_at
Trigger function for user settings timestamps.

```sql
CREATE OR REPLACE FUNCTION public.handle_user_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

## Storage Buckets

### knowledge-base
Private bucket for knowledge base documents.

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge-base', 'knowledge-base', false);

-- Policies
CREATE POLICY "Users can upload knowledge base files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their knowledge base files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their knowledge base files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### user-files
Private bucket for user file uploads.

```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-files', 'user-files', false);

-- Policies
CREATE POLICY "Users can upload their files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own + collaborators | System only | Own | No |
| user_roles | Own + admin | Admin | Admin | Admin |
| user_settings | Own | Own | Own | Own |
| workspaces | Own + member | Own | Own | Own |
| workspace_members | Member | Owner | Owner | Owner |
| workspace_invitations | Invitee + admin | Admin | Admin | Admin |
| workspace_activity | Member | Member | No | No |
| chats | Own + shared | Own | Own | Own |
| messages | Chat owner | Chat owner | No | No |
| folders | Workspace member | Owner | Owner | Owner |
| personas | Workspace member | Owner | Owner | Owner |
| persona_templates | Active | Admin | Admin | Admin |
| prompts | Workspace member | Member | Member | Member |
| ai_models | Active | Admin | Admin | Admin |
| system_settings | All | Admin | Admin | Admin |
| user_files | Own | Own | Own | Own |
| knowledge_base | Own | Own | Own | Own |
| subscription_tiers | Active | Admin | Admin | Admin |
| user_subscriptions | Own + admin | Admin | Admin | Admin |
| usage_logs | Own + admin | Service | No | No |
| email_providers | Admin | Admin | Admin | Admin |
| email_templates | Admin | Admin | Admin | Admin |
| email_rules | Admin | Admin | Admin | Admin |
