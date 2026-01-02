import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemplatesTab, CategoriesTab, PromptAnalyticsTab } from '@/admin/components/prompts';
import { TemplateImageLibraryTab } from '@/admin/components/shared';

export default function AdminPrompts() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background text-foreground">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-background text-foreground">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-background text-foreground">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-background text-foreground">Image Library</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <PromptAnalyticsTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <TemplateImageLibraryTab 
            folder="templates/prompts"
            title="Prompt Images"
            description="Manage images for prompt templates"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
