import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminBlank = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-roboto-slab font-semibold">Hello!</h1>
        <p className="text-muted-foreground">This is a fresh blank tabs page for you.</p>
      </div>

      <Tabs defaultValue="tab1" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="tab1" className="data-[state=active]:bg-background text-foreground">Tab One</TabsTrigger>
          <TabsTrigger value="tab2" className="data-[state=active]:bg-background text-foreground">Tab Two</TabsTrigger>
          <TabsTrigger value="tab3" className="data-[state=active]:bg-background text-foreground">Tab Three</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Tab One Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This is the content for tab one.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Tab Two Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This is the content for tab two.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Tab Three Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This is the content for tab three.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBlank;
