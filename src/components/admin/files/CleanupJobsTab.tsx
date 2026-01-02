import { useState, useMemo } from 'react';
import { useCleanupJobs } from '@/hooks/useCleanupJobs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Play, Trash2, FileWarning, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function CleanupJobsTab() {
  const [filter, setFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { 
    jobs, 
    isLoading, 
    refetch, 
    triggerExpiredImages, 
    triggerOrphanedFiles,
    isTriggeringExpired,
    isTriggeringOrphaned
  } = useCleanupJobs(filter === 'all' ? undefined : filter);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalItems = jobs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedJobs = useMemo(() => jobs.slice(startIndex, endIndex), [jobs, startIndex, endIndex]);

  return (
    <div className="space-y-6">
      {/* Manual Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="h-5 w-5" />
            Manual Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => triggerExpiredImages()}
              disabled={isTriggeringExpired}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTriggeringExpired ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Run Expired Images Cleanup
            </Button>
            <Button
              onClick={() => triggerOrphanedFiles()}
              disabled={isTriggeringOrphaned}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTriggeringOrphaned ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileWarning className="h-4 w-4" />
              )}
              Run Orphaned Files Detection
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            These jobs run automatically daily at 3:00 AM (expired images) and 4:00 AM UTC (orphaned files).
          </p>
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Job History
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="cleanup-expired-images">Expired Images</SelectItem>
                <SelectItem value="cleanup-orphaned-files">Orphaned Files</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cleanup jobs have run yet.
            </div>
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Run At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Deleted</TableHead>
                      <TableHead className="text-right">Orphans</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          {job.job_name === 'cleanup-expired-images' ? (
                            <span className="flex items-center gap-2">
                              <Trash2 className="h-4 w-4 text-orange-500" />
                              Expired Images
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <FileWarning className="h-4 w-4 text-blue-500" />
                              Orphaned Files
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.run_at ? formatDistanceToNow(new Date(job.run_at), { addSuffix: true }) : '-'}
                        </TableCell>
                        <TableCell>
                          {job.success ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.deleted_count ?? '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {job.orphan_count ?? '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {job.duration_ms ? `${(job.duration_ms / 1000).toFixed(2)}s` : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {job.error_message ? (
                            <span className="text-red-500 text-sm truncate block" title={job.error_message}>
                              {job.error_message}
                            </span>
                          ) : job.details ? (
                            <span className="text-muted-foreground text-sm truncate block" title={JSON.stringify(job.details)}>
                              {typeof job.details === 'object' 
                                ? Object.entries(job.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                                : String(job.details)}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select 
                    value={pageSize.toString()} 
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>of {totalItems} jobs</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
