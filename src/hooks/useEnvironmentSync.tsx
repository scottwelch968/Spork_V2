import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DevEnvironmentConfig {
  supabase_url: string;
  supabase_project_ref: string;
  supabase_anon_key: string;
  supabase_service_role_key: string;
  supabase_access_token: string;
}

export interface SecretInfo {
  name: string;
}

export interface SecretsComparison {
  onlyInProd: SecretInfo[];
  onlyInDev: SecretInfo[];
  inBoth: SecretInfo[];
}

export interface SyncLog {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  details: Record<string, unknown>;
  sql_executed?: string;
  created_by?: string;
  created_at: string;
}

export interface TableDiff {
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  columns?: ColumnDiff[];
}

export interface ColumnDiff {
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodType?: string;
  devType?: string;
  prodNullable?: boolean;
  devNullable?: boolean;
  prodDefault?: string;
  devDefault?: string;
}

export interface PolicyDiff {
  tableName: string;
  policyName: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodDefinition?: string;
  devDefinition?: string;
}

export interface FunctionDiff {
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodDefinition?: string;
  devDefinition?: string;
}

export interface SchemaComparison {
  tables: TableDiff[];
  policies: PolicyDiff[];
  functions: FunctionDiff[];
}

export interface RecordDiff {
  id: string;
  displayName: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  changedFields?: string[];
  prodData?: Record<string, unknown>;
  devData?: Record<string, unknown>;
}

export interface TableDataComparison {
  tableName: string;
  records: RecordDiff[];
}

