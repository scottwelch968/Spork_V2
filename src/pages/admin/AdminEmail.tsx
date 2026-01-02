import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EmailServerTab,
  EmailRulesTab,
  EmailTemplatesTab,
} from '@/admin/components/email';

export default function AdminEmail() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="server" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="server" className="data-[state=active]:bg-background text-foreground">Email Server</TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-background text-foreground">Email Rules</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background text-foreground">Email Templates</TabsTrigger>
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
