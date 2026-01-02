import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCredentials, SupabaseUser } from '../types';

let supabase: SupabaseClient | null = null;

export const authClient = {
  init(creds: SupabaseCredentials) {
    if (!creds.serviceRoleKey) return null;
    const url = `https://${creds.projectRef}.supabase.co`;
    supabase = createClient(url, creds.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    return supabase;
  },

  isInitialized() {
    return !!supabase;
  },

  async listUsers(page = 1, perPage = 50): Promise<{ users: SupabaseUser[], total: number }> {
    if (!supabase) throw new Error("Supabase client not initialized. Service Role Key required.");
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) throw error;
    return { users: data.users as unknown as SupabaseUser[], total: (data as any).total ?? 0 };
  },

  async deleteUser(userId: string) {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  },
  
  async inviteUser(email: string) {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      return data.user as unknown as SupabaseUser;
  }
};