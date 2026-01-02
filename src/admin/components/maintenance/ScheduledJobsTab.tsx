import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { RefreshCw, Play, Clock, Calendar, Loader2, Trash2, FolderX, Settings2 } from 'lucide-react';
import { useScheduledJobs } from '@/hooks/useScheduledJobs';
import { cn } from '@/admin/lib/utils';

export function ScheduledJobsTab() {
  const { jobs, isLoading, refetch, toggleJob, runJobNow, isToggling, isRunning } = useScheduledJobs();
  const [runningJobId, setRunningJobId] = useState<string | null>(null);

  const handleRunNow = async (jobId: string, jobName: string) => {
    setRunningJobId(jobId);
    await runJobNow({ jobId, jobName });
    setRunningJobId(null);
  };

  const getJobIcon = (jobName: string) => {
    if (jobName.includes('sync')) return <RefreshCw className="h-5 w-5 text-admin-info" />;
    if (jobName.includes('cleanup')) return <Trash2 className="h-5 w-5 text-admin-error" />;
    if (jobName.includes('orphan')) return <FolderX className="h-5 w-5 text-admin-warning" />;
    return <Settings2 className="h-5 w-5 text-admin-text-muted" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-roboto-slab">Scheduled Jobs</CardTitle>
          <CardDescription>Manage automated background tasks and cron jobs</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-admin-text-muted">
            No scheduled jobs found
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start justify-between p-4 border border-admin-border rounded-lg bg-admin-bg-elevated hover:bg-admin-accent/5 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-admin-bg-muted/50">
                      {getJobIcon(job.job_name)}
                    </div>
                    <div>
                      <h4 className="font-medium text-admin-text">{job.job_name}</h4>
                      <p className="text-sm text-admin-text-muted">{job.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-admin-text-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{job.schedule_description || job.schedule_expression}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {job.last_run_at
                          ? `Last run: ${new Date(job.last_run_at).toLocaleString()}`
                          : 'Never run'}
                      </span>
                    </div>
                    {job.last_run_success !== null && (
                      <Badge variant={job.last_run_success ? "default" : "destructive"}>
                        {job.last_run_success ? 'Success' : 'Failed'}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2">
                    <code className="text-xs bg-admin-bg-muted px-2 py-1 rounded font-mono">
                      {job.target_function}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-admin-text-muted">
                      {job.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={job.is_active}
                      onCheckedChange={() => toggleJob({ jobId: job.id, isActive: !job.is_active })}
                      disabled={isToggling}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunNow(job.id, job.job_name)}
                    disabled={isRunning || runningJobId === job.id}
                  >
                    {runningJobId === job.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="ml-1">Run Now</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
