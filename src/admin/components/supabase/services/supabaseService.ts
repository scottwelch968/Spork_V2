import { SupabaseCredentials, EdgeFunction, AuthConfig } from '../types';

// Use local proxy in development to avoid CORS issues with Supabase Management API
// In production, this assumes a similar proxy exists or CORS is handled
const BASE_URL = (import.meta as any).env?.DEV ? '/api/supabase/v1' : 'https://api.supabase.com/v1';

const getHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Safe JSON parser that handles empty responses and HTML errors
const safeJsonParse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    return null;
  }
  
  // Check if response is HTML (usually means CORS/proxy error)
  if (contentType.includes('text/html') || text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
    throw new Error('Received HTML instead of JSON. This usually indicates a CORS issue or missing proxy configuration. Please check your Vite proxy settings for /api/supabase/v1');
  }
  
  // Only try to parse if content-type suggests JSON
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    // If it's not JSON content-type but looks like JSON, try parsing anyway
    if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) {
      throw new Error(`Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`);
    }
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    // Return the text as-is if it's not JSON, or throw with context
    throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`);
  }
};

// Helper to get error message from response
const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) return response.statusText;
    try {
      const data = JSON.parse(text);
      return data.message || data.error?.message || text;
    } catch {
      return text;
    }
  } catch {
    return response.statusText;
  }
};

export const supabaseService = {
  async listFunctions(creds: SupabaseCredentials): Promise<EdgeFunction[]> {
    try {
      const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions`, {
        method: 'GET',
        headers: getHeaders(creds.accessToken),
      });
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('CORS/Proxy Error: Received HTML response. Please configure Vite proxy for /api/supabase/v1 or use a CORS-enabled backend.');
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch functions: ${errorText || response.statusText}`);
      }
      const data = await safeJsonParse(response);
      return data || [];
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.message.includes('CORS')) {
         throw new Error('Network/CORS error. If running locally, ensure Vite proxy is configured for /api/supabase/v1 in vite.config.ts');
      }
      throw error;
    }
  },

  async getFunction(creds: SupabaseCredentials, slug: string): Promise<EdgeFunction> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions/${slug}`, {
      method: 'GET',
      headers: getHeaders(creds.accessToken),
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to fetch function details: ${errorText || response.statusText}`);
    }
    return await safeJsonParse(response) || {};
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
        const errorMessage = await getErrorMessage(response);
        throw new Error(`Failed to create function: ${errorMessage}`);
    }
    return await safeJsonParse(response) || {};
  },

  async updateFunction(creds: SupabaseCredentials, slug: string, updates: { name?: string, verify_jwt?: boolean, body?: string }): Promise<EdgeFunction> {
    const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions/${slug}`, {
      method: 'PATCH',
      headers: getHeaders(creds.accessToken),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
        const errorMessage = await getErrorMessage(response);
        throw new Error(`Failed to update function: ${errorMessage}`);
    }
    return await safeJsonParse(response) || {};
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
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch auth config: ${errorText || response.statusText}`);
      }
      return await safeJsonParse(response) || {};
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
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to update auth config: ${errorText || response.statusText}`);
    }
    return await safeJsonParse(response) || {};
  },

  async executeSql(creds: SupabaseCredentials, query: string): Promise<any[]> {
    // SQL queries must use the Supabase client with service role key, not Management API
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required to execute SQL queries. Please add it in Settings.');
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = `https://${creds.projectRef}.supabase.co`;
      const supabase = createClient(url, creds.serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Use PostgREST REST API to execute SQL via RPC
      // First, try to use a generic exec_sql function if it exists
      // Otherwise, we'll need to parse the query and use appropriate methods
      const trimmedQuery = query.trim();
      
      // For information_schema queries, we can use the REST API directly
      // by accessing the information_schema tables through PostgREST
      if (trimmedQuery.toUpperCase().includes('INFORMATION_SCHEMA')) {
        // Try to execute via REST API using the query parameter
        // Note: This requires the query to be accessible via PostgREST
        // For information_schema, we can try using the REST endpoint
        const response = await fetch(`${url}/rest/v1/`, {
          method: 'GET',
          headers: {
            'apikey': creds.serviceRoleKey,
            'Authorization': `Bearer ${creds.serviceRoleKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        });

        // Since direct SQL execution isn't supported, we need to use RPC
        // Create a simple RPC call wrapper
        // For now, let's use a workaround: execute via a custom RPC function
        // If that doesn't exist, we'll need to parse the query
        
        // Try using pg_catalog or information_schema via REST
        // Actually, the best approach is to create a helper that converts
        // information_schema queries to use the Supabase client's query builder
        // But for now, let's use a direct REST call to execute the query
        
        // Use the Supabase REST API with raw SQL execution
        // This requires a custom function, but we can try the REST endpoint
        throw new Error('Direct SQL execution requires a custom database function. For schema queries, please use the built-in schema viewer.');
      }

      // For other queries, try using RPC
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      if (error) {
        // If RPC doesn't exist, provide a helpful error message
        throw new Error(`SQL execution failed: ${error.message}. Note: You may need to create a custom database function to execute SQL queries, or use the Supabase SQL Editor.`);
      }

      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (error: any) {
      throw new Error(`SQL Error: ${error.message || 'Failed to execute SQL query. Make sure your Service Role Key is valid and you have the necessary permissions.'}`);
    }
  },

  async testConnection(creds: SupabaseCredentials): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test Management API access with a simple call
      const response = await fetch(`${BASE_URL}/projects/${creds.projectRef}/functions`, {
        method: 'GET',
        headers: getHeaders(creds.accessToken),
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error?.message || errorText;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch {
          // Use statusText as fallback
        }
        return {
          success: false,
          message: `Connection failed: ${errorMessage} (${response.status})`,
        };
      }

      // If service role key is provided, also test it
      if (creds.serviceRoleKey) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const url = `https://${creds.projectRef}.supabase.co`;
          const supabase = createClient(url, creds.serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });
          
          // Test by trying to list buckets (lightweight operation)
          const { error } = await supabase.storage.listBuckets();
          if (error) {
            return {
              success: true,
              message: 'Management API: ✓ Connected | Service Role Key: ✗ Invalid',
              details: { managementApi: true, serviceRoleKey: false, serviceRoleError: error.message }
            };
          }
          
          return {
            success: true,
            message: 'Management API: ✓ Connected | Service Role Key: ✓ Valid',
            details: { managementApi: true, serviceRoleKey: true }
          };
        } catch (serviceError: any) {
          return {
            success: true,
            message: 'Management API: ✓ Connected | Service Role Key: ✗ Error testing',
            details: { managementApi: true, serviceRoleKey: false, serviceRoleError: serviceError.message }
          };
        }
      }

      return {
        success: true,
        message: 'Management API: ✓ Connected (Service Role Key not provided)',
        details: { managementApi: true, serviceRoleKey: null }
      };
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        return {
          success: false,
          message: 'Network error. Check CORS settings or network connection.',
        };
      }
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
      };
    }
  }
};

