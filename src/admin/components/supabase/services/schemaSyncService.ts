import { SupabaseCredentials } from '../types';
import { createClient } from '@supabase/supabase-js';

// Schema definitions from DATABASE_SCHEMA.md
const SCHEMA_DEFINITIONS: Record<string, { sql: string; dependencies?: string[] }> = {
  'app_role': {
    sql: `CREATE TYPE public.app_role AS ENUM ('admin', 'user');`,
    dependencies: []
  },
  'workspace_role': {
    sql: `CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');`,
    dependencies: []
  },
  'subscription_tier': {
    sql: `CREATE TYPE public.subscription_tier AS ENUM ('free', 'solo', 'team');`,
    dependencies: []
  },
  'content_type': {
    sql: `CREATE TYPE public.content_type AS ENUM ('image', 'video', 'document');`,
    dependencies: []
  },
  'model_category': {
    sql: `CREATE TYPE public.model_category AS ENUM ('general', 'conversation', 'coding', 'research', 'writing', 'image_generation', 'image_understanding', 'video_understanding');`,
    dependencies: []
  },
  'payment_processor_enum': {
    sql: `CREATE TYPE public.payment_processor_enum AS ENUM ('stripe', 'paypal');`,
    dependencies: []
  },
  'account_status_enum': {
    sql: `CREATE TYPE public.account_status_enum AS ENUM ('active', 'cancelled', 'suspended');`,
    dependencies: []
  },
  'tier_type_enum': {
    sql: `CREATE TYPE public.tier_type_enum AS ENUM ('trial', 'paid');`,
    dependencies: []
  },
  'subscription_status_enum': {
    sql: `CREATE TYPE public.subscription_status_enum AS ENUM ('active', 'suspended', 'cancelled', 'expired');`,
    dependencies: []
  },
  'event_type_enum': {
    sql: `CREATE TYPE public.event_type_enum AS ENUM ('text_generation', 'image_generation', 'video_generation', 'document_parsing');`,
    dependencies: []
  }
};

