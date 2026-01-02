import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ScrollArea } from '@/admin/ui';
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
                return <CheckCircle className="h-4 w-4 text-admin-success" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-admin-error" />;
            default:
                return <Clock className="h-4 w-4 text-admin-warning" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-admin-success/10 text-admin-success border-admin-success/20">Sent</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-admin-error/10 text-admin-error border-admin-error/20">Failed</Badge>;
            default:
                return <Badge className="bg-admin-warning/10 text-admin-warning border-admin-warning/20">{status}</Badge>;
        }
    };

    return (
        <Card className="bg-admin-card border-admin-border">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-admin-text font-roboto-slab">
                            <Code className="h-5 w-5 text-admin-info" />
                            API Inspector
                        </CardTitle>
                        <CardDescription className="text-admin-text-muted">
                            View email API requests and responses
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-32 bg-admin-bg-muted border-admin-border text-admin-text">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-admin-card border-admin-border text-admin-text">
                                <SelectItem value="1h">Last Hour</SelectItem>
                                <SelectItem value="24h">Last 24h</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                            </SelectContent>
                        </Select>
                        <button onClick={loadLogs} className="p-2 text-admin-text-muted hover:text-admin-text transition-colors">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-admin-text-muted">
                                No API calls found in this time range
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="border border-admin-border rounded-xl overflow-hidden bg-admin-bg-muted/30">
                                    <button
                                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-admin-accent/5 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(log.status)}
                                            <div className="text-left">
                                                <div className="font-semibold text-admin-text text-sm">{log.subject}</div>
                                                <div className="text-xs text-admin-text-muted">{log.recipient_email}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {log.metadata?.latency_ms && (
                                                <span className="text-xs text-admin-text-muted font-mono hidden sm:inline">
                                                    {log.metadata.latency_ms}ms
                                                </span>
                                            )}
                                            {getStatusBadge(log.status)}
                                            <span className="text-xs text-admin-text-muted whitespace-nowrap hidden md:inline">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </span>
                                            {expandedLog === log.id ? (
                                                <ChevronDown className="h-4 w-4 text-admin-text-muted" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-admin-text-muted" />
                                            )}
                                        </div>
                                    </button>

                                    {expandedLog === log.id && (
                                        <div className="border-t border-admin-border p-6 bg-admin-card space-y-5 animate-in slide-in-from-top-2 duration-300">
                                            {log.error_message && (
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-admin-error mb-2 font-roboto-slab">Error Detail</h4>
                                                    <pre className="text-xs bg-admin-error/10 p-3 rounded-lg border border-admin-error/20 overflow-x-auto text-admin-text font-mono">
                                                        {log.error_message}
                                                    </pre>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-admin-text-muted mb-2 font-roboto-slab">Provider</h4>
                                                    <Badge className="bg-admin-info/10 text-admin-info border-admin-info/20">
                                                        {log.metadata?.provider || 'Unknown'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-admin-text-muted mb-2 font-roboto-slab">Request ID</h4>
                                                    <code className="text-xs text-admin-text font-mono bg-admin-bg-muted p-1 px-2 rounded border border-admin-border break-all">
                                                        {log.metadata?.request_id || 'N/A'}
                                                    </code>
                                                </div>
                                            </div>

                                            {log.metadata?.api_response && (
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-admin-text-muted mb-2 font-roboto-slab">API Response</h4>
                                                    <pre className="text-xs bg-admin-bg-muted p-4 rounded-xl border border-admin-border overflow-x-auto max-h-60 text-admin-text font-mono scrollbar-thin">
                                                        {JSON.stringify(log.metadata.api_response, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {!log.metadata?.api_response && log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-admin-text-muted mb-2 font-roboto-slab">Full Metadata</h4>
                                                    <pre className="text-xs bg-admin-bg-muted p-4 rounded-xl border border-admin-border overflow-x-auto max-h-60 text-admin-text font-mono scrollbar-thin">
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
