import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui';
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
                return <Badge className="bg-admin-success/10 text-admin-success border-admin-success/20">Sent</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-admin-error/10 text-admin-error border-admin-error/20">Failed</Badge>;
            case 'skipped':
                return <Badge className="bg-admin-muted text-admin-text-muted border-admin-border">Skipped</Badge>;
            case 'pending':
                return <Badge className="bg-admin-warning/10 text-admin-warning border-admin-warning/20">Pending</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <Card className="bg-admin-card border-admin-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-admin-text font-roboto-slab">
                            <Zap className="h-5 w-5 text-admin-info" />
                            Rule Execution Logs
                        </CardTitle>
                        <CardDescription className="text-admin-text-muted">View email rule triggers and their execution status</CardDescription>
                    </div>
                    <button onClick={() => loadLogs()} className="p-2 text-admin-text-muted hover:text-admin-text transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                        <SelectTrigger className="w-48 bg-admin-bg-muted border-admin-border text-admin-text">
                            <SelectValue placeholder="Filter event type" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-card border-admin-border text-admin-text">
                            <SelectItem value="all">All Events</SelectItem>
                            {eventTypes.map((et) => (
                                <SelectItem key={et.event_type} value={et.event_type}>
                                    {et.display_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-admin-bg-muted border-admin-border text-admin-text">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-card border-admin-border text-admin-text">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="skipped">Skipped</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="border border-admin-border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader className="bg-admin-bg-muted">
                            <TableRow className="border-admin-border hover:bg-transparent">
                                <TableHead className="w-8"></TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Time</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Event Type</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Recipient</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Status</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Processing</TableHead>
                                <TableHead className="text-right text-admin-text-muted font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-admin-info" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-admin-text-muted">
                                        No rule execution logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <>
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer hover:bg-admin-accent/5 border-admin-border"
                                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                        >
                                            <TableCell>
                                                {expandedRow === log.id ? (
                                                    <ChevronDown className="h-4 w-4 text-admin-text-muted" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-admin-text-muted" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-admin-text-muted">
                                                {formatDistanceToNow(new Date(log.triggered_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-admin-info/10 text-admin-info border-admin-info/20">{log.event_type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-admin-text">{log.recipient_email}</TableCell>
                                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                                            <TableCell className="text-sm text-admin-text-muted font-mono">
                                                {log.processing_time_ms ? `${log.processing_time_ms}ms` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {log.status === 'failed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-admin-border text-admin-text hover:bg-admin-bg-muted"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRetry(log.id);
                                                        }}
                                                        disabled={retryingId === log.id}
                                                    >
                                                        {retryingId === log.id ? (
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <RotateCcw className="h-3 w-3 mr-1 text-admin-info" />
                                                        )}
                                                        Retry
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {expandedRow === log.id && (
                                            <TableRow className="border-admin-border bg-admin-bg-muted/30">
                                                <TableCell colSpan={7} className="p-4">
                                                    <div className="space-y-4">
                                                        {log.error_message && (
                                                            <div>
                                                                <h4 className="text-sm font-bold text-admin-error mb-1 font-roboto-slab">Error Detail</h4>
                                                                <div className="text-sm bg-admin-error/10 p-3 rounded-lg border border-admin-error/20 text-admin-text">
                                                                    {log.error_message}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {log.event_payload && (
                                                            <div>
                                                                <h4 className="text-sm font-bold text-admin-text-muted mb-1 font-roboto-slab">Event Payload</h4>
                                                                <pre className="text-xs bg-admin-bg-muted p-3 rounded-lg border border-admin-border overflow-x-auto max-h-40 text-admin-text font-mono">
                                                                    {JSON.stringify(log.event_payload, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-3 gap-6 text-sm">
                                                            <div>
                                                                <span className="text-admin-text-muted block mb-1">Rule ID</span>
                                                                <span className="font-mono text-admin-text p-1 px-2 bg-admin-bg-muted rounded border border-admin-border">{log.rule_id || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-admin-text-muted block mb-1">Template ID</span>
                                                                <span className="font-mono text-admin-text p-1 px-2 bg-admin-bg-muted rounded border border-admin-border">{log.template_id || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-admin-text-muted block mb-1">Sent At</span>
                                                                <span className="text-admin-text">{log.sent_at ? new Date(log.sent_at).toLocaleString() : 'N/A'}</span>
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
