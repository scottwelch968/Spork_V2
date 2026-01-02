import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DevEnvironmentConfig {
  supabase_url: string;
  supabase_project_ref: string;
  supabase_anon_key: string;
  supabase_service_role_key: string;
  supabase_access_token: string;
}

interface SecretInfo {
  name: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface PolicyInfo {
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
  policy_definition: string | null;
}

interface FunctionInfo {
  routine_name: string;
  routine_definition: string;
  data_type: string;
}

interface EnumInfo {
  type_name: string;
  enum_label: string;
}

// System tables to sync
const SYSTEM_TABLES = [
  { name: 'ai_models', identifierField: 'model_id', displayField: 'name' },
  { name: 'fallback_models', identifierField: 'model_id', displayField: 'name' },
  { name: 'system_settings', identifierField: 'setting_key', displayField: 'setting_key' },
  { name: 'persona_templates', identifierField: 'id', displayField: 'name' },
  { name: 'persona_categories', identifierField: 'slug', displayField: 'name' },
  { name: 'space_templates', identifierField: 'id', displayField: 'name' },
  { name: 'space_categories', identifierField: 'slug', displayField: 'name' },
  { name: 'prompt_templates', identifierField: 'id', displayField: 'title' },
  { name: 'prompt_categories', identifierField: 'slug', displayField: 'name' },
  { name: 'subscription_tiers', identifierField: 'id', displayField: 'name' },
  { name: 'pricing_tiers', identifierField: 'id', displayField: 'tier_name' },
  { name: 'credit_packages', identifierField: 'id', displayField: 'name' },
  { name: 'discount_codes', identifierField: 'code', displayField: 'code' },
  { name: 'payment_processors', identifierField: 'id', displayField: 'name' },
  { name: 'email_providers', identifierField: 'id', displayField: 'name' },
  { name: 'email_templates', identifierField: 'slug', displayField: 'name' },
  { name: 'email_rules', identifierField: 'id', displayField: 'name' },
  { name: 'email_system_event_types', identifierField: 'event_type', displayField: 'display_name' },
];

interface RecordDiff {
  id: string;
  displayName: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  changedFields?: string[];
  prodData?: Record<string, unknown>;
  devData?: Record<string, unknown>;
}

interface StructuredError {
  message: string;
  code?: string;
  httpStatus?: number;
  details?: string;
  hint?: string;
  table?: string;
}

// Helper to extract structured error info from Supabase errors
function formatSupabaseError(error: any, tableName?: string): StructuredError {
  return {
    message: error?.message || String(error),
    code: error?.code,
    httpStatus: error?.status || error?.statusCode,
    details: error?.details,
    hint: error?.hint,
    table: tableName,
  };
}

interface TableDataComparison {
  tableName: string;
  records: RecordDiff[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compareRecords(prodRecords: any[], devRecords: any[], identifierField: string, displayField: string): RecordDiff[] {
  const results: RecordDiff[] = [];
  const prodMap = new Map(prodRecords.map(r => [String(r[identifierField] || r.id), r]));
  const devMap = new Map(devRecords.map(r => [String(r[identifierField] || r.id), r]));
  const allIds = new Set([...prodMap.keys(), ...devMap.keys()]);

  for (const id of allIds) {
    const prodRecord = prodMap.get(id);
    const devRecord = devMap.get(id);

    if (!prodRecord && devRecord) {
      // Use the identifier field value (id from Map key), NOT record.id
      results.push({
        id: id,
        displayName: devRecord[displayField] || id,
        status: 'removed',
        devData: devRecord,
      });
    } else if (prodRecord && !devRecord) {
      // Use the identifier field value (id from Map key), NOT record.id
      results.push({
        id: id,
        displayName: prodRecord[displayField] || id,
        status: 'added',
        prodData: prodRecord,
      });
    } else if (prodRecord && devRecord) {
      // Compare fields
      const changedFields: string[] = [];
      const allKeys = new Set([...Object.keys(prodRecord), ...Object.keys(devRecord)]);
      
      for (const key of allKeys) {
        // Skip metadata fields
        if (['created_at', 'updated_at', 'id'].includes(key)) continue;
        
        const prodVal = JSON.stringify(prodRecord[key]);
        const devVal = JSON.stringify(devRecord[key]);
        if (prodVal !== devVal) {
          changedFields.push(key);
        }
      }

      if (changedFields.length > 0) {
        // Use the identifier field value (id from Map key), NOT record.id
        results.push({
          id: id,
          displayName: prodRecord[displayField] || id,
          status: 'modified',
          changedFields,
          prodData: prodRecord,
          devData: devRecord,
        });
      } else {
        // Use the identifier field value (id from Map key), NOT record.id
        results.push({
          id: id,
          displayName: prodRecord[displayField] || id,
          status: 'unchanged',
        });
      }
    }
  }

  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateInsertSql(tableName: string, record: any): string {
  const columns = Object.keys(record).filter(k => record[k] !== undefined);
  const values = columns.map(c => {
    const val = record[c];
    if (val === null) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    return String(val);
  });
  return `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateUpdateSql(tableName: string, record: any, changedFields: string[]): string {
  const sets = changedFields.map(field => {
    const val = record[field];
    if (val === null) return `${field} = NULL`;
    if (typeof val === 'string') return `${field} = '${val.replace(/'/g, "''")}'`;
    if (typeof val === 'object') return `${field} = '${JSON.stringify(val).replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return `${field} = ${val ? 'true' : 'false'}`;
    return `${field} = ${val}`;
  });
  return `UPDATE public.${tableName} SET ${sets.join(', ')} WHERE id = '${record.id}';`;
}

function generateDeleteSql(tableName: string, id: string): string {
  return `DELETE FROM public.${tableName} WHERE id = '${id}';`;
}

serve(async (req) => {
  const logger = createLogger('supabase-sync');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    logger.info('Sync action', { action });

    // Initialize Supabase client for local operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get dev environment config from system_settings
    async function getDevConfig(): Promise<DevEnvironmentConfig | null> {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'dev_environment_config')
        .single();

      if (error || !data) {
        console.log('[supabase-sync] No dev environment config found');
        return null;
      }
      return data.setting_value as DevEnvironmentConfig;
    }

    // Get production project ref from URL
    function getProdProjectRef(): string {
      const url = new URL(supabaseUrl);
      return url.hostname.split('.')[0];
    }

    // Fetch schema from a Supabase project using service role key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function fetchSchema(client: any) {
      // Get tables and columns
      const { data: columns, error: colError } = await client.rpc('get_schema_columns');
      if (colError) {
        logger.error('Error fetching columns', { error: colError });
        throw { code: 'FUNCTION_FAILED', message: `Failed to fetch columns: ${colError.message}`, httpStatus: 500 };
      }

      // Get RLS policies
      const { data: policies, error: polError } = await client.rpc('get_rls_policies');
      if (polError) {
        logger.error('Error fetching policies', { error: polError });
        throw { code: 'FUNCTION_FAILED', message: `Failed to fetch policies: ${polError.message}`, httpStatus: 500 };
      }

      // Get functions
      const { data: functions, error: fnError } = await client.rpc('get_db_functions');
      if (fnError) {
        logger.error('Error fetching functions', { error: fnError });
        throw { code: 'FUNCTION_FAILED', message: `Failed to fetch functions: ${fnError.message}`, httpStatus: 500 };
      }

      // Get enum types
      const { data: enums, error: enumError } = await client.rpc('get_enum_types');
      if (enumError) {
        console.error('[supabase-sync] Error fetching enum types:', enumError);
        // Don't fail - enums are optional, just log warning
      }

      // Group enum labels by type name
      const enumTypes: Record<string, string[]> = {};
      if (enums) {
        for (const e of enums as EnumInfo[]) {
          if (!enumTypes[e.type_name]) {
            enumTypes[e.type_name] = [];
          }
          enumTypes[e.type_name].push(e.enum_label);
        }
      }

      return { columns: columns || [], policies: policies || [], functions: functions || [], enums: enumTypes };
    }

    // Compare schemas between prod and dev
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function compareSchemas(prodSchema: any, devSchema: any) {
      // Compare enum types first
      const prodEnums = prodSchema.enums || {};
      const devEnums = devSchema.enums || {};
      const allEnumNames = new Set([...Object.keys(prodEnums), ...Object.keys(devEnums)]);
      
      const enums = [];
      for (const enumName of allEnumNames) {
        const prodLabels = prodEnums[enumName] || [];
        const devLabels = devEnums[enumName] || [];
        
        if (!prodEnums[enumName]) {
          enums.push({ name: enumName, status: 'removed', devLabels });
        } else if (!devEnums[enumName]) {
          enums.push({ name: enumName, status: 'added', prodLabels });
        } else {
          // Compare labels
          const prodSet = new Set(prodLabels);
          const devSet = new Set(devLabels);
          const missing = prodLabels.filter((l: string) => !devSet.has(l));
          const extra = devLabels.filter((l: string) => !prodSet.has(l));
          
          if (missing.length > 0 || extra.length > 0) {
            enums.push({ 
              name: enumName, 
              status: 'modified', 
              prodLabels, 
              devLabels,
              missingLabels: missing,
              extraLabels: extra
            });
          } else {
            enums.push({ name: enumName, status: 'unchanged' });
          }
        }
      }

      // Group columns by table
      const prodTables: Record<string, ColumnInfo[]> = {};
      const devTables: Record<string, ColumnInfo[]> = {};

      for (const col of prodSchema.columns) {
        const tableName = col.column_name.includes('.') 
          ? col.column_name.split('.')[0] 
          : (col as unknown as { table_name: string }).table_name;
        if (!prodTables[tableName]) prodTables[tableName] = [];
        prodTables[tableName].push(col);
      }

      for (const col of devSchema.columns) {
        const tableName = col.column_name.includes('.') 
          ? col.column_name.split('.')[0] 
          : (col as unknown as { table_name: string }).table_name;
        if (!devTables[tableName]) devTables[tableName] = [];
        devTables[tableName].push(col);
      }

      // Compare tables
      const allTableNames = new Set([...Object.keys(prodTables), ...Object.keys(devTables)]);
      const tables = [];

      for (const tableName of allTableNames) {
        const prodCols = prodTables[tableName] || [];
        const devCols = devTables[tableName] || [];

        if (!prodTables[tableName]) {
          tables.push({ name: tableName, status: 'removed', columns: [] });
        } else if (!devTables[tableName]) {
          tables.push({ name: tableName, status: 'added', columns: prodCols.map(c => ({
            name: c.column_name,
            status: 'added',
            prodType: c.data_type,
            prodNullable: c.is_nullable === 'YES',
            prodDefault: c.column_default
          }))});
        } else {
          // Compare columns
          const prodColMap = new Map(prodCols.map(c => [c.column_name, c]));
          const devColMap = new Map(devCols.map(c => [c.column_name, c]));
          const allColNames = new Set([...prodColMap.keys(), ...devColMap.keys()]);
          
          const columnDiffs = [];
          let hasChanges = false;

          for (const colName of allColNames) {
            const prodCol = prodColMap.get(colName);
            const devCol = devColMap.get(colName);

            if (!prodCol) {
              columnDiffs.push({ name: colName, status: 'removed', devType: devCol?.data_type });
              hasChanges = true;
            } else if (!devCol) {
              columnDiffs.push({ 
                name: colName, 
                status: 'added', 
                prodType: prodCol.data_type,
                prodNullable: prodCol.is_nullable === 'YES',
                prodDefault: prodCol.column_default
              });
              hasChanges = true;
            } else if (prodCol.data_type !== devCol.data_type || 
                       prodCol.is_nullable !== devCol.is_nullable) {
              columnDiffs.push({
                name: colName,
                status: 'modified',
                prodType: prodCol.data_type,
                devType: devCol.data_type,
                prodNullable: prodCol.is_nullable === 'YES',
                devNullable: devCol.is_nullable === 'YES'
              });
              hasChanges = true;
            } else {
              columnDiffs.push({ name: colName, status: 'unchanged' });
            }
          }

          tables.push({ 
            name: tableName, 
            status: hasChanges ? 'modified' : 'unchanged',
            columns: columnDiffs 
          });
        }
      }

      // Compare policies
      const prodPolicyMap = new Map<string, PolicyInfo>(prodSchema.policies.map((p: PolicyInfo) => 
        [`${p.tablename}.${p.policyname}`, p]));
      const devPolicyMap = new Map<string, PolicyInfo>(devSchema.policies.map((p: PolicyInfo) => 
        [`${p.tablename}.${p.policyname}`, p]));
      const allPolicyKeys = new Set<string>([...prodPolicyMap.keys(), ...devPolicyMap.keys()]);

      const policies = [];
      for (const key of allPolicyKeys) {
        const [tableName, policyName] = key.split('.');
        const prodPolicy = prodPolicyMap.get(key);
        const devPolicy = devPolicyMap.get(key);

        if (!prodPolicy) {
          policies.push({ 
            tableName, 
            policyName, 
            status: 'removed',
            devCmd: devPolicy?.cmd,
            devQual: devPolicy?.qual,
            devWithCheck: devPolicy?.with_check,
            devDefinition: devPolicy?.policy_definition,
            devRoles: devPolicy?.roles,
            devPermissive: devPolicy?.permissive
          });
        } else if (!devPolicy) {
          policies.push({ 
            tableName, 
            policyName, 
            status: 'added',
            prodCmd: prodPolicy.cmd,
            prodQual: prodPolicy.qual,
            prodWithCheck: prodPolicy.with_check,
            prodDefinition: prodPolicy.policy_definition,
            prodRoles: prodPolicy.roles,
            prodPermissive: prodPolicy.permissive
          });
        } else if (prodPolicy.qual !== devPolicy.qual || prodPolicy.with_check !== devPolicy.with_check) {
          policies.push({
            tableName,
            policyName,
            status: 'modified',
            prodCmd: prodPolicy.cmd,
            prodQual: prodPolicy.qual,
            prodWithCheck: prodPolicy.with_check,
            prodDefinition: prodPolicy.policy_definition,
            prodRoles: prodPolicy.roles,
            prodPermissive: prodPolicy.permissive,
            devCmd: devPolicy.cmd,
            devQual: devPolicy.qual,
            devWithCheck: devPolicy.with_check,
            devDefinition: devPolicy.policy_definition,
            devRoles: devPolicy.roles,
            devPermissive: devPolicy.permissive
          });
        } else {
          policies.push({ tableName, policyName, status: 'unchanged' });
        }
      }

      // Compare functions
      const prodFnMap = new Map<string, FunctionInfo>(prodSchema.functions.map((f: FunctionInfo) => [f.routine_name, f]));
      const devFnMap = new Map<string, FunctionInfo>(devSchema.functions.map((f: FunctionInfo) => [f.routine_name, f]));
      const allFnNames = new Set<string>([...prodFnMap.keys(), ...devFnMap.keys()]);

      const functions = [];
      for (const fnName of allFnNames) {
        const prodFn = prodFnMap.get(fnName);
        const devFn = devFnMap.get(fnName);

        if (!prodFn) {
          functions.push({ name: fnName, status: 'removed', devDefinition: devFn?.routine_definition });
        } else if (!devFn) {
          functions.push({ name: fnName, status: 'added', prodDefinition: prodFn.routine_definition });
        } else if (prodFn.routine_definition !== devFn.routine_definition) {
          functions.push({
            name: fnName,
            status: 'modified',
            prodDefinition: prodFn.routine_definition,
            devDefinition: devFn.routine_definition
          });
        } else {
          functions.push({ name: fnName, status: 'unchanged' });
        }
      }

      return { tables, policies, functions, enums };
    }

    // Helper to detect function dependencies
    function getFunctionDependencies(definition: string): string[] {
      if (!definition) return [];
      // Look for calls to public.function_name( pattern
      const matches = definition.match(/public\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g) || [];
      return [...new Set(matches.map(m => m.replace('public.', '').replace(/\s*\($/, '')))];
    }

    // Sort functions by dependency order (independent first, dependent last)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function sortFunctionsByDependency(functions: any[]): any[] {
      const functionNames = new Set(functions.map(f => f.name.split('(')[0]));
      const sorted: any[] = [];
      const remaining = [...functions];
      const added = new Set<string>();
      
      // Multiple passes to resolve dependencies
      let maxIterations = functions.length + 1;
      while (remaining.length > 0 && maxIterations > 0) {
        maxIterations--;
        const stillRemaining: any[] = [];
        
        for (const fn of remaining) {
          const fnName = fn.name.split('(')[0];
          const deps = getFunctionDependencies(fn.prodDefinition || '');
          // Filter to only dependencies that are in our function list
          const unresolvedDeps = deps.filter(d => functionNames.has(d) && !added.has(d) && d !== fnName);
          
          if (unresolvedDeps.length === 0) {
            sorted.push(fn);
            added.add(fnName);
          } else {
            stillRemaining.push(fn);
          }
        }
        
        // If no progress made, add remaining as-is (circular deps or external)
        if (stillRemaining.length === remaining.length) {
          sorted.push(...stillRemaining);
          break;
        }
        remaining.length = 0;
        remaining.push(...stillRemaining);
      }
      
      return sorted;
    }

    // Generate migration SQL from differences
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function generateMigrationFromDiff(comparison: any): string {
      const statements: string[] = [];
      statements.push('-- Generated Migration SQL');
      statements.push('-- Apply this to development environment to match production');
      statements.push('-- ORDER: 1) ENUMs, 2) Functions (dependency-sorted), 3) Tables, 4) RLS Policies\n');

      // 1. ENUM types first (before anything that depends on them)
      if (comparison.enums) {
        statements.push('-- ============================================');
        statements.push('-- SECTION 1: ENUM TYPES');
        statements.push('-- ============================================\n');
        for (const enumType of comparison.enums) {
          if (enumType.status === 'added') {
            const labels = enumType.prodLabels.map((l: string) => `'${l}'`).join(', ');
            statements.push(`-- Create enum type: ${enumType.name}`);
            statements.push(`DO $$ BEGIN CREATE TYPE public.${enumType.name} AS ENUM (${labels}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n`);
          } else if (enumType.status === 'modified' && enumType.missingLabels?.length > 0) {
            statements.push(`-- Add missing values to enum type: ${enumType.name}`);
            for (const label of enumType.missingLabels) {
              statements.push(`ALTER TYPE public.${enumType.name} ADD VALUE IF NOT EXISTS '${label}';`);
            }
            statements.push('');
          }
        }
      }

      // 2. Functions BEFORE policies (policies often depend on functions like has_role())
      const functionsToCreate = comparison.functions.filter((fn: any) => fn.status === 'added' || fn.status === 'modified');
      if (functionsToCreate.length > 0) {
        statements.push('-- ============================================');
        statements.push('-- SECTION 2: FUNCTIONS (dependency-ordered)');
        statements.push('-- ============================================\n');
        
        // Sort functions by dependency
        const sortedFunctions = sortFunctionsByDependency(functionsToCreate);
        
        for (const fn of sortedFunctions) {
          statements.push(`-- ${fn.status === 'added' ? 'Create' : 'Update'} function: ${fn.name}`);
          
          // For MODIFIED functions, we MUST drop first because PostgreSQL cannot
          // change return types with CREATE OR REPLACE FUNCTION
          if (fn.status === 'modified') {
            statements.push(`DROP FUNCTION IF EXISTS public.${fn.name}();`);
          }
          
          if (fn.prodDefinition) {
            // pg_get_functiondef doesn't include trailing semicolon - add one if missing
            const definition = fn.prodDefinition.trim();
            statements.push(definition.endsWith(';') ? definition : definition + ';');
          } else {
            statements.push(`-- Function definition not available - sync from production required`);
          }
          statements.push('');
        }
      }

      // Handle removed functions (commented out for safety)
      for (const fn of comparison.functions) {
        if (fn.status === 'removed') {
          statements.push(`-- Remove function: ${fn.name}`);
          statements.push(`-- DROP FUNCTION IF EXISTS public.${fn.name}();`);
          statements.push('');
        }
      }

      // 3. Tables
      if (comparison.tables.some((t: any) => t.status !== 'unchanged')) {
        statements.push('-- ============================================');
        statements.push('-- SECTION 3: TABLES');
        statements.push('-- ============================================\n');
      }
      
      for (const table of comparison.tables) {
        if (table.status === 'added') {
          statements.push(`-- Create table: ${table.name}`);
          statements.push(`CREATE TABLE IF NOT EXISTS public.${table.name} (`);
          const colDefs = (table.columns || []).filter((c: any) => c.status === 'added').map((col: any) => {
            let def = `  ${col.name} ${col.prodType || 'text'}`;
            if (!col.prodNullable) def += ' NOT NULL';
            if (col.prodDefault) def += ` DEFAULT ${col.prodDefault}`;
            return def;
          });
          statements.push(colDefs.join(',\n'));
          statements.push(');\n');
        } else if (table.status === 'modified' && table.columns) {
          for (const col of table.columns) {
            if (col.status === 'added') {
              statements.push(`-- Add column ${col.name} to ${table.name}`);
              let def = `ALTER TABLE public.${table.name} ADD COLUMN IF NOT EXISTS ${col.name} ${col.prodType || 'text'}`;
              if (!col.prodNullable) def += ' NOT NULL';
              if (col.prodDefault) def += ` DEFAULT ${col.prodDefault}`;
              statements.push(def + ';\n');
            } else if (col.status === 'removed') {
              statements.push(`-- Remove column ${col.name} from ${table.name}`);
              statements.push(`-- ALTER TABLE public.${table.name} DROP COLUMN ${col.name};\n`);
            } else if (col.status === 'modified') {
              statements.push(`-- Modify column ${col.name} in ${table.name}`);
              statements.push(`ALTER TABLE public.${table.name} ALTER COLUMN ${col.name} TYPE ${col.prodType || col.devType};\n`);
            }
          }
        }
      }

      // 4. RLS Policies LAST (they depend on functions and tables)
      const policiesToCreate = comparison.policies.filter((p: any) => p.status === 'added' || p.status === 'modified');
      if (policiesToCreate.length > 0) {
        statements.push('-- ============================================');
        statements.push('-- SECTION 4: RLS POLICIES (after functions)');
        statements.push('-- ============================================\n');
      }
      
      for (const policy of comparison.policies) {
        if (policy.status === 'added') {
          statements.push(`-- Create policy: ${policy.policyName} on ${policy.tableName}`);
          
          // If we have the full policy definition from the database, use it
          if (policy.prodDefinition) {
            // Ensure trailing semicolon exists
            const definition = policy.prodDefinition.trim();
            statements.push(definition.endsWith(';') ? definition : definition + ';');
          } else {
            // Build the policy SQL manually
            const roles = policy.prodRoles?.length > 0 ? policy.prodRoles.join(', ') : 'public';
            const permissive = policy.prodPermissive || 'PERMISSIVE';
            let policySql = `CREATE POLICY "${policy.policyName}" ON public.${policy.tableName}`;
            policySql += ` AS ${permissive}`;
            policySql += ` FOR ${policy.prodCmd || 'ALL'}`;
            policySql += ` TO ${roles}`;
            if (policy.prodQual) {
              policySql += ` USING (${policy.prodQual})`;
            }
            if (policy.prodWithCheck) {
              policySql += ` WITH CHECK (${policy.prodWithCheck})`;
            }
            policySql += ';';
            statements.push(policySql);
          }
          statements.push('');
        } else if (policy.status === 'modified') {
          statements.push(`-- Update policy: ${policy.policyName} on ${policy.tableName}`);
          statements.push(`-- Drop existing and recreate with new definition`);
          statements.push(`DROP POLICY IF EXISTS "${policy.policyName}" ON public.${policy.tableName};`);
          
          // Use full definition if available
          if (policy.prodDefinition) {
            // Ensure trailing semicolon exists
            const definition = policy.prodDefinition.trim();
            statements.push(definition.endsWith(';') ? definition : definition + ';');
          } else {
            const roles = policy.prodRoles?.length > 0 ? policy.prodRoles.join(', ') : 'public';
            const permissive = policy.prodPermissive || 'PERMISSIVE';
            let policySql = `CREATE POLICY "${policy.policyName}" ON public.${policy.tableName}`;
            policySql += ` AS ${permissive}`;
            policySql += ` FOR ${policy.prodCmd || 'ALL'}`;
            policySql += ` TO ${roles}`;
            if (policy.prodQual) {
              policySql += ` USING (${policy.prodQual})`;
            }
            if (policy.prodWithCheck) {
              policySql += ` WITH CHECK (${policy.prodWithCheck})`;
            }
            policySql += ';';
            statements.push(policySql);
          }
          statements.push('');
        } else if (policy.status === 'removed') {
          statements.push(`-- Remove policy: ${policy.policyName} from ${policy.tableName}`);
          statements.push(`-- DROP POLICY IF EXISTS "${policy.policyName}" ON public.${policy.tableName};`);
          statements.push('');
        }
      }

      return statements.join('\n');
    }

    switch (action) {
      case 'test-connection': {
        const { environment, config } = params;
        
        if (environment === 'prod') {
          // Test production connection
          const { data, error } = await supabase.from('system_settings').select('setting_key').limit(1);
          if (error) {
            return new Response(JSON.stringify({ success: false, error: error.message }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ success: true, message: 'Production connection successful' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Test dev connection
          const devConfig = config || await getDevConfig();
          if (!devConfig) {
            return new Response(JSON.stringify({ success: false, error: 'No dev environment configured' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);
          
          // Use auth session check - doesn't require any tables to exist
          const { error: authError } = await devClient.auth.getSession();
          if (authError) {
            return new Response(JSON.stringify({ success: false, error: `Connection failed: ${authError.message}` }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          return new Response(JSON.stringify({ success: true, message: 'Development connection successful' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'save-dev-config': {
        const { config } = params;
        
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            setting_key: 'dev_environment_config',
            setting_value: config,
            updated_at: new Date().toISOString()
          }, { onConflict: 'setting_key' });

        if (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-dev-config': {
        const config = await getDevConfig();
        return new Response(JSON.stringify({ success: true, config }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list-secrets': {
        const { environment } = params;
        const devConfig = await getDevConfig();
        
        let projectRef: string;
        let accessToken: string;

        if (environment === 'prod') {
          projectRef = getProdProjectRef();
          // For production, we need PAT stored in secrets or config
          // Using env var for now
          accessToken = devConfig?.supabase_access_token || '';
        } else {
          if (!devConfig) {
            return new Response(JSON.stringify({ success: false, error: 'No dev environment configured' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          projectRef = devConfig.supabase_project_ref;
          accessToken = devConfig.supabase_access_token;
        }

        if (!accessToken) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No Supabase access token configured. Please add your Personal Access Token.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[supabase-sync] Listing secrets for project: ${projectRef}`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[supabase-sync] Failed to list secrets: ${errorText}`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to list secrets: ${response.status} ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const secrets: SecretInfo[] = await response.json();
        return new Response(JSON.stringify({ success: true, secrets }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-secrets': {
        const devConfig = await getDevConfig();
        
        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment or access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = getProdProjectRef();
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        // Fetch both in parallel
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`https://api.supabase.com/v1/projects/${prodProjectRef}/secrets`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`https://api.supabase.com/v1/projects/${devProjectRef}/secrets`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!prodResponse.ok || !devResponse.ok) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch secrets from one or both environments' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodSecrets: SecretInfo[] = await prodResponse.json();
        const devSecrets: SecretInfo[] = await devResponse.json();

        const prodNames = new Set(prodSecrets.map(s => s.name));
        const devNames = new Set(devSecrets.map(s => s.name));

        const comparison = {
          onlyInProd: prodSecrets.filter(s => !devNames.has(s.name)),
          onlyInDev: devSecrets.filter(s => !prodNames.has(s.name)),
          inBoth: prodSecrets.filter(s => devNames.has(s.name))
        };

        return new Response(JSON.stringify({ success: true, comparison, prodSecrets, devSecrets }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-schemas': {
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[supabase-sync] Fetching production schema...');
        const prodSchema = await fetchSchema(supabase);
        
        console.log('[supabase-sync] Fetching development schema...');
        const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);
        const devSchema = await fetchSchema(devClient);

        console.log('[supabase-sync] Comparing schemas...');
        const comparison = compareSchemas(prodSchema, devSchema);

        // Log the comparison
        await supabase.from('sync_logs').insert({
          sync_type: 'schema_comparison',
          direction: 'both',
          status: 'success',
          details: { 
            tables_compared: comparison.tables.length,
            policies_compared: comparison.policies.length,
            functions_compared: comparison.functions.length,
            tables_with_changes: comparison.tables.filter(t => t.status !== 'unchanged').length
          }
        });

        return new Response(JSON.stringify({ success: true, comparison }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate-migration-sql': {
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[supabase-sync] Generating migration SQL...');
        const prodSchema = await fetchSchema(supabase);
        const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);
        const devSchema = await fetchSchema(devClient);
        const comparison = compareSchemas(prodSchema, devSchema);
        const sql = generateMigrationFromDiff(comparison);

        // Log the generation
        await supabase.from('sync_logs').insert({
          sync_type: 'migration_generation',
          direction: 'to_dev',
          status: 'success',
          sql_executed: sql,
          details: { 
            tables_affected: comparison.tables.filter(t => t.status !== 'unchanged').length,
            policies_affected: comparison.policies.filter(p => p.status !== 'unchanged').length,
            functions_affected: comparison.functions.filter(f => f.status !== 'unchanged').length
          }
        });

        return new Response(JSON.stringify({ success: true, sql }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create-secret': {
        const { environment, name, value } = params;
        const devConfig = await getDevConfig();

        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const projectRef = environment === 'prod' 
          ? getProdProjectRef() 
          : devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        console.log(`[supabase-sync] Creating secret ${name} in ${environment}`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ name, value }])
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[supabase-sync] Failed to create secret: ${errorText}`);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to create secret: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log the operation
        await supabase.from('sync_logs').insert({
          sync_type: 'secrets',
          direction: environment === 'prod' ? 'to_prod' : 'to_dev',
          status: 'success',
          details: { action: 'create', secret_name: name }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-secret': {
        const { environment, names } = params;
        const devConfig = await getDevConfig();

        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const projectRef = environment === 'prod' 
          ? getProdProjectRef() 
          : devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        console.log(`[supabase-sync] Deleting secrets ${names.join(', ')} from ${environment}`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(names)
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to delete secrets: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log the operation
        await supabase.from('sync_logs').insert({
          sync_type: 'secrets',
          direction: environment === 'prod' ? 'from_prod' : 'from_dev',
          status: 'success',
          details: { action: 'delete', secret_names: names }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk-create-secrets': {
        const { environment, secrets } = params; // secrets: Array<{name: string, value: string}>
        const devConfig = await getDevConfig();

        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const projectRef = environment === 'prod' 
          ? getProdProjectRef() 
          : devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        console.log(`[supabase-sync] Bulk creating ${secrets.length} secrets in ${environment}`);

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/secrets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(secrets)
        });

        if (!response.ok) {
          const errorText = await response.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to create secrets: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log the operation
        await supabase.from('sync_logs').insert({
          sync_type: 'secrets',
          direction: environment === 'prod' ? 'to_prod' : 'to_dev',
          status: 'success',
          details: { action: 'bulk_create', secret_names: secrets.map((s: {name: string}) => s.name) }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-sync-logs': {
        const { limit = 50 } = params;
        
        const { data, error } = await supabase
          .from('sync_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, logs: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-data': {
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[supabase-sync] Comparing system data tables...');
        const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);

        const tableComparisons: TableDataComparison[] = [];
        let totalAdded = 0, totalRemoved = 0, totalModified = 0, totalUnchanged = 0;

        for (const table of SYSTEM_TABLES) {
          try {
            console.log(`[supabase-sync] Comparing table: ${table.name}`);
            
            const [prodResult, devResult] = await Promise.all([
              supabase.from(table.name).select('*'),
              devClient.from(table.name).select('*')
            ]);

            if (prodResult.error) {
              console.error(`[supabase-sync] Error fetching prod ${table.name}:`, prodResult.error);
              continue;
            }
            if (devResult.error) {
              console.error(`[supabase-sync] Error fetching dev ${table.name}:`, devResult.error);
              continue;
            }

            const records = compareRecords(
              prodResult.data || [],
              devResult.data || [],
              table.identifierField,
              table.displayField
            );

            tableComparisons.push({ tableName: table.name, records });

            // Count stats
            for (const r of records) {
              if (r.status === 'added') totalAdded++;
              else if (r.status === 'removed') totalRemoved++;
              else if (r.status === 'modified') totalModified++;
              else totalUnchanged++;
            }
          } catch (err) {
            console.error(`[supabase-sync] Error comparing ${table.name}:`, err);
          }
        }

        const comparison = {
          tables: tableComparisons,
          summary: {
            added: totalAdded,
            removed: totalRemoved,
            modified: totalModified,
            unchanged: totalUnchanged
          }
        };

        // Log the comparison
        await supabase.from('sync_logs').insert({
          sync_type: 'data_comparison',
          direction: 'both',
          status: 'success',
          details: { 
            tables_compared: tableComparisons.length,
            ...comparison.summary
          }
        });

        return new Response(JSON.stringify({ success: true, comparison }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate-data-sync-sql': {
        const { selectedRecords, direction } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[supabase-sync] Generating data sync SQL...');
        const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);

        const statements: string[] = [];
        statements.push('-- Generated Data Sync SQL');
        statements.push(`-- Direction: ${direction === 'prod_to_dev' ? 'Production → Development' : 'Development → Production'}`);
        statements.push(`-- Generated at: ${new Date().toISOString()}\n`);

        const sourceClient = direction === 'prod_to_dev' ? supabase : devClient;
        const targetEnv = direction === 'prod_to_dev' ? 'dev' : 'prod';

        for (const [tableName, recordIds] of Object.entries(selectedRecords as Record<string, string[]>)) {
          if (!recordIds || recordIds.length === 0) continue;

          const tableConfig = SYSTEM_TABLES.find(t => t.name === tableName);
          if (!tableConfig) continue;

          const idField = tableConfig.identifierField;
          statements.push(`-- Table: ${tableName} (identifier: ${idField})`);

          // Fetch the source records using the correct identifier field
          const { data: sourceRecords, error } = await sourceClient
            .from(tableName)
            .select('*')
            .in(idField, recordIds);

          if (error) {
            statements.push(`-- Error fetching records: ${error.message}`);
            continue;
          }

          // For each record, determine if it's insert, update, or delete
          for (const recordId of recordIds) {
            const sourceRecord = (sourceRecords || []).find((r: Record<string, unknown>) => 
              String(r[idField]) === String(recordId)
            );
            
            if (sourceRecord) {
              // Record exists in source - generate UPSERT
              const columns = Object.keys(sourceRecord).filter(k => sourceRecord[k] !== undefined);
              const values = columns.map(c => {
                const val = sourceRecord[c];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                if (typeof val === 'boolean') return val ? 'true' : 'false';
                return String(val);
              });
              
              // Exclude identifier field and created_at from UPDATE clause
              const updateCols = columns.filter(c => c !== idField && c !== 'created_at');
              const updateSets = updateCols.map(c => `${c} = EXCLUDED.${c}`);
              
              statements.push(
                `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ` +
                `ON CONFLICT (${idField}) DO UPDATE SET ${updateSets.join(', ')};`
              );
            } else {
              // Record doesn't exist in source - it was removed, generate DELETE
              statements.push(`DELETE FROM public.${tableName} WHERE ${idField} = '${recordId}';`);
            }
          }
          
          statements.push('');
        }

        const sql = statements.join('\n');

        // Log the generation
        await supabase.from('sync_logs').insert({
          sync_type: 'data_sync_sql',
          direction: direction === 'prod_to_dev' ? 'to_dev' : 'to_prod',
          status: 'success',
          sql_executed: sql,
          details: { 
            tables: Object.keys(selectedRecords as object),
            record_count: Object.values(selectedRecords as Record<string, string[]>).flat().length
          }
        });

        return new Response(JSON.stringify({ success: true, sql }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-edge-functions': {
        const devConfig = await getDevConfig();
        
        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment or access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = getProdProjectRef();
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        console.log('[supabase-sync] Fetching edge functions from both environments...');

        // Fetch edge functions from both environments in parallel
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`https://api.supabase.com/v1/projects/${prodProjectRef}/functions`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`https://api.supabase.com/v1/projects/${devProjectRef}/functions`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (!prodResponse.ok) {
          const errorText = await prodResponse.text();
          console.error('[supabase-sync] Failed to fetch prod functions:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch production functions: ${errorText}`,
            code: 'PROD_FUNCTIONS_FETCH_ERROR',
            httpStatus: prodResponse.status,
            details: `HTTP ${prodResponse.status} from Supabase Management API`,
            hint: 'Verify your Supabase access token has permission to read edge functions'
          }), {
            status: prodResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!devResponse.ok) {
          const errorText = await devResponse.text();
          console.error('[supabase-sync] Failed to fetch dev functions:', errorText);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch development functions: ${errorText}`,
            code: 'DEV_FUNCTIONS_FETCH_ERROR',
            httpStatus: devResponse.status,
            details: `HTTP ${devResponse.status} from Supabase Management API`,
            hint: 'Verify your development project reference and access token are correct'
          }), {
            status: devResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        interface EdgeFunction {
          id: string;
          slug: string;
          name: string;
          version: number;
          created_at: string;
          updated_at: string;
          verify_jwt: boolean;
          status: string;
        }

        const prodFunctions: EdgeFunction[] = await prodResponse.json();
        const devFunctions: EdgeFunction[] = await devResponse.json();

        console.log(`[supabase-sync] Found ${prodFunctions.length} prod functions, ${devFunctions.length} dev functions`);

        // Create maps for comparison
        const prodMap = new Map(prodFunctions.map(f => [f.slug, f]));
        const devMap = new Map(devFunctions.map(f => [f.slug, f]));
        const allNames = new Set([...prodMap.keys(), ...devMap.keys()]);

        const functions: Array<{
          name: string;
          status: 'added' | 'removed' | 'modified' | 'unchanged';
          prodVersion?: string;
          devVersion?: string;
          prodCreatedAt?: string;
          devCreatedAt?: string;
        }> = [];

        let added = 0, removed = 0, modified = 0, unchanged = 0;

        for (const name of allNames) {
          const prodFn = prodMap.get(name);
          const devFn = devMap.get(name);

          if (!prodFn && devFn) {
            functions.push({
              name,
              status: 'removed',
              devVersion: `v${devFn.version}`,
              devCreatedAt: devFn.created_at,
            });
            removed++;
          } else if (prodFn && !devFn) {
            functions.push({
              name,
              status: 'added',
              prodVersion: `v${prodFn.version}`,
              prodCreatedAt: prodFn.created_at,
            });
            added++;
          } else if (prodFn && devFn) {
            // Compare versions - if different, mark as modified
            const isModified = prodFn.version !== devFn.version || 
                              prodFn.updated_at !== devFn.updated_at;
            
            functions.push({
              name,
              status: isModified ? 'modified' : 'unchanged',
              prodVersion: `v${prodFn.version}`,
              devVersion: `v${devFn.version}`,
              prodCreatedAt: prodFn.created_at,
              devCreatedAt: devFn.created_at,
            });
            
            if (isModified) modified++;
            else unchanged++;
          }
        }

        // Sort by name
        functions.sort((a, b) => a.name.localeCompare(b.name));

        const comparison = {
          functions,
          summary: { added, removed, modified, unchanged }
        };

        // Log the comparison
        await supabase.from('sync_logs').insert({
          sync_type: 'edge_functions_comparison',
          direction: 'both',
          status: 'success',
          details: { 
            prod_count: prodFunctions.length,
            dev_count: devFunctions.length,
            ...comparison.summary
          }
        });

        return new Response(JSON.stringify({ success: true, comparison }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-edge-function-code': {
        const { functionName } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment or access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = getProdProjectRef();
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        console.log(`[supabase-sync] Fetching code for function: ${functionName}`);

        // Fetch function details from both environments
        const [prodResponse, devResponse] = await Promise.all([
          fetch(`https://api.supabase.com/v1/projects/${prodProjectRef}/functions/${functionName}/body`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`https://api.supabase.com/v1/projects/${devProjectRef}/functions/${functionName}/body`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        let prodCode = '';
        let devCode = '';

        if (prodResponse.ok) {
          prodCode = await prodResponse.text();
        } else {
          prodCode = `// Function not found in production (${prodResponse.status})`;
        }

        if (devResponse.ok) {
          devCode = await devResponse.text();
        } else {
          devCode = `// Function not found in development (${devResponse.status})`;
        }

        return new Response(JSON.stringify({ success: true, prodCode, devCode }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-storage-buckets': {
        const devConfig = await getDevConfig();
        
        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment or access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const devUrl = devConfig.supabase_url;
        const devServiceKey = devConfig.supabase_service_role_key;
        const devClient = createClient(devUrl, devServiceKey);

        console.log('[supabase-sync] Comparing storage buckets...');

        // Fetch buckets from both environments using Supabase client
        const [prodBucketsResult, devBucketsResult] = await Promise.all([
          supabase.storage.listBuckets(),
          devClient.storage.listBuckets()
        ]);

        if (prodBucketsResult.error) {
          console.error('[supabase-sync] Failed to fetch prod buckets:', prodBucketsResult.error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch production buckets: ${prodBucketsResult.error.message}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (devBucketsResult.error) {
          console.error('[supabase-sync] Failed to fetch dev buckets:', devBucketsResult.error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch development buckets: ${devBucketsResult.error.message}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodBuckets = prodBucketsResult.data || [];
        const devBuckets = devBucketsResult.data || [];

        console.log(`[supabase-sync] Found ${prodBuckets.length} prod buckets, ${devBuckets.length} dev buckets`);

        interface BucketInfo {
          id: string;
          name: string;
          public: boolean;
          file_size_limit?: number | null;
          allowed_mime_types?: string[] | null;
          created_at: string;
          updated_at: string;
        }

        // Create maps for comparison
        const prodMap = new Map<string, BucketInfo>(prodBuckets.map(b => [b.id, b as BucketInfo]));
        const devMap = new Map<string, BucketInfo>(devBuckets.map(b => [b.id, b as BucketInfo]));
        const allNames = new Set([...prodMap.keys(), ...devMap.keys()]);

        const buckets: Array<{
          name: string;
          status: 'added' | 'removed' | 'modified' | 'unchanged';
          prodPublic?: boolean;
          devPublic?: boolean;
          prodFileSizeLimit?: number | null;
          devFileSizeLimit?: number | null;
          prodMimeTypes?: string[] | null;
          devMimeTypes?: string[] | null;
          changedFields?: string[];
        }> = [];

        let added = 0, removed = 0, modified = 0, unchanged = 0;

        for (const name of allNames) {
          const prodBucket = prodMap.get(name);
          const devBucket = devMap.get(name);

          if (!prodBucket && devBucket) {
            buckets.push({
              name,
              status: 'removed',
              devPublic: devBucket.public,
              devFileSizeLimit: devBucket.file_size_limit,
              devMimeTypes: devBucket.allowed_mime_types,
            });
            removed++;
          } else if (prodBucket && !devBucket) {
            buckets.push({
              name,
              status: 'added',
              prodPublic: prodBucket.public,
              prodFileSizeLimit: prodBucket.file_size_limit,
              prodMimeTypes: prodBucket.allowed_mime_types,
            });
            added++;
          } else if (prodBucket && devBucket) {
            // Compare settings
            const changedFields: string[] = [];
            
            if (prodBucket.public !== devBucket.public) {
              changedFields.push('public');
            }
            if (prodBucket.file_size_limit !== devBucket.file_size_limit) {
              changedFields.push('file_size_limit');
            }
            if (JSON.stringify(prodBucket.allowed_mime_types) !== JSON.stringify(devBucket.allowed_mime_types)) {
              changedFields.push('allowed_mime_types');
            }

            const isModified = changedFields.length > 0;

            buckets.push({
              name,
              status: isModified ? 'modified' : 'unchanged',
              prodPublic: prodBucket.public,
              devPublic: devBucket.public,
              prodFileSizeLimit: prodBucket.file_size_limit,
              devFileSizeLimit: devBucket.file_size_limit,
              prodMimeTypes: prodBucket.allowed_mime_types,
              devMimeTypes: devBucket.allowed_mime_types,
              changedFields: isModified ? changedFields : undefined,
            });

            if (isModified) modified++;
            else unchanged++;
          }
        }

        // Sort by name
        buckets.sort((a, b) => a.name.localeCompare(b.name));

        const comparison = {
          buckets,
          summary: { added, removed, modified, unchanged }
        };

        // Log the comparison
        await supabase.from('sync_logs').insert({
          sync_type: 'storage_buckets_comparison',
          direction: 'both',
          status: 'success',
          details: { 
            prod_count: prodBuckets.length,
            dev_count: devBuckets.length,
            ...comparison.summary
          }
        });

        return new Response(JSON.stringify({ success: true, comparison }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate-storage-sync-sql': {
        const { selectedBuckets, direction } = params as { 
          selectedBuckets: string[]; 
          direction: 'prod_to_dev' | 'dev_to_prod' 
        };

        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const devUrl = devConfig.supabase_url;
        const devServiceKey = devConfig.supabase_service_role_key;
        const devClient = createClient(devUrl, devServiceKey);

        // Fetch buckets from source environment
        const sourceClient = direction === 'prod_to_dev' ? supabase : devClient;
        const { data: sourceBuckets, error } = await sourceClient.storage.listBuckets();

        if (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch buckets: ${error.message}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const statements: string[] = [];
        statements.push('-- Storage Buckets Sync SQL');
        statements.push(`-- Direction: ${direction === 'prod_to_dev' ? 'Production → Development' : 'Development → Production'}`);
        statements.push(`-- Generated at: ${new Date().toISOString()}\n`);

        for (const bucketName of selectedBuckets) {
          const bucket = sourceBuckets?.find(b => b.id === bucketName);
          
          if (bucket) {
            statements.push(`-- Bucket: ${bucket.name}`);
            statements.push(`INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)`);
            
            const mimeTypes = (bucket as { allowed_mime_types?: string[] | null }).allowed_mime_types;
            const fileSizeLimit = (bucket as { file_size_limit?: number | null }).file_size_limit;
            
            statements.push(`VALUES ('${bucket.id}', '${bucket.name}', ${bucket.public}, ${fileSizeLimit || 'NULL'}, ${mimeTypes ? `ARRAY[${mimeTypes.map(m => `'${m}'`).join(', ')}]` : 'NULL'})`);
            statements.push(`ON CONFLICT (id) DO UPDATE SET`);
            statements.push(`  public = EXCLUDED.public,`);
            statements.push(`  file_size_limit = EXCLUDED.file_size_limit,`);
            statements.push(`  allowed_mime_types = EXCLUDED.allowed_mime_types;\n`);
          }
        }

        return new Response(JSON.stringify({ success: true, sql: statements.join('\n') }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-auth-config': {
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\./)?.[1];
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        if (!prodProjectRef || !devProjectRef || !accessToken) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing project references or access token' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch auth config from production
        const prodAuthResponse = await fetch(
          `https://api.supabase.com/v1/projects/${prodProjectRef}/config/auth`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!prodAuthResponse.ok) {
          const errorText = await prodAuthResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch production auth config: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodAuth = await prodAuthResponse.json();

        // Fetch auth config from development
        const devAuthResponse = await fetch(
          `https://api.supabase.com/v1/projects/${devProjectRef}/config/auth`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!devAuthResponse.ok) {
          const errorText = await devAuthResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch development auth config: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const devAuth = await devAuthResponse.json();

        // Fields to compare with their groups
        const fieldsToCompare = [
          { name: 'site_url', group: 'general' },
          { name: 'uri_allow_list', group: 'general' },
          { name: 'jwt_exp', group: 'general' },
          { name: 'refresh_token_rotation_enabled', group: 'general' },
          { name: 'mailer_autoconfirm', group: 'email' },
          { name: 'mailer_secure_email_change_enabled', group: 'email' },
          { name: 'mailer_otp_exp', group: 'email' },
          { name: 'mailer_otp_length', group: 'email' },
          { name: 'external_email_enabled', group: 'email' },
          { name: 'double_confirm_changes', group: 'email' },
          { name: 'password_min_length', group: 'password' },
          { name: 'password_required_characters', group: 'password' },
          { name: 'security_update_password_require_reauthentication', group: 'password' },
          { name: 'external_google_enabled', group: 'providers' },
          { name: 'external_github_enabled', group: 'providers' },
          { name: 'external_apple_enabled', group: 'providers' },
          { name: 'external_discord_enabled', group: 'providers' },
          { name: 'external_twitter_enabled', group: 'providers' },
          { name: 'external_facebook_enabled', group: 'providers' },
          { name: 'external_azure_enabled', group: 'providers' },
          { name: 'external_linkedin_oidc_enabled', group: 'providers' },
          { name: 'external_slack_oidc_enabled', group: 'providers' },
          { name: 'external_spotify_enabled', group: 'providers' },
          { name: 'external_twitch_enabled', group: 'providers' },
          { name: 'external_zoom_enabled', group: 'providers' },
          { name: 'security_captcha_enabled', group: 'security' },
          { name: 'security_captcha_provider', group: 'security' },
          { name: 'mfa_enabled', group: 'security' },
          { name: 'mfa_max_enrolled_factors', group: 'security' },
          { name: 'security_manual_linking_enabled', group: 'security' },
          { name: 'sessions_inactivity_timeout', group: 'security' },
          { name: 'sessions_single_per_user', group: 'security' },
          { name: 'sessions_timebox', group: 'security' },
        ];

        const fields: Array<{
          fieldName: string;
          status: 'added' | 'removed' | 'modified' | 'unchanged';
          prodValue?: unknown;
          devValue?: unknown;
          group: string;
        }> = [];

        let added = 0, removed = 0, modified = 0, unchanged = 0;

        for (const field of fieldsToCompare) {
          const prodValue = prodAuth[field.name];
          const devValue = devAuth[field.name];
          
          let status: 'added' | 'removed' | 'modified' | 'unchanged';
          
          if (prodValue !== undefined && devValue === undefined) {
            status = 'added';
            added++;
          } else if (prodValue === undefined && devValue !== undefined) {
            status = 'removed';
            removed++;
          } else if (JSON.stringify(prodValue) !== JSON.stringify(devValue)) {
            status = 'modified';
            modified++;
          } else {
            status = 'unchanged';
            unchanged++;
          }

          fields.push({
            fieldName: field.name,
            status,
            prodValue,
            devValue,
            group: field.group,
          });
        }

        const comparison = {
          fields,
          summary: { added, removed, modified, unchanged }
        };

        // Log the comparison
        await supabase.from('sync_logs').insert({
          sync_type: 'auth_config_comparison',
          direction: 'both',
          status: 'success',
          details: { 
            prod_project_ref: prodProjectRef,
            dev_project_ref: devProjectRef,
            ...comparison.summary
          }
        });

        return new Response(JSON.stringify({ success: true, comparison }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'apply-auth-config': {
        const { selectedFields, direction } = params as { 
          selectedFields: string[]; 
          direction: 'prod_to_dev' | 'dev_to_prod' 
        };

        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\./)?.[1];
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        if (!prodProjectRef || !devProjectRef || !accessToken) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing project references or access token' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sourceRef = direction === 'prod_to_dev' ? prodProjectRef : devProjectRef;
        const targetRef = direction === 'prod_to_dev' ? devProjectRef : prodProjectRef;

        // Fetch source auth config
        const sourceResponse = await fetch(
          `https://api.supabase.com/v1/projects/${sourceRef}/config/auth`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!sourceResponse.ok) {
          const errorText = await sourceResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch source auth config: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const sourceAuth = await sourceResponse.json();

        // Build patch payload with only selected fields
        const patchPayload: Record<string, unknown> = {};
        for (const fieldName of selectedFields) {
          if (sourceAuth[fieldName] !== undefined) {
            patchPayload[fieldName] = sourceAuth[fieldName];
          }
        }

        // Apply to target
        const patchResponse = await fetch(
          `https://api.supabase.com/v1/projects/${targetRef}/config/auth`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchPayload),
          }
        );

        if (!patchResponse.ok) {
          const errorText = await patchResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to apply auth config: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Log the sync
        await supabase.from('sync_logs').insert({
          sync_type: 'auth_config_sync',
          direction,
          status: 'success',
          details: { 
            source_project_ref: sourceRef,
            target_project_ref: targetRef,
            fields_synced: selectedFields
          }
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'apply-schema-sync': {
        const { direction } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[supabase-sync] Generating and applying schema migration...');
        const prodSchema = await fetchSchema(supabase);
        const devClient = createClient(devConfig.supabase_url, devConfig.supabase_service_role_key);
        const devSchema = await fetchSchema(devClient);
        const comparison = compareSchemas(prodSchema, devSchema);
        const sql = generateMigrationFromDiff(comparison);

        if (!sql || sql.trim() === '-- Generated Migration SQL\n-- Apply this to development environment to match production\n') {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'No schema changes to apply' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Determine target based on direction
        const targetRef = direction === 'prod_to_dev' ? devConfig.supabase_project_ref : getProdProjectRef();
        const targetAccessToken = devConfig.supabase_access_token;

        // Execute migration using Supabase Management API
        console.log(`[supabase-sync] Executing migration on project: ${targetRef}`);
        
        const queryUrl = `https://api.supabase.com/v1/projects/${targetRef}/database/query`;
        
        const queryResponse = await fetch(queryUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${targetAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: sql }),
        });

        let executedCount = 0;
        const errors: string[] = [];
        let responseData: unknown = null;

        if (!queryResponse.ok) {
          const errorText = await queryResponse.text();
          console.error('[supabase-sync] Migration execution failed:', errorText);
          errors.push(`API Error: ${errorText}`);
        } else {
          responseData = await queryResponse.json();
          console.log('[supabase-sync] Migration executed successfully');
          // Count approximate statements executed
          executedCount = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--')).length;
        }

        // Log the sync
        await supabase.from('sync_logs').insert({
          sync_type: 'schema_sync',
          direction,
          status: errors.length > 0 ? 'failed' : 'success',
          sql_executed: sql,
          details: { 
            statements_count: executedCount,
            executed_count: errors.length > 0 ? 0 : executedCount,
            errors: errors.length > 0 ? errors : undefined,
            response: responseData
          }
        });

        if (errors.length > 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: errors.join('; '),
            sql
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Schema migration applied successfully. ${executedCount} statement(s) executed.`,
          sql
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'apply-data-sync': {
        const { selectedRecords, direction } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured',
            syncedCount: 0,
            errorCount: 1,
            errors: ['No dev environment configured']
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Trim whitespace from config values to prevent auth issues
        const devUrl = devConfig.supabase_url?.trim();
        const devServiceKey = devConfig.supabase_service_role_key?.trim();
        
        if (!devUrl || !devServiceKey) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing dev URL or service role key',
            syncedCount: 0,
            errorCount: 1,
            errors: ['Dev environment URL or service role key is missing']
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[supabase-sync] Applying data sync with direction: ${direction}`);
        console.log(`[supabase-sync] Dev URL: ${devUrl.substring(0, 30)}...`);
        console.log(`[supabase-sync] Tables to sync: ${Object.keys(selectedRecords as object).join(', ')}`);
        
        const devClient = createClient(devUrl, devServiceKey);
        
        // Validate dev connection before proceeding
        console.log('[supabase-sync] Testing dev database connection...');
        const { error: connectionError } = await devClient
          .from('system_settings')
          .select('setting_key')
          .limit(1);
        
        if (connectionError) {
          console.error('[supabase-sync] Dev connection failed:', connectionError.message);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Cannot connect to dev database: ${connectionError.message}`,
            syncedCount: 0,
            errorCount: 1,
            errors: [`Dev database connection failed: ${connectionError.message}`]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log('[supabase-sync] Dev connection successful');
        const sourceClient = direction === 'prod_to_dev' ? supabase : devClient;
        const targetClient = direction === 'prod_to_dev' ? devClient : supabase;

        let syncedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const [tableName, recordIds] of Object.entries(selectedRecords as Record<string, string[]>)) {
          if (!recordIds || recordIds.length === 0) continue;

          const tableConfig = SYSTEM_TABLES.find(t => t.name === tableName);
          if (!tableConfig) {
            console.warn(`[supabase-sync] Unknown table: ${tableName}`);
            errors.push(`Unknown table: ${tableName}`);
            continue;
          }

          console.log(`[supabase-sync] Processing table: ${tableName} (${recordIds.length} records)`);

          try {
            const idField = tableConfig.identifierField;
            
            // Fetch source records
            const { data: sourceRecords, error: fetchError } = await sourceClient
              .from(tableName)
              .select('*')
              .in(idField, recordIds);

            if (fetchError) {
              console.error(`[supabase-sync] Error fetching from ${tableName}:`, fetchError.message);
              errors.push(`Error fetching from ${tableName}: ${fetchError.message}`);
              errorCount++;
              continue;
            }

            console.log(`[supabase-sync] Fetched ${sourceRecords?.length || 0} source records from ${tableName}`);

            // For each record, check-then-insert-or-update (avoids ON CONFLICT constraint issues)
            for (const recordId of recordIds) {
              const sourceRecord = (sourceRecords || []).find((r: Record<string, unknown>) => r[idField] === recordId);
              
              if (sourceRecord) {
                // Check if record already exists in target
                const { data: existingRecord } = await targetClient
                  .from(tableName)
                  .select(idField)
                  .eq(idField, recordId)
                  .maybeSingle();

                if (existingRecord) {
                  // UPDATE existing record
                  console.log(`[supabase-sync] Updating record ${recordId} in ${tableName}`);
                  const { error: updateError } = await targetClient
                    .from(tableName)
                    .update(sourceRecord)
                    .eq(idField, recordId);

                  if (updateError) {
                    console.error(`[supabase-sync] Update error:`, updateError.message);
                    errors.push(`Error updating ${tableName} (${recordId}): ${updateError.message}`);
                    errorCount++;
                  } else {
                    console.log(`[supabase-sync] Successfully updated ${recordId} in ${tableName}`);
                    syncedCount++;
                  }
                } else {
                  // INSERT new record
                  console.log(`[supabase-sync] Inserting record ${recordId} into ${tableName}`);
                  const { error: insertError } = await targetClient
                    .from(tableName)
                    .insert(sourceRecord);

                  if (insertError) {
                    console.error(`[supabase-sync] Insert error:`, insertError.message);
                    errors.push(`Error inserting to ${tableName} (${recordId}): ${insertError.message}`);
                    errorCount++;
                  } else {
                    console.log(`[supabase-sync] Successfully inserted ${recordId} into ${tableName}`);
                    syncedCount++;
                  }
                }
              } else {
                // Record doesn't exist in source - it was removed, delete from target
                console.log(`[supabase-sync] Deleting record ${recordId} from ${tableName}`);
                const { error: deleteError } = await targetClient
                  .from(tableName)
                  .delete()
                  .eq(idField, recordId);

                if (deleteError) {
                  console.error(`[supabase-sync] Delete error:`, deleteError.message);
                  errors.push(`Error deleting from ${tableName} (${recordId}): ${deleteError.message}`);
                  errorCount++;
                } else {
                  console.log(`[supabase-sync] Successfully deleted ${recordId} from ${tableName}`);
                  syncedCount++;
                }
              }
            }
          } catch (err) {
            console.error(`[supabase-sync] Exception processing ${tableName}:`, err);
            errors.push(`Error processing ${tableName}: ${err}`);
            errorCount++;
          }
        }

        console.log(`[supabase-sync] Sync complete: ${syncedCount} synced, ${errorCount} errors`);

        // Log the sync
        await supabase.from('sync_logs').insert({
          sync_type: 'data_sync',
          direction,
          status: errorCount > 0 ? (syncedCount > 0 ? 'partial' : 'failed') : 'success',
          details: { 
            tables: Object.keys(selectedRecords as object),
            synced_count: syncedCount,
            error_count: errorCount,
            errors: errors.length > 0 ? errors : undefined
          }
        });

        return new Response(JSON.stringify({ 
          success: errorCount === 0,
          message: `Data sync complete. ${syncedCount} record(s) synced${errorCount > 0 ? `, ${errorCount} error(s)` : ''}.`,
          syncedCount,
          errorCount,
          errors: errors.length > 0 ? errors : undefined
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Single table sync for real-time progress updates
      case 'apply-data-sync-table': {
        try {
          const { tableName, recordIds, direction } = params;
          const devConfig = await getDevConfig();
          
          if (!devConfig) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'No dev environment configured',
              code: 'CONFIG_MISSING',
              httpStatus: 400,
              syncedCount: 0,
              errorCount: 1,
              errors: [{
                message: 'No dev environment configured',
                code: 'CONFIG_MISSING',
                httpStatus: 400,
                table: tableName
              }]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }

          // Trim whitespace from config values
          const devUrl = devConfig.supabase_url?.trim();
          const devServiceKey = devConfig.supabase_service_role_key?.trim();
          
          if (!devUrl || !devServiceKey) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Missing dev URL or service role key',
              code: 'CONFIG_INVALID',
              httpStatus: 400,
              syncedCount: 0,
              errorCount: 1,
              errors: [{
                message: 'Dev environment URL or service role key is missing',
                code: 'CONFIG_INVALID',
                httpStatus: 400,
                table: tableName
              }]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }

          if (!tableName || !recordIds || recordIds.length === 0) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Missing table name or record IDs',
              code: 'INVALID_PARAMS',
              httpStatus: 400,
              syncedCount: 0,
              errorCount: 1,
              errors: [{
                message: 'Table name or record IDs not provided',
                code: 'INVALID_PARAMS',
                httpStatus: 400,
                table: tableName
              }]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }

          console.log(`[supabase-sync] apply-data-sync-table: ${tableName} (${recordIds.length} records), direction: ${direction}`);
          
          const devClient = createClient(devUrl, devServiceKey);
          const sourceClient = direction === 'prod_to_dev' ? supabase : devClient;
          const targetClient = direction === 'prod_to_dev' ? devClient : supabase;

          let syncedCount = 0;
          let errorCount = 0;
          const errors: StructuredError[] = [];

          const tableConfig = SYSTEM_TABLES.find(t => t.name === tableName);
          if (!tableConfig) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Unknown table: ${tableName}`,
              code: 'UNKNOWN_TABLE',
              httpStatus: 400,
              syncedCount: 0,
              errorCount: 1,
              errors: [{
                message: `Unknown table: ${tableName}`,
                code: 'UNKNOWN_TABLE',
                httpStatus: 400,
                table: tableName
              }]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            });
          }

          try {
          const idField = tableConfig.identifierField;
          
          // Fetch source records
          console.log(`[supabase-sync] Fetching records from ${tableName} using field ${idField} with IDs:`, recordIds);
          const { data: sourceRecords, error: fetchError } = await sourceClient
            .from(tableName)
            .select('*')
            .in(idField, recordIds);

          if (fetchError) {
            console.error(`[supabase-sync] Fetch error details:`, {
              message: fetchError.message,
              code: fetchError.code,
              details: (fetchError as any).details,
              hint: (fetchError as any).hint,
              status: (fetchError as any).status,
            });
            const structuredError = formatSupabaseError(fetchError, tableName);
            console.error(`[supabase-sync] Formatted error:`, JSON.stringify(structuredError, null, 2));
            return new Response(JSON.stringify({ 
              success: false,
              error: `Error fetching from ${tableName}: ${fetchError.message}`,
              code: fetchError.code || 'FETCH_ERROR',
              httpStatus: (fetchError as any).status || 500,
              syncedCount: 0,
              errorCount: 1,
              errors: [{
                message: `Error fetching from ${tableName}: ${fetchError.message}`,
                code: fetchError.code || 'FETCH_ERROR',
                httpStatus: (fetchError as any).status || 500,
                details: (fetchError as any).details || JSON.stringify(fetchError),
                hint: (fetchError as any).hint,
                table: tableName,
              }]
            }), {
              status: (fetchError as any).status || 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          console.log(`[supabase-sync] Successfully fetched ${sourceRecords?.length || 0} records from ${tableName}`);

          // Get target table columns to filter out columns that don't exist in target
          let targetColumns: string[] = [];
          try {
            const { data: targetColumnsData, error: targetColsError } = await targetClient.rpc('get_schema_columns');
            if (!targetColsError && targetColumnsData) {
              targetColumns = (targetColumnsData as any[])
                .filter((col: any) => col.table_name === tableName)
                .map((col: any) => col.column_name);
              console.log(`[supabase-sync] Target table ${tableName} has ${targetColumns.length} columns`);
            } else {
              // Fallback: Try to get columns by selecting one record (if table has data)
              // or by querying information_schema directly
              console.warn(`[supabase-sync] RPC get_schema_columns failed, trying fallback method for ${tableName}`);
              try {
                // Try to get a sample record to see what columns are available
                const { data: sampleRecord } = await targetClient
                  .from(tableName)
                  .select('*')
                  .limit(1)
                  .maybeSingle();
                
                if (sampleRecord) {
                  targetColumns = Object.keys(sampleRecord);
                  console.log(`[supabase-sync] Got ${targetColumns.length} columns from sample record for ${tableName}`);
                } else {
                  console.warn(`[supabase-sync] No sample record available for ${tableName}, will attempt sync without filtering`);
                }
              } catch (fallbackErr) {
                console.warn(`[supabase-sync] Fallback method also failed for ${tableName}:`, fallbackErr);
              }
            }
          } catch (err) {
            console.warn(`[supabase-sync] Error fetching target columns for ${tableName}:`, err);
          }

          // Helper function to filter record to only include columns that exist in target
          const filterRecordForTarget = (record: Record<string, unknown>): Record<string, unknown> => {
            if (targetColumns.length === 0) {
              // If we couldn't get target columns, return record as-is (will fail if column mismatch)
              return record;
            }
            const filtered: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(record)) {
              if (targetColumns.includes(key)) {
                filtered[key] = value;
              } else {
                console.log(`[supabase-sync] Filtering out column '${key}' from ${tableName} (not in target schema)`);
              }
            }
            return filtered;
          };

          console.log(`[supabase-sync] Fetched ${sourceRecords?.length || 0} source records from ${tableName}`);

          // Process each record
          for (const recordId of recordIds) {
            const sourceRecord = (sourceRecords || []).find((r: Record<string, unknown>) => r[idField] === recordId);
            
            if (sourceRecord) {
              // Filter source record to only include columns that exist in target
              const filteredRecord = filterRecordForTarget(sourceRecord);
              
              // Check if record exists in target
              const { data: existingRecord } = await targetClient
                .from(tableName)
                .select(idField)
                .eq(idField, recordId)
                .maybeSingle();

              if (existingRecord) {
                // UPDATE existing record
                const { error: updateError } = await targetClient
                  .from(tableName)
                  .update(filteredRecord)
                  .eq(idField, recordId);

                if (updateError) {
                  console.error(`[supabase-sync] Update error for ${tableName} (${recordId}):`, {
                    message: updateError.message,
                    code: updateError.code,
                    details: (updateError as any).details,
                    hint: (updateError as any).hint,
                  });
                  errors.push({
                    message: `Error updating ${tableName} (${recordId}): ${updateError.message}`,
                    code: updateError.code || 'UPDATE_ERROR',
                    httpStatus: (updateError as any).status || 500,
                    details: (updateError as any).details || JSON.stringify(updateError),
                    hint: (updateError as any).hint,
                    table: tableName,
                  });
                  errorCount++;
                } else {
                  syncedCount++;
                }
              } else {
                // INSERT new record
                const { error: insertError } = await targetClient
                  .from(tableName)
                  .insert(filteredRecord);

                if (insertError) {
                  console.error(`[supabase-sync] Insert error for ${tableName} (${recordId}):`, {
                    message: insertError.message,
                    code: insertError.code,
                    details: (insertError as any).details,
                    hint: (insertError as any).hint,
                  });
                  errors.push({
                    message: `Error inserting to ${tableName} (${recordId}): ${insertError.message}`,
                    code: insertError.code || 'INSERT_ERROR',
                    httpStatus: (insertError as any).status || 500,
                    details: (insertError as any).details || JSON.stringify(insertError),
                    hint: (insertError as any).hint,
                    table: tableName,
                  });
                  errorCount++;
                } else {
                  syncedCount++;
                }
              }
            } else {
              // Record doesn't exist in source - delete from target
              const { error: deleteError } = await targetClient
                .from(tableName)
                .delete()
                .eq(idField, recordId);

              if (deleteError) {
                errors.push({
                  message: `Error deleting from ${tableName} (${recordId}): ${deleteError.message}`,
                  code: deleteError.code,
                  httpStatus: (deleteError as any).status || 500,
                  details: (deleteError as any).details,
                  hint: (deleteError as any).hint,
                  table: tableName,
                });
                errorCount++;
              } else {
                syncedCount++;
              }
            }
          }
          } catch (err: any) {
            console.error(`[supabase-sync] Exception processing ${tableName}:`, err);
            const structuredError = formatSupabaseError(err, tableName);
            structuredError.message = `Error processing ${tableName}: ${structuredError.message}`;
            if (!structuredError.code) structuredError.code = 'EXCEPTION';
            if (!structuredError.httpStatus) structuredError.httpStatus = 500;
            errors.push(structuredError);
            errorCount++;
          }

          console.log(`[supabase-sync] Table ${tableName} sync complete: ${syncedCount} synced, ${errorCount} errors`);

          return new Response(JSON.stringify({ 
            success: errorCount === 0,
            tableName,
            syncedCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (outerErr: any) {
          // Catch any errors that occur outside the inner try-catch
          console.error(`[supabase-sync] Outer exception in apply-data-sync-table:`, outerErr);
          const structuredError = formatSupabaseError(outerErr, tableName);
          return new Response(JSON.stringify({ 
            success: false,
            error: structuredError.message || 'Unknown error occurred',
            code: structuredError.code || 'EXCEPTION',
            httpStatus: structuredError.httpStatus || 500,
            details: structuredError.details || outerErr?.stack || JSON.stringify(outerErr),
            hint: structuredError.hint,
            tableName: params?.tableName,
            syncedCount: 0,
            errorCount: 1,
            errors: [structuredError]
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: structuredError.httpStatus || 500,
          });
        }
      }

      case 'apply-storage-sync': {
        const { selectedBuckets, direction } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig || !devConfig.supabase_access_token) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment or access token configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const prodProjectRef = getProdProjectRef();
        const devProjectRef = devConfig.supabase_project_ref;
        const accessToken = devConfig.supabase_access_token;

        const sourceRef = direction === 'prod_to_dev' ? prodProjectRef : devProjectRef;
        const targetRef = direction === 'prod_to_dev' ? devProjectRef : prodProjectRef;

        console.log(`[supabase-sync] Syncing ${selectedBuckets.length} storage buckets from ${sourceRef} to ${targetRef}...`);

        // Fetch source buckets configuration
        const sourceResponse = await fetch(
          `https://api.supabase.com/v1/projects/${sourceRef}/config/storage`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!sourceResponse.ok) {
          const errorText = await sourceResponse.text();
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to fetch source storage config: ${errorText}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Note: Storage bucket sync is complex and may require manual intervention
        // This is a simplified implementation that logs the intended changes

        // Log the sync
        await supabase.from('sync_logs').insert({
          sync_type: 'storage_sync',
          direction,
          status: 'success',
          details: { 
            source_project_ref: sourceRef,
            target_project_ref: targetRef,
            buckets_synced: selectedBuckets
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: `Storage bucket configuration sync logged. ${selectedBuckets.length} bucket(s) marked for sync. Note: Actual bucket creation/modification may require manual steps.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-system-tables': {
        // Return the list of system tables for progress tracking
        return new Response(JSON.stringify({
          success: true,
          tables: SYSTEM_TABLES.map(t => t.name)
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'compare-data-table': {
        const { tableName } = params;
        const devConfig = await getDevConfig();
        
        if (!devConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No dev environment configured' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const tableConfig = SYSTEM_TABLES.find(t => t.name === tableName);
        if (!tableConfig) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Unknown table: ${tableName}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log(`[supabase-sync] Comparing single table: ${tableName}`);
        const devClient = createClient(devConfig.supabase_url.trim(), devConfig.supabase_service_role_key.trim());

        try {
          const [prodResult, devResult] = await Promise.all([
            supabase.from(tableName).select('*'),
            devClient.from(tableName).select('*')
          ]);

          if (prodResult.error) {
            console.error(`[supabase-sync] Error fetching prod ${tableName}:`, prodResult.error);
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Prod error: ${prodResult.error.message}` 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (devResult.error) {
            console.error(`[supabase-sync] Error fetching dev ${tableName}:`, devResult.error);
            return new Response(JSON.stringify({ 
              success: false, 
              error: `Dev error: ${devResult.error.message}` 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const records = compareRecords(
            prodResult.data || [],
            devResult.data || [],
            tableConfig.identifierField,
            tableConfig.displayField
          );

          return new Response(JSON.stringify({
            success: true,
            comparison: { tableName, records }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (err) {
          console.error(`[supabase-sync] Error comparing ${tableName}:`, err);
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Failed to compare table: ${err instanceof Error ? err.message : 'Unknown error'}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error: any) {
    console.error('[supabase-sync] Top-level error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const errorDetails = error?.details || error?.stack;
    
    logger.fail(error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      code: errorCode,
      httpStatus: error?.status || error?.httpStatus || 500,
      details: errorDetails,
      hint: error?.hint
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error?.status || error?.httpStatus || 500,
    });
  }
});