import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { TabThreeContent, TabFourContent, DocsTab, TestDashboardTab } from '@/admin/components/testing';
import { MailCheck, Sparkles, FileText, Activity } from 'lucide-react';

const AdminEmailTesting = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-admin-card p-6 rounded-2xl border border-admin-border shadow-sm">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-admin-info/10 flex items-center justify-center shadow-inner border border-admin-info/20">
            <MailCheck className="h-7 w-7 text-admin-info" />
          </div>
          <div>
            <h1 className="text-3xl font-roboto-slab font-bold text-admin-text tracking-tight">Email & System Testing</h1>
            <p className="text-sm text-admin-text-muted mt-1 leading-relaxed max-w-xl">
              Centralized command center for email orchestration, architectural documentation, and automated pipeline verification.
            </p>
          </div>
        </div>
      </div>

      {/* Main Module Tabs */}
      <Tabs defaultValue="email-testing" className="space-y-6">
        <TabsList className="bg-admin-bg-muted p-1 gap-1 border border-admin-border rounded-xl">
          <TabsTrigger value="email-testing" className="flex items-center gap-2 px-6 py-2.5 data-[state=active]:bg-admin-card text-admin-text transition-all">
            <MailCheck className="h-4 w-4" />
            <span className="font-semibold">Email Testing</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2 px-6 py-2.5 data-[state=active]:bg-admin-card text-admin-text transition-all">
            <FileText className="h-4 w-4" />
            <span className="font-semibold">Documentation</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 px-6 py-2.5 data-[state=active]:bg-admin-card text-admin-text transition-all">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">Test Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2 px-6 py-2.5 data-[state=active]:bg-admin-card text-admin-text transition-all">
            <Sparkles className="h-4 w-4 text-admin-warning" />
            <span className="font-semibold">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="email-testing" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <TabThreeContent />
          </TabsContent>

          <TabsContent value="docs" className="focus-visible:outline-none focus-visible:ring-0">
            <DocsTab />
          </TabsContent>

          <TabsContent value="dashboard" className="focus-visible:outline-none focus-visible:ring-0">
            <TestDashboardTab />
          </TabsContent>

          <TabsContent value="advanced" className="focus-visible:outline-none focus-visible:ring-0">
            <TabFourContent />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminEmailTesting;
