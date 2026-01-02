import { useState } from 'react';
import { useEmailRuleLogs } from '@/hooks/useEmailRuleLogs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const RuleLogsTable = () => {
  const { logs, loading, loadLogs, retryFailed } = useEmailRuleLogs();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: 'default',
      pending: 'secondary',
      failed: 'destructive',
      skipped: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Rule Execution Logs</CardTitle>
            <CardDescription>Recent email rule processing history</CardDescription>
          </div>
          <Button onClick={() => loadLogs()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processing Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No rule logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <>
                  <TableRow 
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <TableCell>
                      {format(new Date(log.triggered_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-medium">{log.event_type}</TableCell>
                    <TableCell>{log.recipient_email}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      {log.processing_time_ms ? `${log.processing_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell>
                      {log.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            retryFailed(log.id);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedLog === log.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30">
                        <div className="space-y-2 py-2">
                          {log.error_message && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                              <div>
                                <p className="font-medium text-sm">Error</p>
                                <p className="text-sm text-muted-foreground">{log.error_message}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm mb-1">Event Payload:</p>
                            <pre className="text-xs bg-background p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(log.event_payload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
