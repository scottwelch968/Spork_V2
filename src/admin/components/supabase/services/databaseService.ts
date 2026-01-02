import { SupabaseCredentials } from '../types';
import { createClient } from '@supabase/supabase-js';

export const databaseService = {
  async getTables(creds: SupabaseCredentials): Promise<{ table_name: string }[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required to view database schema');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      // Query information_schema using a database function
      const { data, error } = await supabase.rpc('get_schema_columns');

      if (error) {
        // If the function doesn't exist, try alternative approach
        if (error.message?.includes('function') || error.code === '42883') {
          // Try REST API fallback instead of throwing
          try {
            const response = await fetch(`${url}/rest/v1/information_schema.tables?table_schema=eq.public&table_type=eq.BASE TABLE&select=table_name`, {
              headers: {
                'apikey': creds.serviceRoleKey,
                'Authorization': `Bearer ${creds.serviceRoleKey}`,
              }
            });

            if (response.ok) {
              const data = await response.json();
              return Array.isArray(data) ? data : [];
            }
          } catch {
            // Both methods failed, return empty array
          }
          return []; // Return empty array instead of throwing
        }
        // For other errors, try REST API fallback
        try {
          const response = await fetch(`${url}/rest/v1/information_schema.tables?table_schema=eq.public&table_type=eq.BASE TABLE&select=table_name`, {
            headers: {
              'apikey': creds.serviceRoleKey,
              'Authorization': `Bearer ${creds.serviceRoleKey}`,
            }
          });

          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }
        } catch {
          // Fallback failed
        }
        return []; // Return empty array instead of throwing
      }

      // Extract unique table names from columns
      const tableNames = new Set<string>();
      if (Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.table_name) {
            tableNames.add(row.table_name);
          }
        });
      }

      return Array.from(tableNames).map(name => ({ table_name: name }));
    } catch (err: any) {
      // If RPC fails, try using REST API to query information_schema directly
      // This is a fallback that might work if the schema is exposed
      try {
        const response = await fetch(`${url}/rest/v1/information_schema.tables?table_schema=eq.public&table_type=eq.BASE TABLE&select=table_name`, {
          headers: {
            'apikey': creds.serviceRoleKey,
            'Authorization': `Bearer ${creds.serviceRoleKey}`,
          }
        });

        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        }
      } catch {
        // Fallback failed, return empty array
      }
      
      return []; // Return empty array instead of throwing
    }
  },

  async getTableColumns(creds: SupabaseCredentials, tableName: string): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Use the get_schema_columns function
    const { data, error } = await supabase.rpc('get_schema_columns');

    if (error) {
      throw error;
    }

    // Filter by table name
    return (data || []).filter((row: any) => row.table_name === tableName);
  },

  async getTableConstraints(creds: SupabaseCredentials, tableName: string): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase.rpc('get_table_constraints', { 
        table_name: tableName 
      });

      if (error) {
        return []; // Return empty if function doesn't exist
      }

      return data || [];
    } catch {
      return []; // Return empty if function doesn't exist
    }
  },

  async getRLSPolicies(creds: SupabaseCredentials, tableName: string): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase.rpc('get_rls_policies', {
        table_name: tableName
      });

      if (error) {
        return []; // Return empty if function doesn't exist
      }

      return (data || []).filter((policy: any) => policy.tablename === tableName);
    } catch {
      return []; // Return empty if function doesn't exist
    }
  },

  async getEnumTypes(creds: SupabaseCredentials): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase.rpc('get_enum_types');
      if (error) {
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async getDatabaseFunctions(creds: SupabaseCredentials): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase.rpc('get_db_functions');
      if (error) {
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async getRLSStatus(creds: SupabaseCredentials): Promise<any[]> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      const { data, error } = await supabase.rpc('get_rls_status');
      if (error) {
        return [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  async runParityTest(creds: SupabaseCredentials): Promise<{
    tables: { actual: string[], expected: string[], missing: string[], extra: string[] };
    enums: { actual: any[], expected: any[], missing: any[], extra: any[] };
    functions: { actual: string[], expected: string[], missing: string[], extra: string[] };
    rlsStatus: { table: string, enabled: boolean }[];
    summary: { totalTables: number, missingTables: number, extraTables: number, totalEnums: number, missingEnums: number, totalFunctions: number, missingFunctions: number };
    warnings?: string[];
  }> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required for parity test');
    }

    // Expected schema from documentation
    const expectedTables = [
      'profiles', 'user_roles', 'user_settings', 'workspaces', 'workspace_members',
      'workspace_invitations', 'workspace_activity', 'chats', 'messages', 'folders',
      'chat_folders', 'space_chats', 'space_chat_messages', 'space_folders',
      'personas', 'space_personas', 'persona_categories', 'persona_templates',
      'prompts', 'space_prompts', 'prompt_categories', 'prompt_templates',
      'space_categories', 'space_templates', 'ai_models', 'system_settings',
      'user_files', 'file_folders', 'knowledge_base', 'generated_content',
      'subscription_tiers', 'user_subscriptions', 'usage_tracking', 'usage_logs',
      'credit_packages', 'credit_purchases', 'payment_processors', 'discount_codes',
      'budget_alerts', 'pricing_tiers', 'email_providers', 'email_templates',
      'email_system_event_types', 'email_rules', 'email_rule_logs', 'email_logs'
    ];

    const expectedEnums = [
      { name: 'app_role', values: ['admin', 'user'] },
      { name: 'workspace_role', values: ['owner', 'admin', 'member', 'viewer'] },
      { name: 'subscription_tier', values: ['free', 'solo', 'team'] },
      { name: 'content_type', values: ['image', 'video', 'document'] },
      { name: 'model_category', values: ['general', 'conversation', 'coding', 'research', 'writing', 'image_generation', 'image_understanding', 'video_understanding'] },
      { name: 'payment_processor_enum', values: ['stripe', 'paypal'] },
      { name: 'account_status_enum', values: ['active', 'cancelled', 'suspended'] },
      { name: 'tier_type_enum', values: ['trial', 'paid'] },
      { name: 'subscription_status_enum', values: ['active', 'suspended', 'cancelled', 'expired'] },
      { name: 'event_type_enum', values: ['text_generation', 'image_generation', 'video_generation', 'document_parsing'] },
      { name: 'system_role', values: ['super_admin', 'admin', 'editor', 'viewer'] }
    ];

    const expectedFunctions = [
      'has_role', 'is_workspace_member', 'handle_updated_at', 'handle_new_user',
      'handle_user_settings_updated_at', 'get_schema_columns', 'get_rls_policies',
      'get_enum_types', 'get_db_functions', 'get_foreign_keys', 'get_rls_status'
    ];

    const warnings: string[] = [];

    // Get actual schema with error handling
    let actualTables: { table_name: string }[] = [];
    let actualTableNames: string[] = [];
    try {
      actualTables = await this.getTables(creds);
      actualTableNames = actualTables.map(t => t.table_name);
    } catch (err: any) {
      warnings.push(`Failed to fetch tables: ${err.message}. The get_schema_columns function may not exist.`);
    }

    let actualEnums: any[] = [];
    const enumMap = new Map<string, string[]>();
    try {
      actualEnums = await this.getEnumTypes(creds);
      actualEnums.forEach((e: any) => {
        if (!enumMap.has(e.type_name)) {
          enumMap.set(e.type_name, []);
        }
        enumMap.get(e.type_name)!.push(e.enum_label);
      });
    } catch (err: any) {
      warnings.push(`Failed to fetch enum types: ${err.message}. The get_enum_types function may not exist.`);
    }

    let actualFunctions: any[] = [];
    let actualFunctionNames: string[] = [];
    try {
      actualFunctions = await this.getDatabaseFunctions(creds);
      actualFunctionNames = actualFunctions.map((f: any) => f.routine_name);
    } catch (err: any) {
      warnings.push(`Failed to fetch functions: ${err.message}. The get_db_functions function may not exist.`);
    }

    let rlsStatus: any[] = [];
    try {
      rlsStatus = await this.getRLSStatus(creds);
    } catch (err: any) {
      warnings.push(`Failed to fetch RLS status: ${err.message}. The get_rls_status function may not exist.`);
    }

    // Compare
    const missingTables = expectedTables.filter(t => !actualTableNames.includes(t));
    const extraTables = actualTableNames.filter(t => !expectedTables.includes(t));

    const actualEnumList = Array.from(enumMap.entries()).map(([name, values]) => ({ name, values }));
    const missingEnums = expectedEnums.filter(e => !enumMap.has(e.name));
    const extraEnums = actualEnumList.filter(e => !expectedEnums.find(exp => exp.name === e.name));

    const missingFunctions = expectedFunctions.filter(f => !actualFunctionNames.includes(f));
    const extraFunctions = actualFunctionNames.filter(f => !expectedFunctions.includes(f));

    return {
      tables: {
        actual: actualTableNames.sort(),
        expected: expectedTables.sort(),
        missing: missingTables,
        extra: extraTables
      },
      enums: {
        actual: actualEnumList,
        expected: expectedEnums,
        missing: missingEnums,
        extra: extraEnums
      },
      functions: {
        actual: actualFunctionNames.sort(),
        expected: expectedFunctions.sort(),
        missing: missingFunctions,
        extra: extraFunctions
      },
      rlsStatus: rlsStatus.map((r: any) => ({ table: r.table_name, enabled: r.rls_enabled })),
      summary: {
        totalTables: actualTableNames.length,
        missingTables: missingTables.length,
        extraTables: extraTables.length,
        totalEnums: actualEnumList.length,
        missingEnums: missingEnums.length,
        extraEnums: extraEnums.length,
        totalFunctions: actualFunctionNames.length,
        missingFunctions: missingFunctions.length,
        extraFunctions: extraFunctions.length
      },
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
};

