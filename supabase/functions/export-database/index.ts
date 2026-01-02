import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System tables to export data from
const SYSTEM_TABLES = [
  'ai_models',
  'fallback_models', 
  'system_settings',
  'persona_templates',
  'persona_categories',
  'space_templates',
  'space_categories',
  'prompt_templates',
  'prompt_categories',
  'subscription_tiers',
  'pricing_tiers',
  'credit_packages',
  'payment_processors',
  'discount_codes',
  'email_providers',
  'email_templates',
  'email_rules',
  'email_system_event_types',
  'admin_documentation',
  'ai_methodology_docs',
  'ai_prompt_library',
];

serve(async (req) => {
  const logger = createLogger('export-database');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, options } = await req.json();

    if (action === 'generate-export') {
      logger.info('Generating database export');
      
      const includeSchema = options?.includeSchema !== false;
      const includeData = options?.includeData !== false;
      const includeFunctions = options?.includeFunctions !== false;
      const includeRls = options?.includeRls !== false;

      const sqlStatements: string[] = [];
      
      // Header
      sqlStatements.push('-- =====================================================');
      sqlStatements.push('-- SPORK DATABASE EXPORT');
      sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
      sqlStatements.push('-- =====================================================');
      sqlStatements.push('');

      // 1. Export ENUM types
      if (includeSchema) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- ENUM TYPES');
        sqlStatements.push('-- =====================================================');
        
        const { data: enumData, error: enumError } = await supabase.rpc('get_enum_types');
        if (enumError) {
          logger.warn('Error fetching enums', { error: enumError.message });
        } else if (enumData && enumData.length > 0) {
          // Group by type_name
          const enumsByType: Record<string, string[]> = {};
          for (const row of enumData) {
            if (!enumsByType[row.type_name]) {
              enumsByType[row.type_name] = [];
            }
            enumsByType[row.type_name].push(row.enum_label);
          }
          
          for (const [typeName, labels] of Object.entries(enumsByType)) {
            sqlStatements.push(`DROP TYPE IF EXISTS public.${typeName} CASCADE;`);
            sqlStatements.push(`CREATE TYPE public.${typeName} AS ENUM (${labels.map(l => `'${l}'`).join(', ')});`);
            sqlStatements.push('');
          }
        }
      }

      // 2. Export Tables
      if (includeSchema) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- TABLES');
        sqlStatements.push('-- =====================================================');
        
        const { data: columns, error: colError } = await supabase.rpc('get_schema_columns');
        if (colError) {
          logger.warn('Error fetching columns', { error: colError.message });
        } else if (columns && columns.length > 0) {
          // Group by table
          const tableColumns: Record<string, any[]> = {};
          for (const col of columns) {
            if (!tableColumns[col.table_name]) {
              tableColumns[col.table_name] = [];
            }
            tableColumns[col.table_name].push(col);
          }

          // Get foreign keys
          const { data: fks } = await supabase.rpc('get_foreign_keys');
          const fkMap: Record<string, any[]> = {};
          if (fks) {
            for (const fk of fks) {
              if (!fkMap[fk.table_name]) {
                fkMap[fk.table_name] = [];
              }
              fkMap[fk.table_name].push(fk);
            }
          }

          for (const [tableName, cols] of Object.entries(tableColumns)) {
            sqlStatements.push(`-- Table: ${tableName}`);
            sqlStatements.push(`CREATE TABLE IF NOT EXISTS public.${tableName} (`);
            
            const colDefs: string[] = [];
            for (const col of cols) {
              let colDef = `  ${col.column_name} ${col.data_type}`;
              if (col.is_nullable === 'NO') {
                colDef += ' NOT NULL';
              }
              if (col.column_default) {
                colDef += ` DEFAULT ${col.column_default}`;
              }
              colDefs.push(colDef);
            }
            
            // Add foreign key constraints
            const tableFks = fkMap[tableName] || [];
            for (const fk of tableFks) {
              colDefs.push(`  CONSTRAINT fk_${tableName}_${fk.column_name} FOREIGN KEY (${fk.column_name}) REFERENCES public.${fk.foreign_table_name}(${fk.foreign_column_name})`);
            }
            
            sqlStatements.push(colDefs.join(',\n'));
            sqlStatements.push(');');
            sqlStatements.push('');
          }
        }
      }

      // 3. Export Database Functions
      if (includeFunctions) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- DATABASE FUNCTIONS');
        sqlStatements.push('-- =====================================================');
        
        const { data: functions, error: fnError } = await supabase.rpc('get_db_functions');
        if (fnError) {
          logger.warn('Error fetching functions', { error: fnError.message });
        } else if (functions && functions.length > 0) {
          for (const fn of functions) {
            if (fn.routine_definition) {
              sqlStatements.push(`-- Function: ${fn.routine_name}`);
              sqlStatements.push(`DROP FUNCTION IF EXISTS public.${fn.routine_name}() CASCADE;`);
              let def = fn.routine_definition;
              if (!def.trim().endsWith(';')) {
                def += ';';
              }
              sqlStatements.push(def);
              sqlStatements.push('');
            }
          }
        }
      }

      // 4. Enable RLS on all tables
      if (includeRls) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- ENABLE ROW LEVEL SECURITY');
        sqlStatements.push('-- =====================================================');
        
        const { data: rlsStatus } = await supabase.rpc('get_rls_status');
        if (rlsStatus) {
          for (const table of rlsStatus) {
            if (table.rls_enabled) {
              sqlStatements.push(`ALTER TABLE public.${table.table_name} ENABLE ROW LEVEL SECURITY;`);
            }
          }
          sqlStatements.push('');
        }
      }

      // 5. Export RLS Policies
      if (includeRls) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- RLS POLICIES');
        sqlStatements.push('-- =====================================================');
        
        const { data: policies, error: polError } = await supabase.rpc('get_rls_policies');
        if (polError) {
          logger.warn('Error fetching policies', { error: polError.message });
        } else if (policies && policies.length > 0) {
          for (const pol of policies) {
            sqlStatements.push(`-- Policy: ${pol.policyname} on ${pol.tablename}`);
            sqlStatements.push(`DROP POLICY IF EXISTS "${pol.policyname}" ON public.${pol.tablename};`);
            if (pol.policy_definition) {
              sqlStatements.push(pol.policy_definition);
            }
            sqlStatements.push('');
          }
        }
      }

      // 6. Export System Data
      if (includeData) {
        sqlStatements.push('-- =====================================================');
        sqlStatements.push('-- SYSTEM DATA');
        sqlStatements.push('-- =====================================================');
        
        for (const tableName of SYSTEM_TABLES) {
          try {
            const { data: tableData, error: dataError } = await supabase
              .from(tableName)
              .select('*');
            
            if (dataError) {
              sqlStatements.push(`-- Error fetching ${tableName}: ${dataError.message}`);
              continue;
            }
            
            if (tableData && tableData.length > 0) {
              sqlStatements.push(`-- Data for: ${tableName} (${tableData.length} rows)`);
              sqlStatements.push(`DELETE FROM public.${tableName};`);
              
              for (const row of tableData) {
                const columns = Object.keys(row);
                const values = columns.map(col => {
                  const val = row[col];
                  if (val === null) return 'NULL';
                  if (typeof val === 'boolean') return val ? 'true' : 'false';
                  if (typeof val === 'number') return val.toString();
                  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
                  return `'${String(val).replace(/'/g, "''")}'`;
                });
                
                sqlStatements.push(`INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
              }
              sqlStatements.push('');
            }
          } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            sqlStatements.push(`-- Skipped ${tableName}: ${errorMessage}`);
          }
        }
      }

      // 7. Add secrets reminder
      sqlStatements.push('-- =====================================================');
      sqlStatements.push('-- REQUIRED SECRETS (Configure in Supabase Dashboard)');
      sqlStatements.push('-- =====================================================');
      sqlStatements.push('-- OPENROUTER_API_KEY - For AI model access');
      sqlStatements.push('-- RESEND_API_KEY - For email functionality');
      sqlStatements.push('-- REPLICATE_API_KEY - For image/video generation');
      sqlStatements.push('-- LOVABLE_API_KEY - For Lovable AI gateway (optional)');
      sqlStatements.push('');
      sqlStatements.push('-- =====================================================');
      sqlStatements.push('-- END OF EXPORT');
      sqlStatements.push('-- =====================================================');

      const sqlContent = sqlStatements.join('\n');

      logger.complete(Date.now() - startTime, { 
        action: 'generate-export', 
        lines: sqlStatements.length 
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          sql: sqlContent,
          stats: {
            totalLines: sqlStatements.length,
            generatedAt: new Date().toISOString()
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list-secrets') {
      logger.info('Listing secrets');
      // Return list of known secrets that need to be configured
      const secrets = [
        { name: 'OPENROUTER_API_KEY', description: 'API key for OpenRouter AI models', required: true },
        { name: 'RESEND_API_KEY', description: 'API key for Resend email service', required: true },
        { name: 'REPLICATE_API_KEY', description: 'API key for Replicate image/video generation', required: false },
        { name: 'LOVABLE_API_KEY', description: 'API key for Lovable AI gateway (fallback)', required: false },
      ];

      logger.complete(Date.now() - startTime, { action: 'list-secrets' });
      return new Response(
        JSON.stringify({ success: true, secrets }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.warn('Unknown action', { action });
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