export const schemaSyncService = {
  /**
   * Generate SQL migration script for missing schema elements
   */
  async generateSyncSQL(
    creds: SupabaseCredentials,
    parityResults: {
      tables: { missing: string[]; extra: string[] };
      enums: { missing: any[]; extra: any[] };
      functions: { missing: string[]; extra: string[] };
    }
  ): Promise<{ sql: string; summary: string }> {
    const sqlStatements: string[] = [];
    const summary: string[] = [];

    // Generate SQL for missing enums
    if (parityResults.enums.missing.length > 0) {
      summary.push(`Creating ${parityResults.enums.missing.length} enum type(s)`);
      parityResults.enums.missing.forEach((enumType: any) => {
        const def = SCHEMA_DEFINITIONS[enumType.name];
        if (def) {
          sqlStatements.push(`-- Create enum: ${enumType.name}`);
          sqlStatements.push(def.sql);
          sqlStatements.push('');
        } else {
          // Generate basic enum from expected values
          const values = enumType.values?.map((v: string) => `'${v}'`).join(', ') || '';
          if (values) {
            sqlStatements.push(`-- Create enum: ${enumType.name}`);
            sqlStatements.push(`CREATE TYPE public.${enumType.name} AS ENUM (${values});`);
            sqlStatements.push('');
          }
        }
      });
    }

    // Note: For tables, we would need full CREATE TABLE statements
    // This is complex, so we'll provide a template and suggest using migrations
    if (parityResults.tables.missing.length > 0) {
      summary.push(`⚠️ ${parityResults.tables.missing.length} table(s) need to be created via migrations`);
      sqlStatements.push(`-- Missing Tables: ${parityResults.tables.missing.join(', ')}`);
      sqlStatements.push('-- These tables should be created using the migration files in supabase/migrations/');
      sqlStatements.push('-- Please review the migration files and apply them in order.');
      sqlStatements.push('');
    }

    // Generate SQL for missing functions
    if (parityResults.functions.missing.length > 0) {
      summary.push(`⚠️ ${parityResults.functions.missing.length} function(s) need to be created`);
      sqlStatements.push(`-- Missing Functions: ${parityResults.functions.missing.join(', ')}`);
      sqlStatements.push('-- These functions should be created using the migration files in supabase/migrations/');
      sqlStatements.push('');
    }

    // Check if there are extra items (items in DB but not in schema)
    const hasExtraItems = 
      parityResults.tables.extra.length > 0 ||
      parityResults.enums.extra.length > 0 ||
      parityResults.functions.extra.length > 0;

    if (hasExtraItems && sqlStatements.length === 0) {
      // No missing items to create, but there are extra items
      summary.push('⚠️ Extra items found in database (not in expected schema)');
      sqlStatements.push('-- Extra items detected in your database:');
      if (parityResults.tables.extra.length > 0) {
        sqlStatements.push(`-- Extra Tables: ${parityResults.tables.extra.join(', ')}`);
        sqlStatements.push('-- These tables exist in your database but are not in the expected schema.');
        sqlStatements.push('-- Review if these should be removed or added to the schema documentation.');
        sqlStatements.push('');
      }
      if (parityResults.enums.extra.length > 0) {
        sqlStatements.push(`-- Extra Enum Types: ${parityResults.enums.extra.map((e: any) => e.name).join(', ')}`);
        sqlStatements.push('-- These enum types exist in your database but are not in the expected schema.');
        sqlStatements.push('');
      }
      if (parityResults.functions.extra.length > 0) {
        sqlStatements.push(`-- Extra Functions: ${parityResults.functions.extra.join(', ')}`);
        sqlStatements.push('-- These functions exist in your database but are not in the expected schema.');
        sqlStatements.push('');
      }
      sqlStatements.push('-- Note: This tool only generates SQL for MISSING items.');
      sqlStatements.push('-- To remove extra items, you would need to manually drop them if they are not needed.');
    }

    const sql = sqlStatements.join('\n');
    const finalSummary = summary.join('\n');
    
    // Determine if truly in sync
    const isInSync = 
      parityResults.tables.missing.length === 0 &&
      parityResults.tables.extra.length === 0 &&
      parityResults.enums.missing.length === 0 &&
      parityResults.enums.extra.length === 0 &&
      parityResults.functions.missing.length === 0 &&
      parityResults.functions.extra.length === 0;

    return {
      sql: sql || '-- No SQL to generate. Schema is in sync!',
      summary: finalSummary || (isInSync ? 'Schema is in sync!' : 'Review parity test results for details.')
    };
  },

  /**
   * Execute SQL using Supabase client
   * Note: This requires a helper RPC function or direct SQL execution capability
   */
  async executeSQL(creds: SupabaseCredentials, sql: string): Promise<{ success: boolean; error?: string }> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      // Try to use a helper RPC function if it exists
      // Otherwise, we'll need to parse and execute statements one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      const errors: string[] = [];
      
      for (const statement of statements) {
        try {
          // For CREATE TYPE, we can try using RPC or direct execution
          // This is a simplified approach - in production, you'd want more robust SQL parsing
          if (statement.toUpperCase().startsWith('CREATE TYPE')) {
            // Try to execute via a helper function or direct SQL
            // Note: Supabase doesn't expose direct SQL execution via REST API
            // This would need to be done via Supabase SQL Editor or a custom Edge Function
            errors.push(`Cannot execute CREATE TYPE directly. Please run in Supabase SQL Editor: ${statement}`);
          } else {
            errors.push(`Unsupported statement type. Please run in Supabase SQL Editor: ${statement}`);
          }
        } catch (err: any) {
          errors.push(`Error executing statement: ${err.message}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join('\n')
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to execute SQL'
      };
    }
  },

  /**
   * Generate SQL to remove extra items (DROP statements)
   */
  generateRemoveExtraItemsSQL(parityResults: {
    tables: { extra: string[] };
    enums: { extra: any[] };
    functions: { extra: string[] };
  }): { sql: string; summary: string; warnings: string[] } {
    const sqlStatements: string[] = [];
    const summary: string[] = [];
    const warnings: string[] = [];

    warnings.push('⚠️ WARNING: This will permanently delete data and cannot be undone!');
    warnings.push('⚠️ Make sure you have a backup before proceeding!');
    warnings.push('⚠️ Review the SQL carefully before executing!');

    sqlStatements.push('-- ============================================');
    sqlStatements.push('-- REMOVE EXTRA ITEMS TO ACHIEVE PURE PARITY');
    sqlStatements.push('-- ============================================');
    sqlStatements.push('-- WARNING: This will permanently delete data!');
    sqlStatements.push('-- Review carefully and backup before executing!');
    sqlStatements.push('');
    sqlStatements.push('BEGIN;');
    sqlStatements.push('');

    // Drop extra tables (in reverse dependency order - drop dependent tables first)
    if (parityResults.tables?.extra?.length > 0) {
      summary.push(`Dropping ${parityResults.tables.extra.length} extra table(s)`);
      sqlStatements.push('-- Drop extra tables');
      parityResults.tables.extra.forEach((table: string) => {
        sqlStatements.push(`DROP TABLE IF EXISTS public.${table} CASCADE;`);
      });
      sqlStatements.push('');
    }

    // Drop extra functions
    if (parityResults.functions?.extra?.length > 0) {
      summary.push(`Dropping ${parityResults.functions.extra.length} extra function(s)`);
      sqlStatements.push('-- Drop extra functions');
      parityResults.functions.extra.forEach((func: string) => {
        // Note: Function signatures might be needed for proper dropping
        // This is a simplified approach - may need adjustment
        sqlStatements.push(`DROP FUNCTION IF EXISTS public.${func} CASCADE;`);
      });
      sqlStatements.push('');
    }

    // Drop extra enum types (do this last as tables might depend on them)
    if (parityResults.enums?.extra?.length > 0) {
      summary.push(`Dropping ${parityResults.enums.extra.length} extra enum type(s)`);
      sqlStatements.push('-- Drop extra enum types');
      parityResults.enums.extra.forEach((enumType: any) => {
        const enumName = enumType.name || enumType;
        sqlStatements.push(`DROP TYPE IF EXISTS public.${enumName} CASCADE;`);
      });
      sqlStatements.push('');
    }

    sqlStatements.push('COMMIT;');
    sqlStatements.push('');
    sqlStatements.push('-- ============================================');
    sqlStatements.push('-- Review the changes above before executing!');
    sqlStatements.push('-- ============================================');

    const sql = sqlStatements.join('\n');
    const finalSummary = summary.length > 0 
      ? summary.join('\n') 
      : 'No extra items to remove.';

    return {
      sql,
      summary: finalSummary,
      warnings
    };
  },

  /**
   * Get migration file recommendations based on missing items
   */
  getMigrationRecommendations(parityResults: {
    tables: { missing: string[] };
    enums: { missing: any[] };
    functions: { missing: string[] };
  }): string[] {
    const recommendations: string[] = [];

    if (parityResults.tables.missing.length > 0) {
      recommendations.push(
        `Run migrations from supabase/migrations/ directory in chronological order.`,
        `Missing tables: ${parityResults.tables.missing.join(', ')}`
      );
    }

    if (parityResults.enums.missing.length > 0) {
      recommendations.push(
        `Create missing enum types: ${parityResults.enums.missing.map((e: any) => e.name).join(', ')}`
      );
    }

    if (parityResults.functions.missing.length > 0) {
      recommendations.push(
        `Create missing functions: ${parityResults.functions.missing.join(', ')}`
      );
    }

    return recommendations;
  },

  /**
   * Auto-sync: Run parity test, generate SQL, and execute what can be executed automatically
   * @param existingParityResults Optional - if provided, will use these instead of running a new test
   */
  async autoSync(creds: SupabaseCredentials, databaseService: any, existingParityResults?: any): Promise<{
    success: boolean;
    message: string;
    details: {
      parityResults?: any;
      enumsCreated: number;
      enumsFailed: string[];
      requiresManualIntervention: {
        tables: string[];
        functions: string[];
      };
      summary: string;
    };
  }> {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required for auto-sync');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Step 1: Run parity test (or use existing results)
    const parityResults = existingParityResults || await databaseService.runParityTest(creds);

    // Step 2: Check if anything needs syncing
    // Use both the arrays and summary for more reliable detection
    const hasMissingItems = 
      (parityResults.tables?.missing?.length > 0) ||
      (parityResults.enums?.missing?.length > 0) ||
      (parityResults.functions?.missing?.length > 0) ||
      (parityResults.summary?.missingTables > 0) ||
      (parityResults.summary?.missingEnums > 0) ||
      (parityResults.summary?.missingFunctions > 0);

    // Debug logging
    console.log('Auto-sync parity results:', {
      tablesMissing: parityResults.tables?.missing?.length || 0,
      enumsMissing: parityResults.enums?.missing?.length || 0,
      functionsMissing: parityResults.functions?.missing?.length || 0,
      summaryMissingTables: parityResults.summary?.missingTables || 0,
      summaryMissingEnums: parityResults.summary?.missingEnums || 0,
      summaryMissingFunctions: parityResults.summary?.missingFunctions || 0,
      hasMissingItems
    });

    if (!hasMissingItems) {
      // Check if there are only extra items (not missing)
      const hasOnlyExtraItems = 
        (parityResults.tables?.extra?.length > 0) ||
        (parityResults.enums?.extra?.length > 0) ||
        (parityResults.functions?.extra?.length > 0);

      if (hasOnlyExtraItems) {
        const extraItemsSummary: string[] = [];
        if (parityResults.tables?.extra?.length > 0) {
          extraItemsSummary.push(`${parityResults.tables.extra.length} extra table(s): ${parityResults.tables.extra.join(', ')}`);
        }
        if (parityResults.enums?.extra?.length > 0) {
          const extraEnumNames = parityResults.enums.extra.map((e: any) => e.name || e).join(', ');
          extraItemsSummary.push(`${parityResults.enums.extra.length} extra enum type(s): ${extraEnumNames}`);
        }
        if (parityResults.functions?.extra?.length > 0) {
          extraItemsSummary.push(`${parityResults.functions.extra.length} extra function(s): ${parityResults.functions.extra.join(', ')}`);
        }

        return {
          success: true,
          message: 'No missing items to sync, but extra items detected.',
          details: {
            parityResults,
            enumsCreated: 0,
            enumsFailed: [],
            requiresManualIntervention: {
              tables: [],
              functions: []
            },
            summary: `Schema has no missing items, but contains extra items not in expected schema:\n${extraItemsSummary.join('\n')}\n\nOptions:\n1. If these are needed: Add them to DATABASE_SCHEMA.md\n2. If these are not needed: Drop them manually via SQL Editor\n3. If these are legacy: Document them as deprecated`
          }
        };
      }

      return {
        success: true,
        message: 'Schema is already in sync!',
        details: {
          parityResults,
          enumsCreated: 0,
          enumsFailed: [],
          requiresManualIntervention: {
            tables: [],
            functions: []
          },
          summary: 'No missing items found. Schema is up to date.'
        }
      };
    }

    // Step 3: Attempt to create missing enum types
    const enumsCreated: string[] = [];
    const enumsFailed: { name: string; error: string }[] = [];

    // Get missing enums - handle both array format and ensure it exists
    const missingEnums = parityResults.enums?.missing || [];
    
    console.log('Attempting to create enums:', missingEnums.length, missingEnums);

    for (const enumType of missingEnums) {
      try {
        // Get the SQL for this enum
        const def = SCHEMA_DEFINITIONS[enumType.name];
        let sql = '';
        
        if (def) {
          sql = def.sql;
        } else if (enumType.values && enumType.values.length > 0) {
          const values = enumType.values.map((v: string) => `'${v.replace(/'/g, "''")}'`).join(', ');
          sql = `CREATE TYPE public.${enumType.name} AS ENUM (${values});`;
        } else {
          enumsFailed.push({ name: enumType.name, error: 'No definition or values found' });
          continue;
        }

        // Try to execute via a helper RPC function if it exists
        // Otherwise, we'll need to use a workaround
        try {
          // Try using exec_sql RPC function if available
          const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sql });
          if (rpcError) {
            // If exec_sql doesn't exist, try direct execution via REST API
            // This won't work for DDL, so we'll mark it as requiring manual intervention
            throw new Error('exec_sql function not available. Enum creation requires manual execution.');
          }
          enumsCreated.push(enumType.name);
        } catch (err: any) {
          // If RPC fails, we can't execute DDL directly
          // Mark for manual intervention
          enumsFailed.push({ 
            name: enumType.name, 
            error: 'Cannot execute DDL automatically. Please run in Supabase SQL Editor.' 
          });
        }
      } catch (err: any) {
        enumsFailed.push({ name: enumType.name, error: err.message });
      }
    }

    // Step 4: Prepare summary
    const requiresManualIntervention = {
      tables: parityResults.tables?.missing || [],
      functions: parityResults.functions?.missing || [],
      enums: enumsFailed.map(e => e.name)
    };

    const summaryParts: string[] = [];
    if (enumsCreated.length > 0) {
      summaryParts.push(`✓ Created ${enumsCreated.length} enum type(s): ${enumsCreated.join(', ')}`);
    }
    if (enumsFailed.length > 0) {
      summaryParts.push(`⚠️ ${enumsFailed.length} enum type(s) require manual creation: ${enumsFailed.map(e => e.name).join(', ')}`);
    }
    if (requiresManualIntervention.tables.length > 0) {
      summaryParts.push(`⚠️ ${requiresManualIntervention.tables.length} table(s) require migration files: ${requiresManualIntervention.tables.join(', ')}`);
    }
    if (requiresManualIntervention.functions.length > 0) {
      summaryParts.push(`⚠️ ${requiresManualIntervention.functions.length} function(s) require migration files: ${requiresManualIntervention.functions.join(', ')}`);
    }

    const success = 
      enumsCreated.length > 0 && 
      enumsFailed.length === 0 &&
      requiresManualIntervention.tables.length === 0 &&
      requiresManualIntervention.functions.length === 0;

    return {
      success,
      message: success 
        ? 'Auto-sync completed successfully!' 
        : 'Auto-sync completed with some items requiring manual intervention.',
      details: {
        parityResults,
        enumsCreated: enumsCreated.length,
        enumsFailed: enumsFailed.map(e => `${e.name}: ${e.error}`),
        requiresManualIntervention: {
          tables: requiresManualIntervention.tables,
          functions: requiresManualIntervention.functions
        },
        summary: summaryParts.join('\n') || 'No changes needed.'
      }
    };
  }
};

