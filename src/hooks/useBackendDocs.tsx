import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
}

export interface RlsPolicy {
  name: string;
  command: string;
  permissive: string;
  using_expression: string | null;
  with_check_expression: string | null;
}

export interface ForeignKey {
  column: string;
  references_table: string;
  references_column: string;
}

export interface TableInfo {
  name: string;
  columns: TableColumn[];
  rls_policies: RlsPolicy[];
  foreign_keys: ForeignKey[];
  rls_enabled: boolean;
}

export interface EnumInfo {
  name: string;
  values: string[];
}

export interface DbFunction {
  name: string;
  return_type: string;
  arguments: string;
  language: string;
}

export interface StorageBucket {
  name: string;
  is_public: boolean;
}

export interface SchemaData {
  generated_at: string;
  tables: TableInfo[];
  enums: EnumInfo[];
  functions: DbFunction[];
  storage_buckets: StorageBucket[];
}

export interface EdgeFunctionInfo {
  name: string;
  verify_jwt: boolean;
}

export interface SecretInfo {
  name: string;
  is_configured: boolean;
}

export interface BackendDocs {
  schema: SchemaData | null;
  edgeFunctions: EdgeFunctionInfo[];
  secrets: SecretInfo[];
}

// Known secrets that should be configured
const KNOWN_SECRETS = [
  'OPENROUTER_API_KEY',
  'RESEND_API_KEY',
  'LOVABLE_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'REPLICATE_API_KEY',
  'SUPABASE_DB_URL',
];

// Edge functions from config.toml (parsed at build time)
const EDGE_FUNCTIONS: EdgeFunctionInfo[] = [
  { name: 'chat', verify_jwt: false },
  { name: 'process-system-event', verify_jwt: false },
  { name: 'manage-email-template', verify_jwt: false },
  { name: 'manage-email-rule', verify_jwt: false },
  { name: 'sync-openrouter-models', verify_jwt: false },
  { name: 'generate-image', verify_jwt: false },
  { name: 'process-document', verify_jwt: false },
  { name: 'query-knowledge-base', verify_jwt: false },
  { name: 'send-workspace-invitation', verify_jwt: false },
  { name: 'accept-workspace-invitation', verify_jwt: false },
  { name: 'check-budget', verify_jwt: false },
  { name: 'send-email', verify_jwt: false },
  { name: 'manage-email-provider', verify_jwt: false },
  { name: 'migrate-media', verify_jwt: false },
  { name: 'upload-assets', verify_jwt: false },
  { name: 'enhance-prompt', verify_jwt: false },
  { name: 'cleanup-files', verify_jwt: false },
  { name: 'check-file-quota', verify_jwt: false },
  { name: 'save-response-to-file', verify_jwt: false },
  { name: 'create-user', verify_jwt: false },
  { name: 'update-user-password', verify_jwt: false },
  { name: 'update-user', verify_jwt: false },
  { name: 'generate-docs', verify_jwt: false },
  { name: 'track-usage', verify_jwt: false },
  { name: 'check-quota', verify_jwt: false },
  { name: 'manage-subscription', verify_jwt: false },
  { name: 'purchase-credits', verify_jwt: false },
  { name: 'billing-webhooks', verify_jwt: false },
];

export function useBackendDocs() {
  const { toast } = useToast();
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [edgeFunctions] = useState<EdgeFunctionInfo[]>(EDGE_FUNCTIONS);
  const [secrets] = useState<SecretInfo[]>(
    KNOWN_SECRETS.map(name => ({ name, is_configured: true }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-docs');
      
      if (fnError) {
        throw fnError;
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setSchema(data as SchemaData);
      toast({
        title: 'Schema refreshed',
        description: `Loaded ${data?.tables?.length || 0} tables, ${data?.enums?.length || 0} enums, ${data?.functions?.length || 0} functions`,
      });
    } catch (err: any) {
      console.error('Failed to fetch schema:', err);
      setError(err.message || 'Failed to fetch schema');
      toast({
        title: 'Failed to fetch schema',
        description: err.message || 'An error occurred while fetching the database schema',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(async () => {
    await fetchSchema();
  }, [fetchSchema]);

  return {
    schema,
    edgeFunctions,
    secrets,
    isLoading,
    error,
    refresh,
    fetchSchema,
  };
}
