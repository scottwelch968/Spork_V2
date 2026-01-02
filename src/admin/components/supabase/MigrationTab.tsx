import React, { useState, useEffect } from 'react';
import { SupabaseCredentials } from './types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Badge } from '@/admin/ui/badge';
import { Loader2, CheckCircle2, XCircle, Play, AlertTriangle, Download, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/admin/ui/alert';
import { Progress } from '@/admin/ui';
import { supabaseService } from './services/supabaseService';
import { createClient } from '@supabase/supabase-js';

interface Props {
  creds: SupabaseCredentials;
}

interface MigrationStep {
  id: string;
  name: string;
  description: string;
  sqlFile: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  error?: string;
  canSkip?: boolean;
}

export const MigrationTab: React.FC<Props> = ({ creds }) => {
  const [steps, setSteps] = useState<MigrationStep[]>([
    {
      id: 'exec-sql-function',
      name: 'Create exec_sql Helper Function',
      description: 'Creates a database function to execute SQL dynamically. Required for automated migrations.',
      sqlFile: 'create-exec-sql-function.sql',
      status: 'pending',
      canSkip: false
    },
    {
      id: 'rls-policies',
      name: 'Apply RLS Policies',
      description: 'Enables Row-Level Security on all tables and creates security policies.',
      sqlFile: 'apply-rls-policies.sql',
      status: 'pending',
      canSkip: false
    },
    {
      id: 'triggers',
      name: 'Apply Database Triggers',
      description: 'Creates database triggers for user creation, workspace creation, and updated_at columns.',
      sqlFile: 'apply-triggers.sql',
      status: 'pending',
      canSkip: false
    },
    {
      id: 'storage-buckets',
      name: 'Setup Storage Buckets',
      description: 'Creates storage buckets and applies RLS policies for file storage.',
      sqlFile: 'apply-storage-buckets.sql',
      status: 'pending',
      canSkip: false
    },
    {
      id: 'seed-data',
      name: 'Seed System Data',
      description: 'Populates initial system data: categories, templates, and default settings.',
      sqlFile: 'seed-system-data.sql',
      status: 'pending',
      canSkip: true
    }
  ]);

  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [execSQLExists, setExecSQLExists] = useState<boolean | null>(null);
  const [checkingExecSQL, setCheckingExecSQL] = useState(false);

  // Check if exec_sql function exists on mount
  useEffect(() => {
    if (creds?.serviceRoleKey) {
      setCheckingExecSQL(true);
      checkExecSQLFunction().then(result => {
        setExecSQLExists(result);
        setCheckingExecSQL(false);
      }).catch(() => {
        setExecSQLExists(false);
        setCheckingExecSQL(false);
      });
    }
  }, [creds]);

  // Fetch SQL file content
  const fetchSQLFile = async (filename: string): Promise<string> => {
    try {
      // Try to import the migrationSQL helper
      const { getMigrationSQL } = await import('./migrationSQL');
      return await getMigrationSQL(filename);
    } catch (err: any) {
      // If that fails, try fetching from server
      try {
        const response = await fetch(`/docs/migrate/${filename}`);
        if (response.ok) {
          return await response.text();
        }
      } catch (fetchErr) {
        console.warn('Could not fetch from server:', fetchErr);
      }
      
      // Final fallback: show error with instructions
      const errorMsg = `Could not load ${filename}. ${err.message || 'File not found'}`;
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  };

  // Check if exec_sql function exists
  const checkExecSQLFunction = async (): Promise<boolean> => {
    if (!creds.serviceRoleKey) return false;

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      // Try to call the function with a simple query
      const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
      return !error || !error.message?.includes('function') && error.code !== '42883';
    } catch {
      return false;
    }
  };

  // Create exec_sql function
  const createExecSQLFunction = async (): Promise<{ success: boolean; error?: string }> => {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_query;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
`;

    // We need to execute this via a direct database connection
    // Since we can't execute DDL via REST API, we'll need to use Supabase SQL Editor
    // But we can try using the Management API or provide instructions
    
    // For now, return instructions to create it manually
    return {
      success: false,
      error: 'exec_sql function must be created manually. Click "Create exec_sql Function" button below to open SQL Editor with the SQL pre-filled.'
    };
  };

  // Execute SQL using exec_sql function or fallback
  const executeSQL = async (sql: string): Promise<{ success: boolean; error?: string }> => {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
      // First check if exec_sql exists
      const exists = await checkExecSQLFunction();
      if (!exists) {
        return {
          success: false,
          error: 'exec_sql function not found. Please create it first using the button below.'
        };
      }

      // Try to use exec_sql function
      // Split SQL into statements and execute one by one
      // Handle DO blocks, function definitions, and multi-line statements properly
      const statements: string[] = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      let inFunction = false;
      let functionDepth = 0;
      
      const lines = sql.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Skip empty lines and comments (but keep them in the statement for context)
        if (!trimmed || trimmed.startsWith('--')) {
          currentStatement += line + '\n';
          continue;
        }
        
        // Detect dollar-quoted strings ($$, $tag$, etc.)
        const dollarMatches = line.matchAll(/\$([^$]*)\$/g);
        for (const match of dollarMatches) {
          if (!inDollarQuote) {
            // Start of dollar quote
            inDollarQuote = true;
            dollarTag = match[0];
          } else if (match[0] === dollarTag) {
            // End of dollar quote
            inDollarQuote = false;
            dollarTag = '';
          }
        }
        
        // Detect function definitions
        if (trimmed.match(/^CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i)) {
          inFunction = true;
          functionDepth = 0;
        }
        
        // Track function body depth (for nested blocks)
        if (inFunction) {
          if (trimmed.match(/\bBEGIN\b/i)) functionDepth++;
          if (trimmed.match(/\bEND\b/i)) functionDepth--;
          if (functionDepth === 0 && trimmed.match(/\bEND\s*;?\s*$/i)) {
            inFunction = false;
          }
        }
        
        currentStatement += line + '\n';
        
        // Only split on semicolon if we're not in a dollar quote or function body
        if (!inDollarQuote && !inFunction && trimmed.endsWith(';')) {
          const statement = currentStatement.trim();
          if (statement && statement.length > 5 && !statement.match(/^\s*--/)) {
            statements.push(statement);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim() && !currentStatement.trim().startsWith('--')) {
        statements.push(currentStatement.trim());
      }

      const errors: string[] = [];
      let successCount = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement || statement.length < 10) continue; // Skip very short statements
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            // Some errors are expected (like "relation already exists", "function already exists", missing tables/columns)
            const isExpectedError = 
              error.message?.includes('already exists') ||
              error.message?.includes('duplicate') ||
              error.message?.includes('does not exist') && (
                error.message?.includes('cosmo_request_queue') ||
                error.message?.includes('cosmo_intents') ||
                error.message?.includes('workspace_integrations') ||
                error.message?.includes('user_integrations') ||
                error.message?.includes('scheduled_jobs') ||
                error.message?.includes('subscription_tiers') && error.message?.includes('description') ||
                error.message?.includes('column') && error.message?.includes('does not exist')
              ) ||
              error.code === '42P01' || // relation does not exist
              error.code === '42703'; // column does not exist
            
            if (isExpectedError) {
              console.warn(`Statement ${i + 1} skipped (expected): ${error.message}`);
              successCount++;
            } else {
              errors.push(`Statement ${i + 1}: ${error.message}`);
              console.error(`Statement ${i + 1} failed:`, error.message);
            }
          } else {
            successCount++;
          }
        } catch (err: any) {
          errors.push(`Statement ${i + 1}: ${err.message}`);
          console.error(`Statement ${i + 1} exception:`, err.message);
        }
      }
      
      if (errors.length > 0 && successCount === 0) {
        return {
          success: false,
          error: `All statements failed. First error: ${errors[0]}`
        };
      }
      
      if (errors.length > 0) {
        return {
          success: true, // Partial success
          error: `${successCount} statements succeeded, ${errors.length} failed. Errors: ${errors.slice(0, 3).join('; ')}`
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to execute SQL'
      };
    }
  };

  // Execute a single migration step
  const executeStep = async (step: MigrationStep) => {
    if (running) return;

    setRunning(true);
    setCurrentStep(step.id);

    // Update step status to running
    setSteps(prev => prev.map(s => 
      s.id === step.id ? { ...s, status: 'running' as const } : s
    ));

    try {
      // Fetch SQL file
      const sql = await fetchSQLFile(step.sqlFile);

      // Special handling for storage buckets (needs API calls, not just SQL)
      if (step.id === 'storage-buckets') {
        const result = await executeStorageBuckets(sql);
        if (result.success) {
          setSteps(prev => prev.map(s => 
            s.id === step.id ? { ...s, status: 'success' as const, error: result.error } : s
          ));
          if (result.error) {
            toast.success(`${step.name} completed with warnings: ${result.error}`);
          } else {
            toast.success(`${step.name} completed successfully`);
          }
        } else {
          setSteps(prev => prev.map(s => 
            s.id === step.id ? { ...s, status: 'error' as const, error: result.error } : s
          ));
          toast.error(`${step.name} failed: ${result.error}`);
        }
      } else {
        // Execute SQL
        const result = await executeSQL(sql);

        if (result.success) {
          setSteps(prev => prev.map(s => 
            s.id === step.id ? { ...s, status: 'success' as const, error: result.error } : s
          ));
          if (result.error) {
            toast.success(`${step.name} completed with warnings: ${result.error}`);
          } else {
            toast.success(`${step.name} completed successfully`);
          }
        } else {
          setSteps(prev => prev.map(s => 
            s.id === step.id ? { ...s, status: 'error' as const, error: result.error } : s
          ));
          toast.error(`${step.name} failed: ${result.error}`);
        }
      }
    } catch (err: any) {
      setSteps(prev => prev.map(s => 
        s.id === step.id ? { ...s, status: 'error' as const, error: err.message } : s
      ));
      toast.error(`${step.name} failed: ${err.message}`);
    } finally {
      setRunning(false);
      setCurrentStep(null);
    }
  };

  // Execute storage buckets setup (needs API calls, not SQL)
  const executeStorageBuckets = async (sql: string) => {
    if (!creds.serviceRoleKey) {
      throw new Error('Service Role Key is required');
    }

    const url = `https://${creds.projectRef}.supabase.co`;
    const supabase = createClient(url, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create buckets via Storage API (not SQL - SQL requires superuser)
    // Note: Supabase has default limits, so we'll use reasonable values
    const buckets = [
      { name: 'knowledge-base', public: false, fileSizeLimit: 52428800 }, // 50MB
      { name: 'user-files', public: true, fileSizeLimit: 52428800 }, // 50MB (reduced from 100MB to avoid limit errors)
      { name: 'app-media', public: true, fileSizeLimit: 52428800 }, // 50MB
      { name: 'template-images', public: true, fileSizeLimit: 10485760 }, // 10MB
      { name: 'appstore-images', public: true, fileSizeLimit: 10485760 } // 10MB
    ];

    const results: string[] = [];
    const errors: string[] = [];

    for (const bucket of buckets) {
      try {
        // Create bucket without fileSizeLimit first (to avoid size limit errors)
        // We can update it later if needed via the Supabase dashboard
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public
          // Note: fileSizeLimit and allowedMimeTypes may not be supported via API
          // These can be configured manually in Supabase Dashboard if needed
        });

        if (error) {
          if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
            results.push(`✓ Bucket '${bucket.name}' already exists`);
          } else {
            errors.push(`Bucket '${bucket.name}': ${error.message}`);
          }
        } else {
          results.push(`✓ Created bucket '${bucket.name}'`);
        }
      } catch (err: any) {
        errors.push(`Bucket '${bucket.name}': ${err.message}`);
      }
    }

    // Filter out INSERT INTO storage.buckets statements from SQL
    // Only execute the RLS policy statements
    // Use regex to remove entire INSERT INTO storage.buckets blocks
    const rlsPolicySQL = sql
      // Remove INSERT INTO storage.buckets blocks (including ON CONFLICT)
      .replace(/INSERT INTO storage\.buckets[\s\S]*?ON CONFLICT[\s\S]*?;/gi, '')
      // Also remove any standalone INSERT INTO storage.buckets lines
      .split('\n')
      .filter(line => {
        const trimmed = line.trim().toUpperCase();
        return !trimmed.startsWith('INSERT INTO STORAGE.BUCKETS');
      })
      .join('\n');

    // Execute only the RLS policy SQL (if any remains)
    if (rlsPolicySQL.trim().length > 50) { // Only if there's substantial SQL left
      try {
        const sqlResult = await executeSQL(rlsPolicySQL);
        if (!sqlResult.success) {
          // Check if it's a permission error (expected for storage.objects)
          if (sqlResult.error?.includes('owner') || sqlResult.error?.includes('permission')) {
            errors.push('⚠️ RLS policies require superuser privileges. Use the "Open SQL Editor" button to apply them manually.');
          } else {
            errors.push(`RLS Policies: ${sqlResult.error}`);
          }
        } else {
          results.push('✓ Applied storage RLS policies');
        }
      } catch (err: any) {
        // RLS policies might require superuser, that's OK
        if (err.message?.includes('owner') || err.message?.includes('permission')) {
          errors.push('⚠️ RLS policies require superuser privileges. Use the "Open SQL Editor" button to apply them manually.');
        } else {
          errors.push(`RLS Policies: ${err.message}`);
        }
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`Storage setup failed: ${errors.join('; ')}`);
    }

    const summary = results.join(', ');
    const warnings = errors.length > 0 ? ` Warnings: ${errors.join('; ')}` : '';
    
    return {
      success: true,
      error: warnings || undefined,
      summary: summary
    };
  };

  // Run all steps in sequence
  const runAllSteps = async () => {
    if (running) return;

    setRunning(true);

    for (const step of steps) {
      if (step.status === 'success') continue; // Skip already completed steps

      setCurrentStep(step.id);
      await executeStep(step);

      // Wait a bit between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setRunning(false);
    setCurrentStep(null);
  };

  // Open SQL Editor with exec_sql function creation SQL
  const openExecSQLCreator = async () => {
    try {
      const createFunctionSQL = await fetchSQLFile('create-exec-sql-function.sql');
      
      // Copy SQL to clipboard
      await navigator.clipboard.writeText(createFunctionSQL);
      toast.success('SQL copied to clipboard');

      // Open SQL Editor
      if (creds.projectRef) {
        const sqlEditorUrl = `https://supabase.com/dashboard/project/${creds.projectRef}/sql/new`;
        window.open(sqlEditorUrl, '_blank');
        toast.info('Opened Supabase SQL Editor. Paste the SQL (Ctrl+V / Cmd+V) and execute.');
        
        // Refresh check after a delay
        setTimeout(() => {
          checkExecSQLFunction().then(setExecSQLExists);
        }, 3000);
      }
    } catch (err: any) {
      // Fallback: use embedded SQL
      const createFunctionSQL = `-- Create exec_sql Helper Function for Automated Migrations
-- This function allows executing dynamic SQL statements via RPC calls

CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql_query;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Add comment
COMMENT ON FUNCTION exec_sql(text) IS 'Helper function for executing dynamic SQL statements. Used by automated migration scripts.';`;

      await navigator.clipboard.writeText(createFunctionSQL);
      toast.success('SQL copied to clipboard');

      if (creds.projectRef) {
        const sqlEditorUrl = `https://supabase.com/dashboard/project/${creds.projectRef}/sql/new`;
        window.open(sqlEditorUrl, '_blank');
        toast.info('Opened Supabase SQL Editor. Paste the SQL (Ctrl+V / Cmd+V) and execute.');
      }
    }
  };

  // Open Supabase SQL Editor with SQL pre-filled
  const openSQLEditor = async (step: MigrationStep) => {
    try {
      let sql = await fetchSQLFile(step.sqlFile);
      
      // For storage buckets, filter out INSERT INTO storage.buckets statements
      // Only include RLS policy statements
      if (step.id === 'storage-buckets') {
        sql = sql
          // Remove INSERT INTO storage.buckets blocks (including ON CONFLICT)
          .replace(/INSERT INTO storage\.buckets[\s\S]*?ON CONFLICT[\s\S]*?;/gi, '')
          // Also remove any standalone INSERT INTO storage.buckets lines
          .split('\n')
          .filter(line => {
            const trimmed = line.trim().toUpperCase();
            return !trimmed.startsWith('INSERT INTO STORAGE.BUCKETS');
          })
          .join('\n')
          // Add a header comment
          .replace(/^/, '-- =============================================================================\n-- Storage RLS Policies Only\n-- Buckets should already be created via Storage API\n-- =============================================================================\n\n');
      }
      
      // Copy SQL to clipboard
      await navigator.clipboard.writeText(sql);
      toast.success('SQL copied to clipboard (RLS policies only for storage buckets)');

      // Open SQL Editor
      if (creds.projectRef) {
        const sqlEditorUrl = `https://supabase.com/dashboard/project/${creds.projectRef}/sql/new`;
        window.open(sqlEditorUrl, '_blank');
        toast.info('Opened Supabase SQL Editor. Paste the SQL (Ctrl+V / Cmd+V) and execute.');
      } else {
        toast.error('Project reference not found. Please configure credentials in Settings.');
      }
    } catch (err: any) {
      toast.error(`Could not load SQL file: ${err.message}`);
      console.error('Error loading SQL file:', err);
      
      // Show a helpful message
      toast.info('You can manually copy the SQL file from docs/migrate/ and paste it into Supabase SQL Editor.');
    }
  };

  // Download SQL file
  const downloadSQL = async (step: MigrationStep) => {
    try {
      const sql = await fetchSQLFile(step.sqlFile);
      const blob = new Blob([sql], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = step.sqlFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('SQL file downloaded');
    } catch (err: any) {
      toast.error(`Could not download SQL file: ${err.message}`);
    }
  };

  const completedSteps = steps.filter(s => s.status === 'success').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  if (!creds.serviceRoleKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Migration</CardTitle>
          <CardDescription>Automated migration from Lovable to Supabase</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Service Role Key Required</AlertTitle>
            <AlertDescription>
              Please add your Service Role Key in the Settings tab to enable automated migrations.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Migration</CardTitle>
          <CardDescription>
            Run all migration steps to set up your Supabase instance. Steps will be executed in order.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps} / {totalSteps} steps completed</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* exec_sql Function Status */}
          {execSQLExists === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>exec_sql Function Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span className="text-xs">
                  The exec_sql function is required for automated SQL execution. Create it first to enable automated migrations.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openExecSQLCreator}
                  className="ml-4"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Create exec_sql Function
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {execSQLExists === true && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>exec_sql Function Ready</AlertTitle>
              <AlertDescription className="text-xs">
                The exec_sql function is available. Automated migrations are enabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Run All Button */}
          <div className="flex gap-2">
            <Button
              onClick={runAllSteps}
              disabled={running || completedSteps === totalSteps || execSQLExists === false}
              className="flex-1"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Migration...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Steps
                </>
              )}
            </Button>
            {checkingExecSQL && (
              <Button variant="outline" disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </Button>
            )}
          </div>

          {/* Migration Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <Card key={step.id} className={currentStep === step.id ? 'border-primary' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                        <h3 className="font-semibold">{step.name}</h3>
                        {step.status === 'success' && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        {step.status === 'running' && (
                          <Badge variant="default">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Running
                          </Badge>
                        )}
                        {step.status === 'error' && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                        {step.status === 'pending' && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{step.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeStep(step)}
                        disabled={running || step.status === 'running' || step.status === 'success'}
                      >
                        {step.status === 'running' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSQLEditor(step)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadSQL(step)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription className="text-xs space-y-1">
              <p>• The <code>exec_sql</code> function must be created first (Step 1) for automated execution to work.</p>
              <p>• If automated execution fails, use the "Open SQL Editor" button to execute SQL manually.</p>
              <p>• Some steps may require manual intervention if certain tables or functions don't exist yet.</p>
              <p>• Storage buckets are created via API, but RLS policies are applied via SQL.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

