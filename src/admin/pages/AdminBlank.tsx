import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardHeader, CardTitle } from '@/admin/ui';
import { Layout } from 'lucide-react';

const AdminBlank = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Layout className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Blank Page</h1>
          <p className="text-sm text-admin-text-muted">A template for new administrative pages</p>
        </div>
      </div>

      <Tabs defaultValue="tab1" className="space-y-6">
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="tab1" className="data-[state=active]:bg-admin-bg text-admin-text">Tab One</TabsTrigger>
          <TabsTrigger value="tab2" className="data-[state=active]:bg-admin-bg text-admin-text">Tab Two</TabsTrigger>
          <TabsTrigger value="tab3" className="data-[state=active]:bg-admin-bg text-admin-text">Tab Three</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="space-y-6">
          <Card className="bg-admin-bg-elevated border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text">Tab One Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-admin-text-muted">This is the content for tab one.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2" className="space-y-6">
          <Card className="bg-admin-bg-elevated border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text">Tab Two Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-admin-text-muted">This is the content for tab two.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3" className="space-y-6">
          <Card className="bg-admin-bg-elevated border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-text">Tab Three Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-admin-text-muted">This is the content for tab three.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBlank;
