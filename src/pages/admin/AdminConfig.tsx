import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ImageIcon } from 'lucide-react';
import {
  SecurityConfigTab,
  BrandingConfigTab,
} from '@/admin/components/config';

const AdminConfig = () => {
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="security" className="flex items-center gap-2 rounded-full">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2 rounded-full">
            <ImageIcon className="h-4 w-4" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-6">
          <SecurityConfigTab />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;
