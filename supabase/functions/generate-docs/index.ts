import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger } from "../_shared/edgeLogger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
}

interface RlsPolicy {
  name: string;
  command: string;
  permissive: string;
  using_expression: string | null;
  with_check_expression: string | null;
}

interface ForeignKey {
  column: string;
  references_table: string;
  references_column: string;
}

interface TableInfo {
  name: string;
  columns: TableColumn[];
  rls_policies: RlsPolicy[];
  foreign_keys: ForeignKey[];
  rls_enabled: boolean;
}

interface EnumInfo {
  name: string;
  values: string[];
}

interface DbFunction {
  name: string;
  return_type: string;
  arguments: string;
  language: string;
}

interface StorageBucket {
  name: string;
  is_public: boolean;
}

interface SchemaData {
  generated_at: string;
  tables: TableInfo[];
  enums: EnumInfo[];
  functions: DbFunction[];
  storage_buckets: StorageBucket[];
}

Deno.serve(async (req) => {
  const logger = createLogger('generate-docs');
  const startTime = Date.now();
  logger.start({ method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logger.info('Fetching database schema documentation');

    // 1. Get all tables and columns
    const { data: columnsData, error: columnsError } = await supabase.rpc('get_schema_columns');
    
    let columns: any[] = [];
    if (columnsError) {
      logger.debug('Using fallback query for columns');
      // Fallback: query information_schema directly
      const { data, error } = await supabase
        .from('information_schema.columns' as any)
        .select('table_name, column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public');
      
      if (!error && data) {
        columns = data;
      }
    } else {
      columns = columnsData || [];
    }

    // 2. Get RLS policies
    const { data: policiesData, error: policiesError } = await supabase.rpc('get_rls_policies');
    
    let policies: any[] = [];
    if (!policiesError && policiesData) {
      policies = policiesData;
    }

    // 3. Get enums
    const { data: enumsData, error: enumsError } = await supabase.rpc('get_enum_types');
    
    let enums: EnumInfo[] = [];
    if (!enumsError && enumsData) {
      const enumMap = new Map<string, string[]>();
      enumsData.forEach((e: any) => {
        if (!enumMap.has(e.type_name)) {
          enumMap.set(e.type_name, []);
        }
        enumMap.get(e.type_name)!.push(e.enum_label);
      });
      enums = Array.from(enumMap.entries()).map(([name, values]) => ({ name, values }));
    }

    // 4. Get database functions
    const { data: functionsData, error: functionsError } = await supabase.rpc('get_db_functions');
    
    let functions: DbFunction[] = [];
    if (!functionsError && functionsData) {
      functions = functionsData.map((f: any) => ({
        name: f.routine_name,
        return_type: f.data_type || 'void',
        arguments: f.routine_arguments || '',
        language: f.routine_language || 'plpgsql',
      }));
    }

    // 5. Get storage buckets
    const { data: bucketsData, error: bucketsError } = await supabase
      .from('storage.buckets' as any)
      .select('id, name, public');
    
    let storageBuckets: StorageBucket[] = [];
    if (!bucketsError && bucketsData) {
      storageBuckets = bucketsData.map((b: any) => ({
        name: b.name || b.id,
        is_public: b.public || false,
      }));
    }

    // 6. Get foreign keys
    const { data: fkData, error: fkError } = await supabase.rpc('get_foreign_keys');
    
    let foreignKeys: any[] = [];
    if (!fkError && fkData) {
      foreignKeys = fkData;
    }

    // 7. Get RLS enabled status per table
    const { data: rlsStatusData, error: rlsStatusError } = await supabase.rpc('get_rls_status');
    
    let rlsStatus: Map<string, boolean> = new Map();
    if (!rlsStatusError && rlsStatusData) {
      rlsStatusData.forEach((r: any) => {
        rlsStatus.set(r.table_name, r.rls_enabled);
      });
    }

    // Build tables structure
    const tableMap = new Map<string, TableInfo>();
    
    // Add columns to tables
    columns.forEach((col: any) => {
      const tableName = col.table_name;
      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          name: tableName,
          columns: [],
          rls_policies: [],
          foreign_keys: [],
          rls_enabled: rlsStatus.get(tableName) || false,
        });
      }
      tableMap.get(tableName)!.columns.push({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        default_value: col.column_default,
      });
    });

    // Add RLS policies to tables
    policies.forEach((policy: any) => {
      const tableName = policy.tablename;
      if (tableMap.has(tableName)) {
        tableMap.get(tableName)!.rls_policies.push({
          name: policy.policyname,
          command: policy.cmd,
          permissive: policy.permissive,
          using_expression: policy.qual,
          with_check_expression: policy.with_check,
        });
      }
    });

    // Add foreign keys to tables
    foreignKeys.forEach((fk: any) => {
      const tableName = fk.table_name;
      if (tableMap.has(tableName)) {
        tableMap.get(tableName)!.foreign_keys.push({
          column: fk.column_name,
          references_table: fk.foreign_table_name,
          references_column: fk.foreign_column_name,
        });
      }
    });

    const schemaData: SchemaData = {
      generated_at: new Date().toISOString(),
      tables: Array.from(tableMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      enums,
      functions,
      storage_buckets: storageBuckets,
    };

    logger.complete(Date.now() - startTime, { 
      tables: schemaData.tables.length, 
      enums: schemaData.enums.length, 
      functions: schemaData.functions.length, 
      buckets: schemaData.storage_buckets.length 
    });

    return new Response(JSON.stringify(schemaData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    logger.fail(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
