import { useState, useEffect } from 'react';
import { Database, Table, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface TableInfo {
  name: string;
  columns?: string[];
}

interface DatabaseSchemaViewerProps {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
}

export function DatabaseSchemaViewer({ supabaseUrl, supabaseAnonKey }: DatabaseSchemaViewerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

  const fetchSchema = async () => {
    if (!supabaseUrl || !supabaseAnonKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the OpenAPI schema which lists available tables
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }
      
      const data = await response.json();
      setIsConnected(true);
      
      // Parse tables from OpenAPI paths
      const tableNames: string[] = [];
      if (data.paths) {
        Object.keys(data.paths).forEach(path => {
          // Skip root path and RPC paths
          if (path !== '/' && !path.startsWith('/rpc/')) {
            const tableName = path.replace('/', '');
            if (tableName) {
              tableNames.push(tableName);
            }
          }
        });
      }
      
      setTables(tableNames.map(name => ({ name })));
      
      if (tableNames.length === 0) {
        toast.info('Connected but no public tables found');
      } else {
        toast.success(`Found ${tableNames.length} table(s)`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured && !isConnected && tables.length === 0) {
      fetchSchema();
    }
  }, [supabaseUrl, supabaseAnonKey]);

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Database Schema</CardTitle>
              <CardDescription>View tables from your connected Supabase project</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Configure Supabase credentials above to view database schema</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Database Schema</CardTitle>
              <CardDescription>Tables from your connected Supabase project</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              {isConnected ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </>
              ) : (
                'Disconnected'
              )}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSchema}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">Fetching database schema...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-10 w-10 mb-3" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchSchema}>
              Retry
            </Button>
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Table className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No public tables found</p>
            <p className="text-xs mt-1">Create tables in your Supabase project to see them here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Table className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{table.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
