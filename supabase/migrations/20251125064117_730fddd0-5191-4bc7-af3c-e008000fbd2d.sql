-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create enum types
create type public.app_role as enum ('admin', 'user');
create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');
create type public.subscription_tier as enum ('free', 'solo', 'team');
create type public.content_type as enum ('image', 'video', 'document');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Create user_roles table (separate for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create workspaces table
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  subscription_tier subscription_tier not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- Create workspace_members table
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Create personas table
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  system_prompt text not null,
  icon text,
  is_default boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personas enable row level security;

-- Create chats table
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New Chat',
  persona_id uuid references public.personas(id) on delete set null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chats enable row level security;

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Create prompts table
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prompts enable row level security;

-- Create folders table
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  color text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

-- Create chat_folders table (many-to-many)
create table public.chat_folders (
  chat_id uuid references public.chats(id) on delete cascade not null,
  folder_id uuid references public.folders(id) on delete cascade not null,
  primary key (chat_id, folder_id)
);

alter table public.chat_folders enable row level security;

-- Create generated_content table
create table public.generated_content (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type content_type not null,
  prompt text not null,
  url text not null,
  model text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.generated_content enable row level security;

-- Create usage_logs table
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  model text,
  tokens_used integer,
  cost numeric(10, 4),
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_logs enable row level security;

-- RLS Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users can view workspaces they belong to"
  on public.workspaces for select
  using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.workspace_members
      where workspace_id = id and user_id = auth.uid()
    )
  );

create policy "Owners can update their workspaces"
  on public.workspaces for update
  using (auth.uid() = owner_id);

create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

create policy "Users can view workspace members"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and (owner_id = auth.uid() or
        exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = workspace_id and wm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can view personas in their workspaces"
  on public.personas for select
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and (owner_id = auth.uid() or
        exists (
          select 1 from public.workspace_members
          where workspace_id = personas.workspace_id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage personas in their workspaces"
  on public.personas for all
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "Users can view their own chats"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Users can create their own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chats"
  on public.chats for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chats"
  on public.chats for delete
  using (auth.uid() = user_id);

create policy "Users can view messages from their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where id = chat_id and user_id = auth.uid()
    )
  );

create policy "Users can create messages in their chats"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where id = chat_id and user_id = auth.uid()
    )
  );

create policy "Users can view prompts in their workspaces"
  on public.prompts for select
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and (owner_id = auth.uid() or
        exists (
          select 1 from public.workspace_members
          where workspace_id = prompts.workspace_id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage prompts in their workspaces"
  on public.prompts for all
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and (owner_id = auth.uid() or
        exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = prompts.workspace_id and wm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can view folders in their workspaces"
  on public.folders for select
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and (owner_id = auth.uid() or
        exists (
          select 1 from public.workspace_members
          where workspace_id = folders.workspace_id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can manage folders in their workspaces"
  on public.folders for all
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

create policy "Users can manage chat folder assignments"
  on public.chat_folders for all
  using (
    exists (
      select 1 from public.chats
      where id = chat_id and user_id = auth.uid()
    )
  );

create policy "Users can view their own generated content"
  on public.generated_content for select
  using (auth.uid() = user_id);

create policy "Users can create generated content"
  on public.generated_content for insert
  with check (auth.uid() = user_id);

create policy "Admins can view all usage logs"
  on public.usage_logs for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Workspace owners can view their workspace logs"
  on public.usage_logs for select
  using (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

-- Create trigger function for updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

create trigger set_personas_updated_at
  before update on public.personas
  for each row execute function public.handle_updated_at();

create trigger set_chats_updated_at
  before update on public.chats
  for each row execute function public.handle_updated_at();

create trigger set_prompts_updated_at
  before update on public.prompts
  for each row execute function public.handle_updated_at();

-- Create trigger function for new user setup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_id uuid;
begin
  -- Insert profile
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Create default workspace
  insert into public.workspaces (owner_id, name)
  values (new.id, 'My Workspace')
  returning id into workspace_id;
  
  -- Assign user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();