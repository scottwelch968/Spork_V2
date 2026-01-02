import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmailRuleLogs } from '@/hooks/useEmailRuleLogs';
import { useEmailEventTypes } from '@/hooks/useEmailEventTypes';
import { 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw,
  Zap,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EnhancedRuleLogsTable() {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  
  const { logs, loading, loadLogs, retryFailed } = useEmailRuleLogs();
  const { eventTypes } = useEmailEventTypes();

  useEffect(() => {
    loadLogs({
      event_type: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
    });
  }, [eventTypeFilter, statusFilter]);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await retryFailed(logId);
      loadLogs();
    } catch (error) {
      // Error handled in hook
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Skipped</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Rule Execution Logs
            </CardTitle>
            <CardDescription>View email rule triggers and their execution status</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => loadLogs()}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((et) => (
                <SelectItem key={et.event_type} value={et.event_type}>
                  {et.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No rule execution logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <>
                    <TableRow 
                      key={log.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    >
                      <TableCell>
                        {expandedRow === log.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.event_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.recipient_email}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.processing_time_ms ? `${log.processing_time_ms}ms` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(log.id);
                            }}
                            disabled={retryingId === log.id}
                          >
                            {retryingId === log.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="space-y-3">
                            {log.error_message && (
                              <div>
                                <h4 className="text-sm font-medium text-red-500 mb-1">Error</h4>
                                <p className="text-sm bg-red-500/10 p-2 rounded">{log.error_message}</p>
                              </div>
                            )}
                            {log.event_payload && (
                              <div>
                                <h4 className="text-sm font-medium mb-1">Event Payload</h4>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                                  {JSON.stringify(log.event_payload, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Rule ID:</span>{' '}
                                <span className="font-mono">{log.rule_id || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Template ID:</span>{' '}
                                <span className="font-mono">{log.template_id || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Sent At:</span>{' '}
                                <span>{log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</span>
                              </div>
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
        </div>
      </CardContent>
    </Card>
  );
}
