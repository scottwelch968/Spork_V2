// SporkProject type definition - used across editor components
export interface SporkProject {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  owner_type?: string;
  github_repo?: string | null;
  github_repo_url?: string | null;
  github_branch?: string | null;
  github_token?: string | null;
  current_branch?: string | null;
  supabase_url?: string | null;
  supabase_anon_key?: string | null;
  supabase_service_role_key?: string | null;
  ai_instructions?: string | null;
  default_model?: string | null;
  is_active?: boolean;
  is_system_sandbox?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProjectData {
  id: string;
  name?: string;
  description?: string | null;
  github_repo?: string | null;
  github_repo_url?: string | null;
  github_branch?: string | null;
  github_token?: string | null;
  current_branch?: string | null;
  supabase_url?: string | null;
  supabase_anon_key?: string | null;
  supabase_service_role_key?: string | null;
  ai_instructions?: string | null;
  default_model?: string | null;
}
