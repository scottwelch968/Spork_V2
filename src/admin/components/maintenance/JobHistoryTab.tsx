import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { Button } from '@/admin/ui/button';
import { Badge } from '@/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { useCleanupJobs } from '@/hooks/useCleanupJobs';
import { cn } from '@/admin/lib/utils';

export function JobHistoryTab() {
  const [jobFilter, setJobFilter] = useState<string | undefined>(undefined);
  const { jobs, isLoading, refetch, triggerExpiredImages, triggerOrphanedFiles, isTriggeringExpired, isTriggeringOrphaned } = useCleanupJobs(jobFilter);

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-roboto-slab">Quick Actions</CardTitle>
          <CardDescription>Manually trigger cleanup jobs</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => triggerExpiredImages()}
            disabled={isTriggeringExpired}
          >
            {isTriggeringExpired && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Run Expired Images Cleanup
          </Button>
          <Button
            variant="outline"
            onClick={() => triggerOrphanedFiles()}
            disabled={isTriggeringOrphaned}
          >
            {isTriggeringOrphaned && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Run Orphaned Files Detection
          </Button>
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-roboto-slab">Job Execution History</CardTitle>
            <CardDescription>View past job runs and their results</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={jobFilter || 'all'} onValueChange={(v) => setJobFilter(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="cleanup-expired-images">Expired Images</SelectItem>
                <SelectItem value="cleanup-orphaned-files">Orphaned Files</SelectItem>
                <SelectItem value="sync-openrouter-models">Sync Models</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-admin-text-muted">
              No job history found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Run At</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        {job.success ? (
                          <CheckCircle2 className="h-5 w-5 text-admin-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-admin-error" />
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-admin-bg-muted px-2 py-1 rounded font-mono border border-admin-border">
                          {job.job_name}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-admin-text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(job.run_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatDuration(job.duration_ms)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {job.deleted_count !== null && job.deleted_count > 0 && (
                            <Badge variant="secondary">Deleted: {job.deleted_count}</Badge>
                          )}
                          {job.orphan_count !== null && job.orphan_count > 0 && (
                            <Badge variant="secondary">Orphans: {job.orphan_count}</Badge>
                          )}
                          {job.updated_messages !== null && job.updated_messages > 0 && (
                            <Badge variant="secondary">Updated: {job.updated_messages}</Badge>
                          )}
                          {job.total_records_checked !== null && (
                            <Badge variant="outline">Checked: {job.total_records_checked}</Badge>
                          )}
                          {job.error_message && (
                            <Badge variant="destructive" className="max-w-xs truncate">
                              {job.error_message}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
