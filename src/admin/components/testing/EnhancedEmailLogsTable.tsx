import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui';
import { useEmailLogs } from '@/hooks/useEmailLogs.tsx';
import { useEmailTesting } from '@/hooks/useEmailTesting.tsx';
import {
    Search,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    RotateCcw,
    Copy,
    Mail,
    Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function EnhancedEmailLogsTable() {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    const { logs, loading, loadLogs } = useEmailLogs({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit: 100,
    });

    const { resendEmail } = useEmailTesting();

    const handleResend = async (logId: string) => {
        setResendingId(logId);
        try {
            await resendEmail(logId);
            loadLogs();
        } catch (error) {
            // Error handled in hook
        } finally {
            setResendingId(null);
        }
    };

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.success('Email address copied to clipboard');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-admin-success/10 text-admin-success border-admin-success/20">Sent</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="bg-admin-error/10 text-admin-error border-admin-error/20">Failed</Badge>;
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
                            <Mail className="h-5 w-5 text-admin-info" />
                            Email Logs
                        </CardTitle>
                        <CardDescription className="text-admin-text-muted">View all sent emails and their delivery status</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => loadLogs()} className="text-admin-text-muted hover:text-admin-text">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
                        <Input
                            placeholder="Search by email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-admin-bg-muted border-admin-border text-admin-text"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-admin-bg-muted border-admin-border text-admin-text">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-card border-admin-border text-admin-text">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
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
                                <TableHead className="text-admin-text-muted font-semibold">Recipient</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Subject</TableHead>
                                <TableHead className="text-admin-text-muted font-semibold">Status</TableHead>
                                <TableHead className="text-right text-admin-text-muted font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-admin-info" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-admin-text-muted">
                                        No email logs found
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
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-admin-text">{log.recipient_email}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-admin-text-muted hover:text-admin-text"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            copyEmail(log.recipient_email);
                                                        }}
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-admin-text">{log.subject}</TableCell>
                                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                                            <TableCell className="text-right">
                                                {log.status === 'failed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-admin-border text-admin-text hover:bg-admin-bg-muted"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleResend(log.id);
                                                        }}
                                                        disabled={resendingId === log.id}
                                                    >
                                                        {resendingId === log.id ? (
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
                                                <TableCell colSpan={6} className="p-4">
                                                    <div className="space-y-3">
                                                        {log.error_message && (
                                                            <div>
                                                                <h4 className="text-sm font-medium text-admin-error mb-1 font-roboto-slab">Error Detail</h4>
                                                                <div className="text-sm bg-admin-error/10 p-3 rounded-lg border border-admin-error/20 text-admin-text">
                                                                    {log.error_message}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-medium text-admin-text-muted mb-1 font-roboto-slab">Metadata</h4>
                                                                <pre className="text-xs bg-admin-bg-muted p-3 rounded-lg border border-admin-border overflow-x-auto text-admin-text font-mono">
                                                                    {JSON.stringify(log.metadata, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
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
