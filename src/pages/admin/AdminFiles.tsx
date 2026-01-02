import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StorageQuotasTab, UserFilesTab, StorageAnalyticsTab } from '@/admin/components/files';
import { StorageOverviewTab } from '@/admin/components/config';

export default function AdminFiles() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="quotas" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="quotas" className="data-[state=active]:bg-background text-foreground">Storage Quotas</TabsTrigger>
          <TabsTrigger value="user-files" className="data-[state=active]:bg-background text-foreground">User Files</TabsTrigger>
          <TabsTrigger value="app-media" className="data-[state=active]:bg-background text-foreground">App Media</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background text-foreground">Storage Analytics</TabsTrigger>
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
