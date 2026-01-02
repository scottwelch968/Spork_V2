import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { Palette } from 'lucide-react';
import { FormattingRulesTab } from '@/admin/components/config';

const AdminAiStyleGuides = () => {
  const [activeTab, setActiveTab] = useState('formatting');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Palette className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Ai Style Guides</h1>
          <p className="text-sm text-admin-text-muted">Configure AI response formatting and style rules</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="formatting" className="data-[state=active]:bg-admin-bg text-admin-text">
            Formatting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formatting" className="mt-6">
          <FormattingRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAiStyleGuides;
