import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Code, Clock, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiLog {
  id: string;
  created_at: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  metadata: {
    provider?: string;
    request_id?: string;
    latency_ms?: number;
    api_response?: any;
    template_id?: string;
  } | null;
}

export function EmailApiInspector() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let fromDate: Date;
      const now = new Date();

      switch (timeRange) {
        case '1h':
          fromDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data || []) as ApiLog[]);
    } catch (error) {
      console.error('Failed to load API logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [timeRange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Inspector
            </CardTitle>
            <CardDescription>
              View email API requests and responses
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadLogs}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No API calls found in this time range
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div className="text-left">
                        <div className="font-medium text-sm">{log.subject}</div>
                        <div className="text-xs text-muted-foreground">{log.recipient_email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {log.metadata?.latency_ms && (
                        <span className="text-xs text-muted-foreground">
                          {log.metadata.latency_ms}ms
                        </span>
                      )}
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                      {expandedLog === log.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {expandedLog === log.id && (
                    <div className="border-t p-4 bg-muted/30 space-y-4">
                      {log.error_message && (
                        <div>
                          <h4 className="text-sm font-medium text-red-500 mb-1">Error Message</h4>
                          <pre className="text-xs bg-red-500/10 p-2 rounded overflow-x-auto">
                            {log.error_message}
                          </pre>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Provider</h4>
                          <p className="text-sm text-muted-foreground">
                            {log.metadata?.provider || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-1">Request ID</h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {log.metadata?.request_id || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {log.metadata?.api_response && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">API Response</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(log.metadata.api_response, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Full Metadata</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
