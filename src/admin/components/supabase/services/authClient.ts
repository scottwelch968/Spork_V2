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
    
    // Fetch roles for all users
    const userIds = data.users.map(u => u.id);
    let rolesMap: Record<string, string[]> = {};
    
    if (userIds.length > 0) {
      try {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesData) {
          rolesMap = rolesData.reduce((acc, r) => {
            if (!acc[r.user_id]) acc[r.user_id] = [];
            acc[r.user_id].push(r.role);
            return acc;
          }, {} as Record<string, string[]>);
        }
      } catch (roleError) {
        console.warn('Failed to fetch user roles:', roleError);
      }
    }
    
    // Attach roles to users
    const usersWithRoles = data.users.map(user => ({
      ...user,
      roles: rolesMap[user.id] || []
    })) as SupabaseUser[];
    
    return { users: usersWithRoles, total: (data as any).total ?? 0 };
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
  },

  async createUser(email: string, password: string, userMetadata?: Record<string, any>, role?: 'admin' | 'user') {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: userMetadata || {}
    });
    if (error) throw error;
    
    // Assign role if provided
    if (role && data.user) {
      try {
        await supabase
          .from('user_roles')
          .upsert({
            user_id: data.user.id,
            role: role
          }, {
            onConflict: 'user_id,role'
          });
      } catch (roleError) {
        console.warn('Failed to assign role:', roleError);
        // Don't fail the user creation if role assignment fails
      }
    }
    
    return data.user as unknown as SupabaseUser;
  }
};

