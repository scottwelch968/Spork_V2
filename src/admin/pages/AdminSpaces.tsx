import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { SpaceAnalyticsTab, SpaceTemplatesTab, SpaceCategoriesTab } from '@/admin/components/spaces';
import { TemplateImageLibraryTab } from '@/admin/components/shared';
import { LayoutGrid } from 'lucide-react';

export default function AdminSpaces() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Spaces Management</h1>
          <p className="text-sm text-admin-text-muted">Manage space templates, categories and assets</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-admin-bg text-admin-text">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-admin-bg text-admin-text">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-admin-bg text-admin-text">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-admin-bg text-admin-text">Image Library</TabsTrigger>
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