export interface DataComparison {
  tables: TableDataComparison[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export interface EdgeFunctionDiff {
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodVersion?: string;
  devVersion?: string;
  prodCreatedAt?: string;
  devCreatedAt?: string;
}

export interface EdgeFunctionsComparison {
  functions: EdgeFunctionDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export interface StorageBucketDiff {
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodPublic?: boolean;
  devPublic?: boolean;
  prodFileSizeLimit?: number | null;
  devFileSizeLimit?: number | null;
  prodMimeTypes?: string[] | null;
  devMimeTypes?: string[] | null;
  changedFields?: string[];
}

export interface StorageBucketsComparison {
  buckets: StorageBucketDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export interface AuthConfigFieldDiff {
  fieldName: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  prodValue?: unknown;
  devValue?: unknown;
  group: string;
}

export interface AuthConfigComparison {
  fields: AuthConfigFieldDiff[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

export interface ErrorLogEntry {
  timestamp: Date;
  message: string;
  table?: string;
  code?: string;
  httpStatus?: number;
  details?: string;
  hint?: string;
}

export interface StructuredError {
  message: string;
  code?: string;
  httpStatus?: number;
  details?: string;
  hint?: string;
  table?: string;
}

export interface ComparisonProgress {
  phase: 'idle' | 'comparing' | 'generating-sql' | 'syncing' | 'complete' | 'error';
  currentTable?: string;
  currentTableIndex?: number;
  totalTables: number;
  completedTables: string[];
  failedTables: string[];
  startTime?: Date;
  
  // SQL generation phase
  sqlGenerated?: boolean;
  sqlPreview?: string;
  sqlStatementCount?: number;
  
  // Sync phase
  syncingTable?: string;
  syncedTables: string[];
  syncFailedTables: string[];
  syncedCount: number;
  errorCount: number;
  
  // Error log
  errorLog: ErrorLogEntry[];
}

export function useEnvironmentSync() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [devConfig, setDevConfig] = useState<DevEnvironmentConfig | null>(null);
  const [prodSecrets, setProdSecrets] = useState<SecretInfo[]>([]);
  const [devSecrets, setDevSecrets] = useState<SecretInfo[]>([]);
  const [comparison, setComparison] = useState<SecretsComparison | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [schemaComparison, setSchemaComparison] = useState<SchemaComparison | null>(null);
  const [dataComparison, setDataComparison] = useState<DataComparison | null>(null);
  const [edgeFunctionsComparison, setEdgeFunctionsComparison] = useState<EdgeFunctionsComparison | null>(null);
  const [storageBucketsComparison, setStorageBucketsComparison] = useState<StorageBucketsComparison | null>(null);
  const [authConfigComparison, setAuthConfigComparison] = useState<AuthConfigComparison | null>(null);
  const [comparisonProgress, setComparisonProgress] = useState<ComparisonProgress | null>(null);

  const invokeSync = async (action: string, params: Record<string, unknown> = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-sync', {
        body: { action, ...params }
      });

      if (error) {
        // Supabase edge function error (HTTP level)
        // Try to extract more details from the error
        console.error('[invokeSync] Raw error object:', error);
        console.error('[invokeSync] Error keys:', Object.keys(error));
        
        const errorDetails = (error as any).context || (error as any).response || (error as any).body;
        const errorMessage = error.message || (error as any).msg || 'Edge Function returned a non-2xx status code';
        const errorStatus = (error as any).status || (error as any).statusCode || (error as any).code || 500;
        
        // Try to parse error body if it's a string
        let parsedDetails = errorDetails;
        if (typeof errorDetails === 'string') {
          try {
            parsedDetails = JSON.parse(errorDetails);
          } catch {
            parsedDetails = errorDetails;
          }
        }
        
        const structuredError: StructuredError = {
          message: errorMessage,
          httpStatus: errorStatus,
          code: 'EDGE_FUNCTION_ERROR',
          details: parsedDetails ? (typeof parsedDetails === 'string' ? parsedDetails : JSON.stringify(parsedDetails, null, 2)) : undefined,
        };
        console.error('[invokeSync] Structured error:', JSON.stringify(structuredError, null, 2));
        throw structuredError;
      }

      if (!data || !data.success) {
        // Application-level error from edge function
        // Check if there are errors array with more details
        const firstError = Array.isArray(data?.errors) && data.errors.length > 0 
          ? data.errors[0] 
          : null;
        
        const errorMessage = data?.error || firstError?.message || 'Unknown error occurred';
        const errorCode = data?.code || firstError?.code || 'UNKNOWN_ERROR';
        const errorHttpStatus = data?.httpStatus || firstError?.httpStatus || 500;
        const errorDetails = data?.details || firstError?.details || (data?.errors ? JSON.stringify(data.errors, null, 2) : undefined);
        const errorHint = data?.hint || firstError?.hint;
        
        const structuredError: StructuredError = {
          message: errorMessage,
          code: errorCode,
          httpStatus: errorHttpStatus,
          details: errorDetails,
          hint: errorHint,
        };
        console.error('[invokeSync] Application error - Full data:', JSON.stringify(data, null, 2));
        console.error('[invokeSync] Structured error:', JSON.stringify(structuredError, null, 2));
        throw structuredError;
      }

      return data;
    } catch (err: any) {
      // If it's already a StructuredError, re-throw it
      if (err.code && err.httpStatus) {
        throw err;
      }
      // Otherwise, wrap it
      const structuredError: StructuredError = {
        message: err?.message || 'Unknown error occurred',
        code: err?.code || 'EXCEPTION',
        httpStatus: err?.httpStatus || err?.status || 500,
        details: err?.details || err?.stack,
        hint: err?.hint,
      };
      console.error('[invokeSync] Unexpected error:', structuredError);
      throw structuredError;
    }
  };

  const fetchDevConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('get-dev-config');
      setDevConfig(data.config);
      return data.config;
    } catch (error) {
      console.error('Failed to fetch dev config:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveDevConfig = useCallback(async (config: DevEnvironmentConfig) => {
    setIsLoading(true);
    try {
      await invokeSync('save-dev-config', { config });
      setDevConfig(config);
      toast({
        title: 'Configuration saved',
        description: 'Development environment configuration has been saved.',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to save configuration',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const testConnection = useCallback(async (environment: 'prod' | 'dev', config?: DevEnvironmentConfig) => {
    setIsLoading(true);
    try {
      await invokeSync('test-connection', { environment, config });
      toast({
        title: 'Connection successful',
        description: `Successfully connected to ${environment === 'prod' ? 'production' : 'development'} environment.`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const listSecrets = useCallback(async (environment: 'prod' | 'dev') => {
    setIsLoading(true);
    try {
      const data = await invokeSync('list-secrets', { environment });
      if (environment === 'prod') {
        setProdSecrets(data.secrets);
      } else {
        setDevSecrets(data.secrets);
      }
      return data.secrets;
    } catch (error) {
      toast({
        title: 'Failed to list secrets',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const compareSecrets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-secrets');
      setComparison(data.comparison);
      setProdSecrets(data.prodSecrets);
      setDevSecrets(data.devSecrets);
      return data.comparison;
    } catch (error) {
      toast({
        title: 'Failed to compare secrets',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createSecret = useCallback(async (environment: 'prod' | 'dev', name: string, value: string) => {
    setIsLoading(true);
    try {
      await invokeSync('create-secret', { environment, name, value });
      toast({
        title: 'Secret created',
        description: `Secret "${name}" has been created in ${environment === 'prod' ? 'production' : 'development'}.`,
      });
      // Refresh the secrets list
      await listSecrets(environment);
      return true;
    } catch (error) {
      toast({
        title: 'Failed to create secret',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, listSecrets]);

  const deleteSecret = useCallback(async (environment: 'prod' | 'dev', names: string[]) => {
    setIsLoading(true);
    try {
      await invokeSync('delete-secret', { environment, names });
      toast({
        title: 'Secret(s) deleted',
        description: `${names.length} secret(s) have been deleted from ${environment === 'prod' ? 'production' : 'development'}.`,
      });
      // Refresh the secrets list
      await listSecrets(environment);
      return true;
    } catch (error) {
      toast({
        title: 'Failed to delete secret(s)',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, listSecrets]);

  const bulkCreateSecrets = useCallback(async (
    environment: 'prod' | 'dev', 
    secrets: Array<{ name: string; value: string }>
  ) => {
    setIsLoading(true);
    try {
      await invokeSync('bulk-create-secrets', { environment, secrets });
      toast({
        title: 'Secrets synced',
        description: `${secrets.length} secret(s) have been synced to ${environment === 'prod' ? 'production' : 'development'}.`,
      });
      // Refresh comparison
      await compareSecrets();
      return true;
    } catch (error) {
      toast({
        title: 'Failed to sync secrets',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, compareSecrets]);

  const getSyncLogs = useCallback(async (limit = 50) => {
    try {
      const data = await invokeSync('get-sync-logs', { limit });
      setSyncLogs(data.logs || []);
      return data.logs;
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
      return [];
    }
  }, []);

  const compareSchemas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-schemas');
      setSchemaComparison(data.comparison);
      toast({
        title: 'Schema comparison complete',
        description: `Found ${data.comparison.tables.filter((t: TableDiff) => t.status !== 'unchanged').length} table differences, ${data.comparison.policies.filter((p: PolicyDiff) => p.status !== 'unchanged').length} policy differences, ${data.comparison.functions.filter((f: FunctionDiff) => f.status !== 'unchanged').length} function differences.`,
      });
      return data.comparison;
    } catch (error: unknown) {
      const structuredError = error as StructuredError;
      const message = structuredError.message || 'Unknown error';
      const hint = structuredError.hint;
      
      toast({
        title: 'Failed to compare schemas',
        description: hint ? `${message}. ${hint}` : message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateMigrationSql = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('generate-migration-sql');
      toast({
        title: 'Migration SQL generated',
        description: 'SQL has been generated based on schema differences.',
      });
      return data.sql;
    } catch (error) {
      toast({
        title: 'Failed to generate migration',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const compareSystemData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-data');
      setDataComparison(data.comparison);
      toast({
        title: 'Data comparison complete',
        description: `Found ${data.comparison.summary.added + data.comparison.summary.removed + data.comparison.summary.modified} differences across ${data.comparison.tables.length} tables.`,
      });
      return data.comparison;
    } catch (error) {
      toast({
        title: 'Failed to compare data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Get list of system tables for progress tracking
  const getSystemTables = useCallback(async (): Promise<string[]> => {
    try {
      const data = await invokeSync('get-system-tables');
      return data.tables || [];
    } catch (error) {
      console.error('Failed to get system tables:', error);
      return [];
    }
  }, []);

  // Compare system data with table-by-table progress tracking
  const compareSystemDataWithProgress = useCallback(async (
    onProgress?: (tableName: string, index: number, total: number) => void
  ) => {
    setIsLoading(true);
    
    try {
      // Get list of tables first
      const tables = await getSystemTables();
      
      if (tables.length === 0) {
        throw new Error('No system tables found');
      }

      setComparisonProgress({
        phase: 'comparing',
        totalTables: tables.length,
        completedTables: [],
        failedTables: [],
        startTime: new Date(),
        syncedTables: [],
        syncFailedTables: [],
        syncedCount: 0,
        errorCount: 0,
        errorLog: [],
      });

      const tableComparisons: TableDataComparison[] = [];
      let totalAdded = 0, totalRemoved = 0, totalModified = 0, totalUnchanged = 0;
      const completedTables: string[] = [];
      const failedTables: string[] = [];

      // Batch processing configuration - process 4 tables in parallel
      const BATCH_SIZE = 4;
      const batches: string[][] = [];
      for (let i = 0; i < tables.length; i += BATCH_SIZE) {
        batches.push(tables.slice(i, i + BATCH_SIZE));
      }

      // Process each batch in parallel
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const startIndex = batchIndex * BATCH_SIZE;
        
        // Update progress to show current batch
        setComparisonProgress(prev => ({
          ...prev!,
          currentTable: `Batch ${batchIndex + 1}/${batches.length}: ${batch.join(', ')}`,
          currentTableIndex: startIndex,
        }));
        
        onProgress?.(batch.join(', '), startIndex, tables.length);

        // Process all tables in batch simultaneously
        const batchResults = await Promise.allSettled(
          batch.map(async (tableName) => {
            const result = await invokeSync('compare-data-table', { tableName });
            return { tableName, result };
          })
        );

        // Process batch results
        for (let i = 0; i < batchResults.length; i++) {
          const outcome = batchResults[i];
          const tableName = batch[i];
          
          if (outcome.status === 'fulfilled') {
            const { result } = outcome.value;
            if (result.comparison) {
              tableComparisons.push(result.comparison);
              
              // Count stats from this table
              for (const r of result.comparison.records) {
                if (r.status === 'added') totalAdded++;
                else if (r.status === 'removed') totalRemoved++;
                else if (r.status === 'modified') totalModified++;
                else totalUnchanged++;
              }
            }
            completedTables.push(tableName);
          } else {
            console.error(`Failed to compare table ${tableName}:`, outcome.reason);
            failedTables.push(tableName);
          }
        }

        // Update progress after batch completes
        setComparisonProgress(prev => ({
          ...prev!,
          completedTables: [...completedTables],
          failedTables: [...failedTables],
        }));
      }

      // Combine all results
      const comparison: DataComparison = {
        tables: tableComparisons,
        summary: {
          added: totalAdded,
          removed: totalRemoved,
          modified: totalModified,
          unchanged: totalUnchanged,
        },
      };

      setDataComparison(comparison);
      setComparisonProgress(prev => ({ 
        ...prev!, 
        phase: 'complete',
        currentTable: undefined,
      }));

      toast({
        title: 'Data comparison complete',
        description: `Found ${totalAdded + totalRemoved + totalModified} differences across ${tableComparisons.length} tables.`,
      });

      return comparison;
    } catch (error) {
      setComparisonProgress(prev => prev ? { ...prev, phase: 'error' } : null);
      toast({
        title: 'Failed to compare data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getSystemTables]);

  const resetComparisonProgress = useCallback(() => {
    setComparisonProgress(null);
  }, []);

  const generateDataSyncSql = useCallback(async (
    selectedRecords: Record<string, Set<string>>,
    direction: 'prod_to_dev' | 'dev_to_prod'
  ) => {
    setIsLoading(true);
    try {
      // Convert Sets to arrays for JSON serialization
      const recordsPayload: Record<string, string[]> = {};
      for (const [table, ids] of Object.entries(selectedRecords)) {
        recordsPayload[table] = Array.from(ids);
      }

      const data = await invokeSync('generate-data-sync-sql', { 
        selectedRecords: recordsPayload, 
        direction 
      });
      toast({
        title: 'SQL generated',
        description: 'Data sync SQL has been generated.',
      });
      return data.sql;
    } catch (error) {
      toast({
        title: 'Failed to generate SQL',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const compareEdgeFunctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-edge-functions');
      setEdgeFunctionsComparison(data.comparison);
      toast({
        title: 'Edge functions comparison complete',
        description: `Found ${data.comparison.functions.filter((f: EdgeFunctionDiff) => f.status !== 'unchanged').length} differences.`,
      });
      return data.comparison;
    } catch (error: unknown) {
      const structuredError = error as StructuredError;
      const message = structuredError.message || 'Unknown error';
      const hint = structuredError.hint;
      
      toast({
        title: 'Failed to compare edge functions',
        description: hint ? `${message}. ${hint}` : message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getEdgeFunctionCode = useCallback(async (functionName: string) => {
    try {
      const data = await invokeSync('get-edge-function-code', { functionName });
      return {
        prodCode: data.prodCode,
        devCode: data.devCode,
      };
    } catch (error) {
      toast({
        title: 'Failed to fetch function code',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const compareStorageBuckets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-storage-buckets');
      setStorageBucketsComparison(data.comparison);
      toast({
        title: 'Storage buckets comparison complete',
        description: `Found ${data.comparison.buckets.filter((b: StorageBucketDiff) => b.status !== 'unchanged').length} differences.`,
      });
      return data.comparison;
    } catch (error) {
      toast({
        title: 'Failed to compare storage buckets',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateStorageSyncSql = useCallback(async (
    selectedBuckets: string[],
    direction: 'prod_to_dev' | 'dev_to_prod'
  ) => {
    setIsLoading(true);
    try {
      const data = await invokeSync('generate-storage-sync-sql', { selectedBuckets, direction });
      toast({
        title: 'SQL generated',
        description: 'Storage sync SQL has been generated.',
      });
      return data.sql;
    } catch (error) {
      toast({
        title: 'Failed to generate SQL',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const compareAuthConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await invokeSync('compare-auth-config');
      setAuthConfigComparison(data.comparison);
      toast({
        title: 'Auth config comparison complete',
        description: `Found ${data.comparison.fields.filter((f: AuthConfigFieldDiff) => f.status !== 'unchanged').length} differences.`,
      });
      return data.comparison;
    } catch (error) {
      toast({
        title: 'Failed to compare auth config',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const applyAuthConfig = useCallback(async (
    selectedFields: string[],
    direction: 'prod_to_dev' | 'dev_to_prod'
  ) => {
    setIsLoading(true);
    try {
      const data = await invokeSync('apply-auth-config', { selectedFields, direction });
      toast({
        title: 'Auth config applied',
        description: `Successfully applied ${selectedFields.length} setting(s).`,
      });
      return data.success;
    } catch (error) {
      toast({
        title: 'Failed to apply auth config',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply schema migration
  const applySchemaSync = useCallback(async (direction: 'prod_to_dev' | 'dev_to_prod') => {
    setIsLoading(true);
    try {
      const data = await invokeSync('apply-schema-sync', { direction });
      toast({
        title: 'Schema sync applied',
        description: data.message || 'Schema changes have been applied.',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to apply schema sync',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply data sync - returns detailed result for UI progress with table-by-table updates
  const applyDataSync = useCallback(async (
    selectedRecords: Record<string, Set<string>>,
    direction: 'prod_to_dev' | 'dev_to_prod',
    onProgress?: (update: {
      syncingTable: string | undefined;
      syncedTables: string[];
      syncFailedTables: string[];
      syncedCount: number;
      errorCount: number;
    }) => void
  ): Promise<{ success: boolean; syncedCount: number; errorCount: number; errors?: StructuredError[] }> => {
    setIsLoading(true);
    
    // Get list of tables with selected records
    const tablesToSync = Object.entries(selectedRecords)
      .filter(([_, ids]) => ids.size > 0)
      .map(([tableName, ids]) => ({ tableName, recordIds: Array.from(ids) }));
    
    let totalSyncedCount = 0;
    let totalErrorCount = 0;
    const allErrors: StructuredError[] = [];
    const syncedTables: string[] = [];
    const syncFailedTables: string[] = [];
    
    try {
      // Process each table individually for real-time progress
      for (let i = 0; i < tablesToSync.length; i++) {
        const { tableName, recordIds } = tablesToSync[i];
        
        // Report progress - currently syncing this table
        onProgress?.({
          syncingTable: tableName,
          syncedTables: [...syncedTables],
          syncFailedTables: [...syncFailedTables],
          syncedCount: totalSyncedCount,
          errorCount: totalErrorCount,
        });
        
        try {
          // Call edge function for single table
          const data = await invokeSync('apply-data-sync-table', { 
            tableName,
            recordIds,
            direction 
          });
          
          const tableSyncedCount = data.syncedCount || 0;
          const tableErrorCount = data.errorCount || 0;
          // Errors from edge function are now structured objects
          const tableErrors: StructuredError[] = (data.errors || []).map((err: any) => 
            typeof err === 'string' 
              ? { message: err, table: tableName } 
              : { ...err, table: err.table || tableName }
          );
          
          totalSyncedCount += tableSyncedCount;
          totalErrorCount += tableErrorCount;
          allErrors.push(...tableErrors);
          
          if (tableErrorCount === 0) {
            syncedTables.push(tableName);
          } else {
            syncFailedTables.push(tableName);
          }
        } catch (error: any) {
          console.error(`[applyDataSync] Error syncing table ${tableName}:`, error);
          console.error(`[applyDataSync] Full error object:`, JSON.stringify(error, null, 2));
          syncFailedTables.push(tableName);
          totalErrorCount++;
          
          // Extract all available error information
          const errorMessage = error?.message || error?.error || 'Unknown error';
          const errorCode = error?.code || 'SYNC_ERROR';
          const errorHttpStatus = error?.httpStatus || error?.status || 500;
          const errorDetails = error?.details || error?.context || (error?.response ? JSON.stringify(error.response) : undefined);
          const errorHint = error?.hint;
          
          // Preserve structured error info
          allErrors.push({
            message: `Error syncing ${tableName}: ${errorMessage}`,
            code: errorCode,
            httpStatus: errorHttpStatus,
            details: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
            hint: errorHint,
            table: tableName,
          });
        }
        
        // Report progress after each table
        onProgress?.({
          syncingTable: i < tablesToSync.length - 1 ? tablesToSync[i + 1]?.tableName : undefined,
          syncedTables: [...syncedTables],
          syncFailedTables: [...syncFailedTables],
          syncedCount: totalSyncedCount,
          errorCount: totalErrorCount,
        });
      }
      
      // Show final toast
      if (totalErrorCount === 0) {
        toast({
          title: 'Data sync completed',
          description: `Successfully synced ${totalSyncedCount} record(s) across ${syncedTables.length} table(s).`,
        });
      } else if (totalSyncedCount > 0) {
        toast({
          title: 'Data sync partially completed',
          description: `Synced ${totalSyncedCount} record(s), ${totalErrorCount} error(s). Check sync logs for details.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Data sync failed',
          description: `${totalErrorCount} error(s) occurred. Check sync logs for details.`,
          variant: 'destructive',
        });
      }
      
      return { success: totalErrorCount === 0, syncedCount: totalSyncedCount, errorCount: totalErrorCount, errors: allErrors };
    } catch (error) {
      toast({
        title: 'Failed to apply data sync',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return { success: false, syncedCount: totalSyncedCount, errorCount: totalErrorCount + 1, errors: [...allErrors, { message: error instanceof Error ? error.message : 'Unknown error', httpStatus: 500 }] };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Apply storage sync
  const applyStorageSync = useCallback(async (
    selectedBuckets: string[],
    direction: 'prod_to_dev' | 'dev_to_prod'
  ) => {
    setIsLoading(true);
    try {
      const data = await invokeSync('apply-storage-sync', { selectedBuckets, direction });
      toast({
        title: 'Storage sync applied',
        description: data.message || 'Storage bucket changes have been applied.',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Failed to apply storage sync',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Batch sync all categories
  const batchSync = useCallback(async (
    direction: 'prod_to_dev' | 'dev_to_prod',
    categories: string[],
    onProgress?: (category: string, status: 'running' | 'success' | 'error') => void
  ): Promise<{ success: boolean; results: Array<{ category: string; success: boolean; error?: string }> }> => {
    const results: Array<{ category: string; success: boolean; error?: string }> = [];
    
    for (const category of categories) {
      onProgress?.(category, 'running');
      
      try {
        switch (category) {
          case 'secrets': {
            // For secrets, sync all that exist only in source environment
            if (comparison) {
              const secretsToSync = direction === 'prod_to_dev' 
                ? comparison.onlyInProd 
                : comparison.onlyInDev;
              
              if (secretsToSync.length > 0) {
                // Note: For security, secrets need values - this creates placeholders
                // In a real scenario, you'd need to handle this differently
                toast({
                  title: 'Secrets sync note',
                  description: 'Secret values cannot be copied automatically. Please sync secrets manually in the Secrets tab.',
                  variant: 'default',
                });
              }
            }
            results.push({ category, success: true });
            break;
          }
          
          case 'schema': {
            const success = await applySchemaSync(direction);
            results.push({ category, success });
            break;
          }
          
          case 'data': {
            if (dataComparison) {
              // Auto-select all changed records
              const selectedRecords: Record<string, Set<string>> = {};
              for (const table of dataComparison.tables) {
                const changedRecords = table.records.filter(r => r.status !== 'unchanged');
                if (changedRecords.length > 0) {
                  selectedRecords[table.tableName] = new Set(changedRecords.map(r => r.id));
                }
              }
              
              if (Object.keys(selectedRecords).length > 0) {
                const result = await applyDataSync(selectedRecords, direction);
                results.push({ category, success: result.success });
              } else {
                results.push({ category, success: true });
              }
            } else {
              results.push({ category, success: true });
            }
            break;
          }
          
          case 'storage': {
            if (storageBucketsComparison) {
              const changedBuckets = storageBucketsComparison.buckets
                .filter(b => b.status !== 'unchanged')
                .map(b => b.name);
              
              if (changedBuckets.length > 0) {
                const success = await applyStorageSync(changedBuckets, direction);
                results.push({ category, success });
              } else {
                results.push({ category, success: true });
              }
            } else {
              results.push({ category, success: true });
            }
            break;
          }
          
          case 'auth-config': {
            if (authConfigComparison) {
              const changedFields = authConfigComparison.fields
                .filter(f => f.status !== 'unchanged')
                .map(f => f.fieldName);
              
              if (changedFields.length > 0) {
                const success = await applyAuthConfig(changedFields, direction);
                results.push({ category, success });
              } else {
                results.push({ category, success: true });
              }
            } else {
              results.push({ category, success: true });
            }
            break;
          }
          
          case 'edge-functions': {
            // Edge functions sync is complex - needs manual deployment
            toast({
              title: 'Edge functions note',
              description: 'Edge function code cannot be synced automatically. Please deploy functions manually.',
              variant: 'default',
            });
            results.push({ category, success: true });
            break;
          }
          
          default:
            results.push({ category, success: false, error: `Unknown category: ${category}` });
        }
        
        onProgress?.(category, 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ category, success: false, error: errorMessage });
        onProgress?.(category, 'error');
      }
    }
    
    const allSuccess = results.every(r => r.success);
    
    if (allSuccess) {
      toast({
        title: 'Batch sync complete',
        description: `Successfully synced ${categories.length} category(s).`,
      });
    } else {
      const failedCount = results.filter(r => !r.success).length;
      toast({
        title: 'Batch sync partially complete',
        description: `${failedCount} category(s) failed to sync.`,
        variant: 'destructive',
      });
    }
    
    return { success: allSuccess, results };
  }, [toast, comparison, dataComparison, storageBucketsComparison, authConfigComparison, applySchemaSync, applyDataSync, applyStorageSync, applyAuthConfig]);

  return {
    isLoading,
    devConfig,
    prodSecrets,
    devSecrets,
    comparison,
    syncLogs,
    schemaComparison,
    dataComparison,
    edgeFunctionsComparison,
    comparisonProgress,
    fetchDevConfig,
    saveDevConfig,
    testConnection,
    listSecrets,
    compareSecrets,
    createSecret,
    deleteSecret,
    bulkCreateSecrets,
    getSyncLogs,
    compareSchemas,
    generateMigrationSql,
    compareSystemData,
    compareSystemDataWithProgress,
    getSystemTables,
    resetComparisonProgress,
    generateDataSyncSql,
    compareEdgeFunctions,
    getEdgeFunctionCode,
    storageBucketsComparison,
    compareStorageBuckets,
    generateStorageSyncSql,
    authConfigComparison,
    compareAuthConfig,
    applyAuthConfig,
    applySchemaSync,
    applyDataSync,
    applyStorageSync,
    batchSync,
    setDataComparison,
  };
}