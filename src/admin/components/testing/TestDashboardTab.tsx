import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button, Skeleton, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/admin/ui';
import {
    CheckCircle,
    XCircle,
    Clock,
    SkipForward,
    Activity,
    RefreshCw,
    ChevronDown,
    GitBranch,
    GitCommit,
    Timer,
    AlertTriangle,
    FileCode,
    Loader2
} from 'lucide-react';
import { useTestResults, TestRun } from '@/hooks/useTestResults';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

function getCoverageColor(value: number | null): string {
    if (value === null) return 'text-admin-text-muted';
    if (value >= 80) return 'text-admin-success';
    if (value >= 50) return 'text-admin-warning';
    return 'text-admin-error';
}

function getStatusBadge(status: TestRun['status']) {
    switch (status) {
        case 'passed':
            return <Badge className="bg-admin-success/10 text-admin-success border-admin-success/20">Passed</Badge>;
        case 'failed':
            return <Badge variant="destructive" className="bg-admin-error/10 text-admin-error border-admin-error/20">Failed</Badge>;
        case 'running':
            return <Badge className="bg-admin-info/10 text-admin-info border-admin-info/20">Running</Badge>;
        case 'pending':
            return <Badge className="bg-admin-warning/10 text-admin-warning border-admin-warning/20">Pending</Badge>;
        case 'error':
            return <Badge variant="destructive" className="bg-admin-error/10 text-admin-error border-admin-error/20">Error</Badge>;
        default:
            return <Badge variant="outline" className="border-admin-border text-admin-text-muted">Unknown</Badge>;
    }
}

