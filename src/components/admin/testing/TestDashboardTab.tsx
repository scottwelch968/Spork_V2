import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  FileCode
} from 'lucide-react';
import { useTestResults, TestRun } from '@/hooks/useTestResults';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

function getCoverageColor(value: number | null): string {
  if (value === null) return 'text-muted-foreground';
  if (value >= 80) return 'text-green-600';
  if (value >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getStatusBadge(status: TestRun['status']) {
  switch (status) {
    case 'passed':
      return <Badge className="bg-green-100 text-green-800 border-green-200">Passed</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Running</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
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
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!latestRun) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Test Dashboard
          </CardTitle>
          <CardDescription>
            View automated test results and coverage reports from CI/CD pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Test Runs Yet</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Test results will appear here once your CI/CD pipeline starts reporting them.
              Configure your pipeline to POST results to the report-test-results endpoint.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const coverageAvg = latestRun.coverage_lines !== null ? latestRun.coverage_lines : null;

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-roboto-slab">Test Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Automated test results and coverage reports
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Tests</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{latestRun.total_tests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Passed</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{latestRun.passed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed</span>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{latestRun.failed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Skipped</span>
              <SkipForward className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold mt-2 text-yellow-600">{latestRun.skipped}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coverage</span>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold mt-2 ${getCoverageColor(coverageAvg)}`}>
              {coverageAvg !== null ? `${coverageAvg.toFixed(1)}%` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Run Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {latestRun.completed_at 
                    ? formatDistanceToNow(new Date(latestRun.completed_at), { addSuffix: true })
                    : 'In progress'}
                </span>
              </div>
              
              {latestRun.branch && (
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{latestRun.branch}</span>
                </div>
              )}
              
              {latestRun.commit_sha && (
                <div className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{latestRun.commit_sha.substring(0, 7)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatDuration(latestRun.duration_ms)}</span>
              </div>
            </div>
            
            {getStatusBadge(latestRun.status)}
          </div>
          
          {latestRun.commit_message && (
            <p className="text-sm text-muted-foreground mt-3 truncate">
              {latestRun.commit_message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Failed Tests */}
      {latestRun.failed > 0 && latestRun.failed_tests?.length > 0 && (
        <Collapsible open={failedTestsOpen} onOpenChange={setFailedTestsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Failed Tests ({latestRun.failed_tests.length})
                  </CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform ${failedTestsOpen ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {latestRun.failed_tests.map((test, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-red-50/50">
                      <div className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{test.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{test.file}</p>
                          <pre className="mt-2 text-xs bg-background/80 p-2 rounded overflow-x-auto">
                            {test.error}
                          </pre>
                          {test.stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View Stack Trace
                              </summary>
                              <pre className="mt-1 text-xs bg-background/80 p-2 rounded overflow-x-auto max-h-32">
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

      {/* Coverage Details */}
      {latestRun.coverage_details?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage by File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">File</th>
                    <th className="text-right py-2 font-medium w-20">Stmts</th>
                    <th className="text-right py-2 font-medium w-20">Branch</th>
                    <th className="text-right py-2 font-medium w-20">Funcs</th>
                    <th className="text-right py-2 font-medium w-20">Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {latestRun.coverage_details.map((file, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs truncate max-w-xs">{file.file}</td>
                      <td className={`py-2 text-right ${getCoverageColor(file.statements)}`}>
                        {file.statements.toFixed(0)}%
                      </td>
                      <td className={`py-2 text-right ${getCoverageColor(file.branches)}`}>
                        {file.branches.toFixed(0)}%
                      </td>
                      <td className={`py-2 text-right ${getCoverageColor(file.functions)}`}>
                        {file.functions.toFixed(0)}%
                      </td>
                      <td className={`py-2 text-right ${getCoverageColor(file.lines)}`}>
                        {file.lines.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test History */}
      {history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test History (Last 10 Runs)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    {getStatusBadge(run.status)}
                    <span className="text-sm">
                      {run.passed}/{run.total_tests} passed
                    </span>
                    {run.branch && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {run.branch}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {run.created_at && formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
