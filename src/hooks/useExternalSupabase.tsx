import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

interface ExternalSupabaseConfig {
  supabase_url?: string | null;
  supabase_anon_key?: string | null;
  supabase_service_role_key?: string | null;
}

/**
 * Creates a Supabase client for external project storage.
 * Requires valid credentials - throws error if not provided.
 */
export function createExternalSupabaseClient(config: ExternalSupabaseConfig): SupabaseClient {
  if (!config.supabase_url || !config.supabase_anon_key) {
    throw new Error('External Supabase configuration is required. Please configure supabase_url and supabase_anon_key.');
  }
  
  return createClient(config.supabase_url, config.supabase_anon_key, {
    auth: {
      persistSession: false, // Don't persist external sessions
      autoRefreshToken: false,
    }
  });
}

/**
 * Hook to get a Supabase client for a project.
 * Requires external Supabase configuration - no fallback.
 */
export function useExternalSupabase(config: ExternalSupabaseConfig | null) {
  const client = useMemo(() => {
    if (!config) {
      throw new Error('External Supabase configuration is required. Please configure your project with Supabase credentials.');
    }
    return createExternalSupabaseClient(config);
  }, [config?.supabase_url, config?.supabase_anon_key]);

  const isExternal = !!(config?.supabase_url && config?.supabase_anon_key);

  return { client, isExternal };
}

/**
 * Check if a project has external Supabase configured
 */
export function hasExternalSupabase(project: ExternalSupabaseConfig | null): boolean {
  return !!(project?.supabase_url && project?.supabase_anon_key);
}