function formatDuration(ms: number | null): string {
    if (ms === null) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function TestDashboardTab() {
    const { latestRun, isLoadingLatest, history, isLoadingHistory, refetch } = useTestResults();
    const [failedTestsOpen, setFailedTestsOpen] = useState(true);

    if (isLoadingLatest) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 bg-admin-bg-muted rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-32 bg-admin-bg-muted rounded-xl" />
                <Skeleton className="h-64 bg-admin-bg-muted rounded-xl" />
            </div>
        );
    }

    if (!latestRun) {
        return (
            <Card className="bg-admin-card border-admin-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-admin-text font-roboto-slab">
                        <Activity className="h-5 w-5 text-admin-info" />
                        Test Dashboard
                    </CardTitle>
                    <CardDescription className="text-admin-text-muted">
                        View automated test results and coverage reports from CI/CD pipelines
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 bg-admin-bg-muted rounded-full">
                            <Activity className="h-12 w-12 text-admin-text-muted opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-admin-text font-roboto-slab">No Test Runs Yet</h3>
                        <p className="text-admin-text-muted max-w-sm">
                            Test results will appear here once your CI/CD pipeline starts reporting them.
                        </p>
                        <Button variant="outline" onClick={() => refetch()} className="border-admin-border text-admin-text hover:bg-admin-bg-muted gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Sync Results
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const coverageAvg = latestRun.coverage_lines !== null ? latestRun.coverage_lines : null;

    const statCards = [
        { label: 'Total Tests', value: latestRun.total_tests, icon: Activity, color: 'text-admin-text-muted' },
        { label: 'Passed', value: latestRun.passed, icon: CheckCircle, color: 'text-admin-success' },
        { label: 'Failed', value: latestRun.failed, icon: XCircle, color: 'text-admin-error' },
        { label: 'Skipped', value: latestRun.skipped, icon: SkipForward, color: 'text-admin-warning' },
        { label: 'Coverage', value: coverageAvg !== null ? `${coverageAvg.toFixed(1)}%` : '-', icon: FileCode, color: getCoverageColor(coverageAvg) },
    ];

    return (
        <div className="space-y-8">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-roboto-slab text-admin-text">Test Dashboard</h2>
                    <p className="text-admin-text-muted text-sm mt-1">
                        Real-time pipeline results and test coverage metrics
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="border-admin-border text-admin-text hover:bg-admin-bg-muted gap-2">
                    {isLoadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sync Reports
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="bg-admin-card border-admin-border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">{stat.label}</span>
                                <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
                            </div>
                            <p className={`text-2xl font-bold font-roboto-slab ${stat.color}`}>{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pipeline Status Overview */}
            <Card className="bg-admin-card border-admin-border overflow-hidden">
                <div className={`h-1.5 w-full ${latestRun.status === 'passed' ? 'bg-admin-success' : 'bg-admin-error'}`} />
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-3 bg-admin-bg-muted/50 p-2.5 px-4 rounded-xl border border-admin-border">
                                <Clock className="h-4 w-4 text-admin-text-muted" />
                                <span className="text-sm font-semibold text-admin-text">
                                    {latestRun.completed_at
                                        ? formatDistanceToNow(new Date(latestRun.completed_at), { addSuffix: true })
                                        : 'System processing...'}
                                </span>
                            </div>

                            {latestRun.branch && (
                                <div className="flex items-center gap-3">
                                    <GitBranch className="h-4 w-4 text-admin-info" />
                                    <span className="text-sm font-mono font-bold text-admin-text">{latestRun.branch}</span>
                                </div>
                            )}

                            {latestRun.commit_sha && (
                                <div className="flex items-center gap-3">
                                    <GitCommit className="h-4 w-4 text-admin-warning" />
                                    <span className="text-xs font-mono text-admin-text-muted bg-admin-bg-muted p-1 px-2 rounded border border-admin-border">{latestRun.commit_sha.substring(0, 8)}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Timer className="h-4 w-4 text-admin-accent" />
                                <span className="text-sm font-semibold text-admin-text">{formatDuration(latestRun.duration_ms)}</span>
                            </div>
                        </div>

                        <div className="transform scale-110">
                            {getStatusBadge(latestRun.status)}
                        </div>
                    </div>

                    {latestRun.commit_message && (
                        <div className="mt-6 flex items-start gap-3 bg-admin-bg-muted/20 p-4 rounded-xl border border-admin-border border-dashed">
                            <FileCode className="h-4 w-4 text-admin-text-muted mt-0.5" />
                            <p className="text-sm text-admin-text leading-relaxed">
                                {latestRun.commit_message}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Critical Trace: Failed Tests */}
            {latestRun.failed > 0 && latestRun.failed_tests?.length > 0 && (
                <Collapsible open={failedTestsOpen} onOpenChange={setFailedTestsOpen} className="group">
                    <Card className="bg-admin-card border-admin-error/20 overflow-hidden shadow-lg shadow-admin-error/5">
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer bg-admin-error/5 hover:bg-admin-error/10 transition-colors py-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-admin-error font-roboto-slab">
                                        <div className="p-2 bg-admin-error/20 rounded-lg">
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        Execution Failures ({latestRun.failed_tests.length})
                                    </CardTitle>
                                    <div className="p-2 bg-admin-error/10 rounded-full group-data-[state=open]:rotate-180 transition-transform">
                                        <ChevronDown className="h-4 w-4 text-admin-error" />
                                    </div>
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="animate-in slide-in-from-top-2 duration-300">
                            <CardContent className="p-6 space-y-6 pt-0">
                                <div className="grid gap-4 mt-6">
                                    {latestRun.failed_tests.map((test, index) => (
                                        <div key={index} className="border border-admin-error/20 rounded-2xl p-6 bg-admin-card overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-admin-error" />
                                            <div className="flex items-start gap-4">
                                                <XCircle className="h-6 w-6 text-admin-error mt-0.5 flex-shrink-0" />
                                                <div className="flex-1 min-w-0 space-y-4">
                                                    <div>
                                                        <p className="font-bold text-admin-text text-lg font-roboto-slab">{test.name}</p>
                                                        <p className="text-xs text-admin-text-muted font-mono mt-1 opacity-70">{test.file}</p>
                                                    </div>

                                                    <div className="bg-admin-bg-muted p-4 rounded-xl border border-admin-border overflow-x-auto">
                                                        <pre className="text-xs text-admin-error font-mono whitespace-pre-wrap leading-relaxed">
                                                            {test.error}
                                                        </pre>
                                                    </div>

                                                    {test.stack && (
                                                        <details className="group/stack">
                                                            <summary className="text-xs font-bold uppercase tracking-widest text-admin-text-muted cursor-pointer hover:text-admin-info transition-colors my-2 flex items-center gap-2 select-none">
                                                                <div className="h-px bg-admin-border flex-1" />
                                                                Traceback
                                                                <div className="h-px bg-admin-border flex-1" />
                                                            </summary>
                                                            <pre className="mt-3 text-[10px] bg-admin-bg-muted p-4 rounded-xl border border-admin-border overflow-x-auto max-h-60 text-admin-text opacity-70 leading-normal scrollbar-thin">
                                                                {test.stack}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            )}

            {/* Coverage Analytics */}
            {latestRun.coverage_details?.length > 0 && (
                <Card className="bg-admin-card border-admin-border overflow-hidden shadow-sm">
                    <CardHeader className="bg-admin-bg-muted/30 border-b border-admin-border py-4">
                        <CardTitle className="text-lg font-bold text-admin-text font-roboto-slab flex items-center gap-2">
                            <FileCode className="h-5 w-5 text-admin-info" />
                            Coverage Analysis by Entity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-admin-bg-muted/50">
                                        <th className="text-left p-4 font-bold text-admin-text-muted uppercase tracking-widest text-[10px]">Source Module</th>
                                        <th className="text-right p-4 font-bold text-admin-text-muted uppercase tracking-widest text-[10px]">Statements</th>
                                        <th className="text-right p-4 font-bold text-admin-text-muted uppercase tracking-widest text-[10px]">Branches</th>
                                        <th className="text-right p-4 font-bold text-admin-text-muted uppercase tracking-widest text-[10px]">Functions</th>
                                        <th className="text-right p-4 font-bold text-admin-text-muted uppercase tracking-widest text-[10px]">Lines</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-admin-border">
                                    {latestRun.coverage_details.map((file, index) => (
                                        <tr key={index} className="hover:bg-admin-accent/5 transition-colors">
                                            <td className="p-4 font-mono text-[11px] text-admin-text font-medium truncate max-w-md">{file.file.replace('src/', '@/')}</td>
                                            <td className={`p-4 text-right font-bold font-mono text-xs ${getCoverageColor(file.statements)}`}>
                                                {file.statements.toFixed(1)}%
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono text-xs ${getCoverageColor(file.branches)}`}>
                                                {file.branches.toFixed(1)}%
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono text-xs ${getCoverageColor(file.functions)}`}>
                                                {file.functions.toFixed(1)}%
                                            </td>
                                            <td className={`p-4 text-right font-bold font-mono text-xs ${getCoverageColor(file.lines)}`}>
                                                {file.lines.toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audit History */}
            {history.length > 1 && (
                <Card className="bg-admin-card border-admin-border shadow-sm">
                    <CardHeader className="py-4 border-b border-admin-border">
                        <CardTitle className="text-base font-bold text-admin-text font-roboto-slab">Audit Pipeline History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-admin-border">
                            {history.map((run) => (
                                <div key={run.id} className="flex items-center justify-between p-4 hover:bg-admin-bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 flex items-center justify-center">
                                            {getStatusBadge(run.status)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-admin-text">
                                                {run.passed}/{run.total_tests} Modules Passed
                                            </p>
                                            <div className="flex items-center gap-3">
                                                {run.branch && (
                                                    <span className="text-[10px] font-mono text-admin-info bg-admin-info/5 px-2 py-0.5 rounded border border-admin-info/10">
                                                        {run.branch}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-admin-text-muted font-mono uppercase tracking-tighter">
                                                    INT-{run.id.substring(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-admin-text uppercase tracking-wider">
                                            {run.created_at && formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                                        </div>
                                        <p className="text-[10px] text-admin-text-muted mt-1">Automated Run</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
