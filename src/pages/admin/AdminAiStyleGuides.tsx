import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';
import { FormattingRulesTab } from '@/admin/components/config';

const AdminAiStyleGuides = () => {
  const [activeTab, setActiveTab] = useState('formatting');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-roboto-slab font-semibold">Ai Style Guides</h1>
        <p className="text-muted-foreground mt-1">
          Configure AI response formatting and style rules
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="formatting" className="flex items-center gap-2 rounded-full">
            <FileText className="h-4 w-4" />
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
