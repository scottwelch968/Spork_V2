import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpaceAnalyticsTab, SpaceTemplatesTab, SpaceCategoriesTab } from '@/admin/components/spaces';
import { TemplateImageLibraryTab } from '@/admin/components/shared';

export default function AdminSpaces() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background text-foreground">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background text-foreground">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-background text-foreground">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-background text-foreground">Image Library</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SpaceAnalyticsTab />
        </TabsContent>

        <TabsContent value="templates">
          <SpaceTemplatesTab />
        </TabsContent>

        <TabsContent value="categories">
          <SpaceCategoriesTab />
        </TabsContent>

        <TabsContent value="images">
          <TemplateImageLibraryTab 
            folder="templates/spaces"
            title="Space Images"
            description="Manage images for space templates"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}