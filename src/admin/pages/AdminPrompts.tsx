import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { TemplatesTab, CategoriesTab, PromptAnalyticsTab } from '@/admin/components/prompts';
import { TemplateImageLibraryTab } from '@/admin/components/shared';
import { MessageSquare } from 'lucide-react';

export default function AdminPrompts() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Prompt Templates</h1>
          <p className="text-sm text-admin-text-muted">Manage prompt library, categories and assets</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-admin-bg text-admin-text">Analytics</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-admin-bg text-admin-text">Templates</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-admin-bg text-admin-text">Categories</TabsTrigger>
          <TabsTrigger value="images" className="data-[state=active]:bg-admin-bg text-admin-text">Image Library</TabsTrigger>
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
