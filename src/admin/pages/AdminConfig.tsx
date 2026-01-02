import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { Shield, ImageIcon, Settings } from 'lucide-react';
import {
  SecurityConfigTab,
  BrandingConfigTab,
} from '@/admin/components/config';

const AdminConfig = () => {
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Settings className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">System Configuration</h1>
          <p className="text-sm text-admin-text-muted">Manage global settings and branding</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-admin-bg-muted">
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
