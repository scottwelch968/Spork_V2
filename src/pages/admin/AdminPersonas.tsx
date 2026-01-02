import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PersonaTemplatesTab, 
  PersonaConfigTab, 
  PersonaCategoriesTab,
  PersonaAnalyticsTab 
} from '@/admin/components/personas';
import { TemplateImageLibraryTab } from '@/admin/components/shared';

export default function AdminPersonas() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background text-foreground">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background text-foreground">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-background text-foreground">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-background text-foreground">Image Library</TabsTrigger>
          <TabsTrigger value="configuration" className="data-[state=active]:bg-background text-foreground">Configuration</TabsTrigger>
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
