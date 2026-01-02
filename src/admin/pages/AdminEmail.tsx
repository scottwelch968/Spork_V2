import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import {
  EmailServerTab,
  EmailRulesTab,
  EmailTemplatesTab,
} from '@/admin/components/email';

export default function AdminEmail() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Email Orchestration</h1>
      <Tabs defaultValue="server" className="space-y-6">
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="server" className="data-[state=active]:bg-admin-bg text-admin-text">Email Server</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-admin-bg text-admin-text">Email Rules</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-admin-bg text-admin-text">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="server">
          <EmailServerTab />
        </TabsContent>

        <TabsContent value="rules">
          <EmailRulesTab />
        </TabsContent>

        <TabsContent value="templates">
          <EmailTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
