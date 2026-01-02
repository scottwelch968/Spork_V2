import React, { useState, useEffect } from 'react';
import { SupabaseCredentials } from './types';
import { databaseService } from './services/databaseService';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Badge } from '@/admin/ui/badge';
import { Loader2, Database, Table, ChevronRight, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Download, Copy, Play, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/admin/ui/alert-dialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui/tabs';
import { Textarea } from '@/admin/ui/textarea';
import { schemaSyncService } from './services/schemaSyncService';

interface Props {
  creds: SupabaseCredentials;
}

interface TableInfo {
  table_name: string;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableDetails {
  columns: ColumnInfo[];
  constraints?: any[];
  rlsPolicies?: any[];
}

export const SupabaseDatabaseTab: React.FC<Props> = ({ creds }) => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Parity Test State
  const [parityResults, setParityResults] = useState<any>(null);
  const [runningParity, setRunningParity] = useState(false);
  
  // Sync State
  const [syncSQL, setSyncSQL] = useState<string>('');
  const [generatingSQL, setGeneratingSQL] = useState(false);
  const [executingSQL, setExecutingSQL] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const [autoSyncResults, setAutoSyncResults] = useState<any>(null);
  const [removeExtraSQL, setRemoveExtraSQL] = useState<string>('');
  const [generatingRemoveSQL, setGeneratingRemoveSQL] = useState(false);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);

  useEffect(() => {
    fetchTables();
  }, [creds]);

  const fetchTables = async () => {
    if (!creds.serviceRoleKey) {
      setError('Service Role Key is required to view database schema');
      toast.error('Please add Service Role Key in Settings');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const tables = await databaseService.getTables(creds);
      setTables(tables);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to fetch tables: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableDetails = async (tableName: string) => {
    if (!creds.serviceRoleKey) {
      setError('Service Role Key is required to view table details');
      toast.error('Please add Service Role Key in Settings');
      setLoadingDetails(false);
      return;
    }

    setLoadingDetails(true);
    setError(null);
    try {
      // Get columns
      const columns = await databaseService.getTableColumns(creds, tableName) as ColumnInfo[];

      // Get constraints
      const constraints = await databaseService.getTableConstraints(creds, tableName);

      // Get RLS policies
      const rlsPolicies = await databaseService.getRLSPolicies(creds, tableName);

      setTableDetails({ columns, constraints, rlsPolicies });
      setSelectedTable(tableName);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to fetch table details: ${err.message}`);
      setTableDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredTables = tables.filter(t => 
    t.table_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConstraintTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'p': 'Primary Key',
      'f': 'Foreign Key',
      'u': 'Unique',
      'c': 'Check',
      't': 'Trigger',
      'x': 'Exclusion'
    };
    return types[type] || type;
  };

  const runParityTest = async () => {
    setRunningParity(true);
    try {
      const results = await databaseService.runParityTest(creds);
      setParityResults(results);
      if (results.warnings && results.warnings.length > 0) {
        toast.warning('Parity test completed with warnings. Some helper functions may be missing.');
      } else {
        toast.success('Parity test completed');
      }
    } catch (err: any) {
      toast.error(`Parity test failed: ${err.message}`);
      console.error('Parity test error:', err);
    } finally {
      setRunningParity(false);
    }
  };

  const generateSyncSQL = async () => {
    if (!parityResults) {
      toast.error('Please run parity test first');
      return;
    }

    setGeneratingSQL(true);
    try {
      const { sql, summary } = await schemaSyncService.generateSyncSQL(creds, parityResults);
      setSyncSQL(sql);
      toast.success('SQL generated successfully');
    } catch (err: any) {
      toast.error(`Failed to generate SQL: ${err.message}`);
    } finally {
      setGeneratingSQL(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(syncSQL);
    toast.success('SQL copied to clipboard');
  };

  const downloadSQL = () => {
    const blob = new Blob([syncSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-sync-${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('SQL file downloaded');
  };

  const generateRemoveExtraSQL = () => {
    if (!parityResults) {
      toast.error('Please run parity test first');
      return;
    }

    const hasExtraItems = 
      (parityResults.tables?.extra?.length > 0) ||
      (parityResults.enums?.extra?.length > 0) ||
      (parityResults.functions?.extra?.length > 0);

    if (!hasExtraItems) {
      toast.info('No extra items to remove. Database is already in pure parity.');
      return;
    }

    setGeneratingRemoveSQL(true);
    try {
      const { sql, summary, warnings } = schemaSyncService.generateRemoveExtraItemsSQL(parityResults);
      setRemoveExtraSQL(sql);
      setShowRemoveWarning(true);
      toast.success('Remove SQL generated. Review carefully before executing!');
    } catch (err: any) {
      toast.error(`Failed to generate remove SQL: ${err.message}`);
    } finally {
      setGeneratingRemoveSQL(false);
    }
  };

  const downloadRemoveSQL = () => {
    const blob = new Blob([removeExtraSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remove-extra-items-${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Remove SQL file downloaded');
  };

  const openSupabaseSQLEditor = () => {
    if (!creds.projectRef) {
      toast.error('Project reference not found');
      return;
    }
    // Open Supabase SQL Editor in new tab
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${creds.projectRef}/sql/new`;
    window.open(sqlEditorUrl, '_blank');
    toast.info('Opened Supabase SQL Editor. Paste the SQL there and execute.');
  };

  const runAutoSync = async () => {
    setAutoSyncing(true);
    setAutoSyncResults(null);
    try {
      // Use existing parity results if available, otherwise run new test
      const results = await schemaSyncService.autoSync(creds, databaseService, parityResults);
      setAutoSyncResults(results);
      
      // Update parity results with the latest from auto-sync
      if (results.details.parityResults) {
        setParityResults(results.details.parityResults);
      }
      
      if (results.success && results.details.enumsCreated === 0 && 
          results.details.requiresManualIntervention.tables.length === 0 &&
          results.details.requiresManualIntervention.functions.length === 0) {
        toast.success(results.message);
      } else if (results.details.enumsCreated > 0) {
        toast.success(`Auto-sync created ${results.details.enumsCreated} enum(s). ${results.message}`);
      } else {
        toast.warning(results.message);
      }
    } catch (err: any) {
      toast.error(`Auto-sync failed: ${err.message}`);
      console.error('Auto-sync error:', err);
    } finally {
      setAutoSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">Database Schema</h2>
          <p className="text-sm text-admin-text-muted mt-1">View tables, columns, and schema details</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runParityTest}
            disabled={runningParity || !creds.serviceRoleKey}
          >
            {runningParity ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Run Parity Test
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={fetchTables}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

        <Tabs defaultValue="schema" className="w-full">
        <TabsList>
          <TabsTrigger value="schema">Schema Browser</TabsTrigger>
          <TabsTrigger value="parity">Parity Test</TabsTrigger>
          <TabsTrigger value="sync">Sync Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="schema" className="space-y-6 mt-6">
          {error && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tables List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Tables ({tables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
              </div>
            ) : filteredTables.length === 0 ? (
              <p className="text-sm text-admin-text-muted text-center py-8">
                {searchTerm ? 'No tables found' : 'No tables in database'}
              </p>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredTables.map((table) => (
                  <button
                    key={table.table_name}
                    onClick={() => fetchTableDetails(table.table_name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedTable === table.table_name
                        ? 'bg-admin-accent text-admin-accent-foreground'
                        : 'hover:bg-admin-bg-muted text-admin-text'
                    }`}
                  >
                    <span className="text-sm font-mono">{table.table_name}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTable ? (
                <span className="font-mono">{selectedTable}</span>
              ) : (
                'Select a table to view details'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
              </div>
            ) : selectedTable && tableDetails ? (
              <div className="space-y-6">
                {/* Columns */}
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-3">Columns</h3>
                  <div className="border border-admin-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-admin-bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-admin-text-muted">Column</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-admin-text-muted">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-admin-text-muted">Nullable</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-admin-text-muted">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableDetails.columns.map((col, idx) => (
                          <tr key={idx} className="border-t border-admin-border">
                            <td className="px-4 py-2 font-mono text-sm text-admin-text">{col.column_name}</td>
                            <td className="px-4 py-2 text-sm text-admin-text-muted">{col.data_type}</td>
                            <td className="px-4 py-2">
                              <Badge variant={col.is_nullable === 'YES' ? 'outline' : 'default'}>
                                {col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-xs text-admin-text-muted font-mono">
                              {col.column_default || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Constraints */}
                {tableDetails.constraints && tableDetails.constraints.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-admin-text mb-3">Constraints</h3>
                    <div className="space-y-2">
                      {tableDetails.constraints.map((constraint: any, idx: number) => (
                        <div key={idx} className="p-3 bg-admin-bg-muted rounded-lg border border-admin-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge>{getConstraintTypeLabel(constraint.constraint_type)}</Badge>
                            <span className="text-sm font-mono text-admin-text">{constraint.constraint_name}</span>
                          </div>
                          <p className="text-xs text-admin-text-muted font-mono mt-1">{constraint.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RLS Policies */}
                {tableDetails.rlsPolicies && tableDetails.rlsPolicies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-admin-text mb-3">RLS Policies</h3>
                    <div className="space-y-2">
                      {tableDetails.rlsPolicies.map((policy: any, idx: number) => (
                        <div key={idx} className="p-3 bg-admin-bg-muted rounded-lg border border-admin-border">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{policy.cmd || 'ALL'}</Badge>
                            <span className="text-sm font-semibold text-admin-text">{policy.policyname}</span>
                          </div>
                          {policy.qual && (
                            <p className="text-xs text-admin-text-muted font-mono mt-1">
                              <strong>Using:</strong> {policy.qual}
                            </p>
                          )}
                          {policy.with_check && (
                            <p className="text-xs text-admin-text-muted font-mono mt-1">
                              <strong>With Check:</strong> {policy.with_check}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tableDetails.constraints?.length === 0 && tableDetails.rlsPolicies?.length === 0 && (
                  <p className="text-sm text-admin-text-muted text-center py-8">
                    No constraints or RLS policies found for this table.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-admin-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-sm text-admin-text-muted">
                  Select a table from the list to view its schema details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="parity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema Parity Test</CardTitle>
              <p className="text-sm text-admin-text-muted">Compare your database schema with the expected schema from documentation</p>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runParityTest}
                disabled={runningParity || !creds.serviceRoleKey}
                className="w-full"
              >
                {runningParity ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Parity Test...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Run Parity Test
                  </>
                )}
              </Button>
              {!creds.serviceRoleKey && (
                <p className="text-sm text-admin-text-muted mt-2 text-center">Service Role Key required for parity test</p>
              )}
            </CardContent>
          </Card>

          {parityResults && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-admin-bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold text-admin-text">{parityResults.summary.totalTables}</div>
                    <div className="text-xs text-admin-text-muted">Total Tables</div>
                  </div>
                  <div className={`p-4 rounded-lg ${parityResults.summary.missingTables > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    <div className="text-2xl font-bold text-admin-text">{parityResults.summary.missingTables}</div>
                    <div className="text-xs text-admin-text-muted">Missing Tables</div>
                  </div>
                  <div className={`p-4 rounded-lg ${parityResults.summary.extraTables > 0 ? 'bg-yellow-500/10' : 'bg-admin-bg-muted'}`}>
                    <div className="text-2xl font-bold text-admin-text">{parityResults.summary.extraTables}</div>
                    <div className="text-xs text-admin-text-muted">Extra Tables</div>
                  </div>
                  <div className="bg-admin-bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold text-admin-text">{parityResults.summary.totalEnums}</div>
                    <div className="text-xs text-admin-text-muted">Enum Types</div>
                  </div>
                </div>

                {/* Tables Comparison */}
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-3">Tables Comparison</h3>
                  {parityResults.tables.missing.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Missing Tables in Database ({parityResults.tables.missing.length})</span>
                      </div>
                      <p className="text-xs text-admin-text-muted mb-2">Tables expected in schema but not found in Supabase</p>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.tables.missing.map((table: string) => (
                          <Badge key={table} variant="destructive" className="font-mono">{table}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parityResults.tables.extra.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-600">Extra Tables in Database ({parityResults.tables.extra.length})</span>
                      </div>
                      <p className="text-xs text-admin-text-muted mb-2">Tables that exist in Supabase but are not in the documented schema</p>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.tables.extra.map((table: string) => (
                          <Badge key={table} variant="outline" className="font-mono">{table}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parityResults.tables.missing.length === 0 && parityResults.tables.extra.length === 0 && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>All expected tables are present</span>
                    </div>
                  )}
                </div>

                {/* Enums Comparison */}
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-3">Enum Types Comparison</h3>
                  {parityResults.enums.missing.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Missing Enums ({parityResults.enums.missing.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.enums.missing.map((enumType: any) => (
                          <Badge key={enumType.name} variant="destructive" className="font-mono">{enumType.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parityResults.enums.extra.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-600">Extra Enums in Database ({parityResults.enums.extra.length})</span>
                      </div>
                      <p className="text-xs text-admin-text-muted mb-2">Enum types that exist in Supabase but are not in the documented schema</p>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.enums.extra.map((enumType: any) => (
                          <Badge key={enumType.name} variant="outline" className="font-mono">{enumType.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Functions Comparison */}
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-3">Database Functions Comparison</h3>
                  {parityResults.functions.missing.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-red-600">Missing Functions ({parityResults.functions.missing.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.functions.missing.map((func: string) => (
                          <Badge key={func} variant="destructive" className="font-mono">{func}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parityResults.functions.extra.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-600">Extra Functions in Database ({parityResults.functions.extra.length})</span>
                      </div>
                      <p className="text-xs text-admin-text-muted mb-2">Functions that exist in Supabase but are not in the documented schema</p>
                      <div className="flex flex-wrap gap-2">
                        {parityResults.functions.extra.map((func: string) => (
                          <Badge key={func} variant="outline" className="font-mono">{func}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RLS Status */}
                <div>
                  <h3 className="text-lg font-semibold text-admin-text mb-3">RLS Status</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {parityResults.rlsStatus.map((rls: any) => (
                      <div key={rls.table} className="flex items-center justify-between p-2 bg-admin-bg-muted rounded">
                        <span className="font-mono text-sm text-admin-text">{rls.table}</span>
                        <Badge variant={rls.enabled ? 'default' : 'destructive'}>
                          {rls.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {parityResults?.warnings && parityResults.warnings.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardHeader>
                <CardTitle className="text-yellow-600">⚠️ Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-yellow-600">
                  {parityResults.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-700 font-semibold mb-1">Solution:</p>
                  <p className="text-xs text-yellow-700">
                    Run the migration file <code className="bg-yellow-500/30 px-1 rounded">supabase/migrations/20251204235046_62b38195-dafe-4f20-b3db-3220b5c90654.sql</code> to create the required helper functions.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Schema</CardTitle>
              <p className="text-sm text-admin-text-muted">Generate and execute SQL to sync your database with the expected schema</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={runParityTest}
                  disabled={runningParity || autoSyncing || !creds.serviceRoleKey}
                  variant="outline"
                >
                  {runningParity ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Run Parity Test
                    </>
                  )}
                </Button>
                <Button
                  onClick={runAutoSync}
                  disabled={autoSyncing || runningParity || !creds.serviceRoleKey}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {autoSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Auto-Syncing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Auto Sync Schema
                    </>
                  )}
                </Button>
                <Button
                  onClick={generateSyncSQL}
                  disabled={!parityResults || generatingSQL || autoSyncing || !creds.serviceRoleKey}
                  variant="outline"
                >
                  {generatingSQL ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4 mr-2" />
                      Generate SQL Only
                    </>
                  )}
                </Button>
              </div>

              {!creds.serviceRoleKey && (
                <p className="text-sm text-admin-text-muted text-center">Service Role Key required for schema sync</p>
              )}

              {autoSyncResults && (
                <Card className={`border-2 ${autoSyncResults.success ? 'border-green-500/50 bg-green-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
                  <CardHeader>
                    <CardTitle className={autoSyncResults.success ? 'text-green-600' : 'text-yellow-600'}>
                      {autoSyncResults.success ? '✓ Auto-Sync Complete' : '⚠️ Auto-Sync Partial'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-admin-text">{autoSyncResults.message}</p>
                    
                    <div className="space-y-2">
                      {autoSyncResults.details.enumsCreated > 0 && (
                        <div className="bg-green-500/20 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-green-700">
                            ✓ Created {autoSyncResults.details.enumsCreated} enum type(s)
                          </p>
                        </div>
                      )}
                      
                      {autoSyncResults.details.enumsFailed.length > 0 && (
                        <div className="bg-yellow-500/20 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-700 mb-2">
                            ⚠️ {autoSyncResults.details.enumsFailed.length} enum(s) require manual creation:
                          </p>
                          <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                            {autoSyncResults.details.enumsFailed.map((failed: string, idx: number) => (
                              <li key={idx} className="font-mono">{failed}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {autoSyncResults.details.requiresManualIntervention.tables.length > 0 && (
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-blue-700 mb-2">
                            📋 {autoSyncResults.details.requiresManualIntervention.tables.length} table(s) need migrations:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {autoSyncResults.details.requiresManualIntervention.tables.map((table: string) => (
                              <Badge key={table} variant="outline" className="font-mono">{table}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {autoSyncResults.details.requiresManualIntervention.functions.length > 0 && (
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                          <p className="text-sm font-semibold text-blue-700 mb-2">
                            📋 {autoSyncResults.details.requiresManualIntervention.functions.length} function(s) need migrations:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {autoSyncResults.details.requiresManualIntervention.functions.map((func: string) => (
                              <Badge key={func} variant="outline" className="font-mono">{func}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show extra items if they exist */}
                      {autoSyncResults.details.parityResults && (
                        <>
                          {autoSyncResults.details.parityResults.tables?.extra?.length > 0 && (
                            <div className="bg-purple-500/20 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-purple-700 mb-2">
                                ℹ️ {autoSyncResults.details.parityResults.tables.extra.length} extra table(s) in database:
                              </p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {autoSyncResults.details.parityResults.tables.extra.map((table: string) => (
                                  <Badge key={table} variant="outline" className="font-mono">{table}</Badge>
                                ))}
                              </div>
                              <p className="text-xs text-purple-600">
                                These tables exist but aren't in the expected schema. Add to DATABASE_SCHEMA.md if needed, or drop if not needed.
                              </p>
                            </div>
                          )}
                          {autoSyncResults.details.parityResults.enums?.extra?.length > 0 && (
                            <div className="bg-purple-500/20 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-purple-700 mb-2">
                                ℹ️ {autoSyncResults.details.parityResults.enums.extra.length} extra enum type(s) in database:
                              </p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {autoSyncResults.details.parityResults.enums.extra.map((enumType: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="font-mono">{enumType.name || enumType}</Badge>
                                ))}
                              </div>
                              <p className="text-xs text-purple-600">
                                These enum types exist but aren't in the expected schema. Add to DATABASE_SCHEMA.md if needed, or drop if not needed.
                              </p>
                            </div>
                          )}
                          {autoSyncResults.details.parityResults.functions?.extra?.length > 0 && (
                            <div className="bg-purple-500/20 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-purple-700 mb-2">
                                ℹ️ {autoSyncResults.details.parityResults.functions.extra.length} extra function(s) in database:
                              </p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {autoSyncResults.details.parityResults.functions.extra.map((func: string) => (
                                  <Badge key={func} variant="outline" className="font-mono">{func}</Badge>
                                ))}
                              </div>
                              <p className="text-xs text-purple-600">
                                These functions exist but aren't in the expected schema. Add to DATABASE_SCHEMA.md if needed, or drop if not needed.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="bg-admin-bg-muted p-3 rounded-lg">
                      <p className="text-xs font-semibold text-admin-text-muted mb-1">Summary:</p>
                      <pre className="text-xs text-admin-text whitespace-pre-wrap font-sans">
                        {autoSyncResults.details.summary}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {parityResults && (
                <div className="bg-admin-bg-muted p-4 rounded-lg space-y-4">
                  <div>
                    <h4 className="font-semibold text-admin-text mb-2">Sync Summary</h4>
                    <ul className="text-sm text-admin-text-muted space-y-1">
                      {parityResults.summary.missingTables > 0 && (
                        <li>• {parityResults.summary.missingTables} missing table(s)</li>
                      )}
                      {parityResults.summary.missingEnums > 0 && (
                        <li>• {parityResults.summary.missingEnums} missing enum type(s)</li>
                      )}
                      {parityResults.summary.missingFunctions > 0 && (
                        <li>• {parityResults.summary.missingFunctions} missing function(s)</li>
                      )}
                      {parityResults.summary.missingTables === 0 && 
                       parityResults.summary.missingEnums === 0 && 
                       parityResults.summary.missingFunctions === 0 && (
                        <li className="text-green-600">✓ All expected items present</li>
                      )}
                    </ul>
                  </div>

                  {/* Extra Items Summary */}
                  {(parityResults.summary?.extraTables > 0 || 
                    parityResults.summary?.extraEnums > 0 || 
                    parityResults.summary?.extraFunctions > 0) && (
                    <div className="border-t border-admin-border pt-4">
                      <h4 className="font-semibold text-admin-text mb-2">Extra Items (Not in Expected Schema)</h4>
                      <p className="text-xs text-admin-text-muted mb-3">These items exist in your database but are not in the expected schema. Remove them to achieve pure parity.</p>
                      <ul className="text-sm text-admin-text-muted space-y-1 mb-3">
                        {parityResults.summary.extraTables > 0 && (
                          <li>• {parityResults.summary.extraTables} extra table(s)</li>
                        )}
                        {parityResults.summary.extraEnums > 0 && (
                          <li>• {parityResults.summary.extraEnums} extra enum type(s)</li>
                        )}
                        {parityResults.summary.extraFunctions > 0 && (
                          <li>• {parityResults.summary.extraFunctions} extra function(s)</li>
                        )}
                      </ul>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={generatingRemoveSQL}
                          >
                            {generatingRemoveSQL ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Generate SQL to Remove Extra Items
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>⚠️ Destructive Operation</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will generate SQL to permanently DELETE extra tables, enums, and functions.
                              This action cannot be undone and will result in data loss.
                              <br /><br />
                              <strong>Make sure you have a backup before proceeding!</strong>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={generateRemoveExtraSQL}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Generate Remove SQL
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )}

              {syncSQL && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-admin-text">Generated Sync SQL (Add Missing Items)</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copySQL}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadSQL}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={syncSQL}
                    onChange={(e) => setSyncSQL(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                    readOnly={false}
                  />
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 font-semibold mb-2">⚠️ Important Notes:</p>
                    <ul className="text-xs text-yellow-600 space-y-1 list-disc list-inside">
                      <li>Review the SQL carefully before executing</li>
                      <li>For tables, use the migration files in supabase/migrations/ directory</li>
                      <li>Execute SQL in Supabase SQL Editor or via Supabase CLI</li>
                      <li>Backup your database before running migrations</li>
                    </ul>
                  </div>
                </div>
              )}

              {removeExtraSQL && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-600">Generated Remove SQL (Delete Extra Items)</h4>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(removeExtraSQL);
                        toast.success('Remove SQL copied to clipboard');
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy SQL
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadRemoveSQL}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={openSupabaseSQLEditor}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Open SQL Editor
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={removeExtraSQL}
                    onChange={(e) => setRemoveExtraSQL(e.target.value)}
                    className="font-mono text-sm min-h-[300px] bg-red-50 dark:bg-red-950/20"
                    readOnly={false}
                  />
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-semibold mb-2">🚨 DESTRUCTIVE OPERATION:</p>
                    <ul className="text-xs text-red-600 space-y-1 list-disc list-inside mb-3">
                      <li>This SQL will PERMANENTLY DELETE tables, enums, and functions</li>
                      <li>This action CANNOT be undone</li>
                      <li>All data in extra tables will be LOST</li>
                      <li><strong>BACKUP YOUR DATABASE BEFORE EXECUTING!</strong></li>
                      <li>Review the SQL very carefully</li>
                    </ul>
                    <div className="bg-red-600/20 p-3 rounded border border-red-600/30">
                      <p className="text-sm text-red-700 font-semibold mb-2">📋 How to Execute:</p>
                      <ol className="text-xs text-red-700 space-y-1 list-decimal list-inside">
                        <li>Click "Copy SQL" to copy the SQL to clipboard</li>
                        <li>Click "Open SQL Editor" to open Supabase SQL Editor in a new tab</li>
                        <li>Paste the SQL into the editor (Ctrl+V / Cmd+V)</li>
                        <li>Review the SQL one more time</li>
                        <li>Click "Run" or press Ctrl+Enter to execute</li>
                        <li>Confirm the execution if prompted</li>
                        <li>Run parity test again to verify pure parity</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {parityResults && parityResults.summary.missingTables > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-semibold mb-2">📋 Migration Recommendations:</p>
                  <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                    {schemaSyncService.getMigrationRecommendations(parityResults).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
