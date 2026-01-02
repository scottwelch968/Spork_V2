import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TabsDemo = () => {
  const tabItems = ["Overview", "Analytics", "Reports", "Settings"];

  return (
    <div className="container mx-auto max-w-4xl py-12 px-6 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tab Variants Demo</h1>
        <p className="text-muted-foreground">Visual comparison of all 6 tab styles</p>
      </div>

      {/* Underline Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Underline (Default)</CardTitle>
          <p className="text-sm text-muted-foreground">Clean text with thin bottom indicator</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="underline">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Underline tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pill Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Pill</CardTitle>
          <p className="text-sm text-muted-foreground">Rounded pill buttons with subtle fill</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="pill">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Pill tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Chip Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Chip</CardTitle>
          <p className="text-sm text-muted-foreground">Smaller rounded chips</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="chip">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Chip tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Segment Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Segment</CardTitle>
          <p className="text-sm text-muted-foreground">Connected segments with background</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="segment">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Segment tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ghost Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Ghost</CardTitle>
          <p className="text-sm text-muted-foreground">Minimal with subtle hover</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="ghost">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Ghost tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Boxed Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">6. Boxed</CardTitle>
          <p className="text-sm text-muted-foreground">Bordered boxes with fill</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList variant="boxed">
              {tabItems.map((item) => (
                <TabsTrigger key={item} value={item.toLowerCase()}>
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview">Boxed tab content</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabsDemo;
