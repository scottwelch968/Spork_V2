import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import {
  PersonaTemplatesTab,
  PersonaConfigTab,
  PersonaCategoriesTab,
  PersonaAnalyticsTab
} from '@/admin/components/personas';
import { TemplateImageLibraryTab } from '@/admin/components/shared';
import { UserSquare2 } from 'lucide-react';

export default function AdminPersonas() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <UserSquare2 className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Persona Management</h1>
          <p className="text-sm text-admin-text-muted">Configure persona templates and behavioral rules</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-admin-bg text-admin-text">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-admin-bg text-admin-text">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-admin-bg text-admin-text">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-admin-bg text-admin-text">Image Library</TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-admin-bg text-admin-text">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <PersonaAnalyticsTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <PersonaTemplatesTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <PersonaCategoriesTab />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <TemplateImageLibraryTab
            folder="templates/personas"
            title="Persona Avatars"
            description="Manage avatar images for persona templates"
          />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <PersonaConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
