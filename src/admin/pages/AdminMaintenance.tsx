import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { ScheduledJobsTab, JobHistoryTab, JobSchedulerTab } from '@/admin/components/maintenance';

export default function AdminMaintenance() {
  const [activeTab, setActiveTab] = useState('scheduled-jobs');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-roboto-slab font-semibold text-admin-text">Maintenance</h1>
        <p className="text-admin-text-muted">Manage scheduled jobs and view execution history</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-admin-bg-muted/50 p-1 rounded-full">
          <TabsTrigger value="scheduled-jobs" className="rounded-full">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="job-history" className="rounded-full">Job History</TabsTrigger>
          <TabsTrigger value="job-scheduler" className="rounded-full">Job Scheduler</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled-jobs">
          <ScheduledJobsTab />
        </TabsContent>

        <TabsContent value="job-history">
          <JobHistoryTab />
        </TabsContent>

        <TabsContent value="job-scheduler">
          <JobSchedulerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
