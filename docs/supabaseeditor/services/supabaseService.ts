import { SupabaseCredentials, EdgeFunction, AuthConfig } from '../types';

// Use local proxy in development to avoid CORS issues with Supabase Management API
// In production, this assumes a similar proxy exists or CORS is handled
const BASE_URL = (import.meta as any).env?.DEV ? '/api/supabase/v1' : 'https://api.supabase.com/v1';

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export const supabaseService = {
  async listFunctions(creds: SupabaseCredentials): Promise<EdgeFunction[]> {
    try {
      const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions`, {
        method: 'GET',
        headers: getHeaders(creds.accessToken),
      });
      if (!response.ok) throw new Error(`Failed to fetch functions: ${response.statusText}`);
      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
         throw new Error('Network error. If running locally, ensure Vite proxy is configured for CORS.');
      }
      throw error;
    }
  },

  async getFunction(creds: SupabaseCredentials, slug: string): Promise<EdgeFunction> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions/${slug}`, {
      method: 'GET',
      headers: getHeaders(creds.accessToken),
    });
    if (!response.ok) throw new Error(`Failed to fetch function details: ${response.statusText}`);
    return response.json();
  },

  async createFunction(creds: SupabaseCredentials, func: { name: string, slug: string, verify_jwt: boolean, body: string }): Promise<EdgeFunction> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions`, {
      method: 'POST',
      headers: getHeaders(creds.accessToken),
      body: JSON.stringify({
        name: func.name,
        slug: func.slug,
        verify_jwt: func.verify_jwt,
        body: func.body
      })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Failed to create function: ${err.message || response.statusText}`);
    }
    return response.json();
  },

  async updateFunction(creds: SupabaseCredentials, slug: string, updates: { name?: string, verify_jwt?: boolean, body?: string }): Promise<EdgeFunction> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions/${slug}`, {
      method: 'PATCH',
      headers: getHeaders(creds.accessToken),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Failed to update function: ${err.message || response.statusText}`);
    }
    return response.json();
  },

  async deleteFunction(creds: SupabaseCredentials, slug: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions/${slug}`, {
      method: 'DELETE',
      headers: getHeaders(creds.accessToken),
    });
    if (!response.ok) throw new Error(`Failed to delete function: ${response.statusText}`);
  },

  async getAuthConfig(creds: SupabaseCredentials): Promise<AuthConfig> {
    try {
      const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/config/auth`, {
        method: 'GET',
        headers: getHeaders(creds.accessToken),
      });
      if (!response.ok) throw new Error(`Failed to fetch auth config: ${response.statusText}`);
      return response.json();
    } catch (error: any) {
       if (error.message === 'Failed to fetch') {
         throw new Error('Network error. This is likely a CORS issue connecting to Supabase Management API.');
      }
      throw error;
    }
  },

  async updateAuthConfig(creds: SupabaseCredentials, config: Partial<AuthConfig>): Promise<AuthConfig> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/config/auth`, {
      method: 'PATCH',
      headers: getHeaders(creds.accessToken),
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error(`Failed to update auth config: ${response.statusText}`);
    return response.json();
  },

  async executeSql(creds: SupabaseCredentials, query: string): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/query`, {
      method: 'POST',
      headers: getHeaders(creds.accessToken),
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(`SQL Error: ${err.message || response.statusText}`);
    }
    return response.json();
  }
};