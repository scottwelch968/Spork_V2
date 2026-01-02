import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { StorageQuotasTab, UserFilesTab, StorageAnalyticsTab } from '@/admin/components/files';
import { StorageOverviewTab } from '@/admin/components/config';
import { FolderTree } from 'lucide-react';

export default function AdminFiles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-accent-muted flex items-center justify-center">
          <FolderTree className="h-5 w-5 text-admin-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">File Management</h1>
          <p className="text-sm text-admin-text-muted">Manage storage, quotas, and user assets</p>
        </div>
      </div>

      <Tabs defaultValue="quotas" className="space-y-6">
        <TabsList className="bg-admin-bg-muted">

          <TabsTrigger value="quotas" className="data-[state=active]:bg-admin-bg text-admin-text">Storage Quotas</TabsTrigger>
          <TabsTrigger value="user-files" className="data-[state=active]:bg-admin-bg text-admin-text">User Files</TabsTrigger>
          <TabsTrigger value="app-media" className="data-[state=active]:bg-admin-bg text-admin-text">App Media</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-admin-bg text-admin-text">Storage Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="quotas">
          <StorageQuotasTab />
        </TabsContent>

        <TabsContent value="user-files">
          <UserFilesTab />
        </TabsContent>

        <TabsContent value="app-media">
          <StorageOverviewTab />
        </TabsContent>

        <TabsContent value="analytics">
          <StorageAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
