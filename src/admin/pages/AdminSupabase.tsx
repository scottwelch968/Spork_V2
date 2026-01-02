import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { Database } from 'lucide-react';
import { SupabaseSettingsTab } from '@/admin/components/supabase/SettingsTab';
import { SupabaseFunctionsTab } from '@/admin/components/supabase/FunctionsTab';
import { SupabaseAuthTab } from '@/admin/components/supabase/AuthTab';
import { SupabaseDatabaseTab } from '@/admin/components/supabase/DatabaseTab';
import { SupabaseStorageTab } from '@/admin/components/supabase/StorageTab';
import { SupabaseRealtimeTab } from '@/admin/components/supabase/RealtimeTab';
import { SupabaseAITab } from '@/admin/components/supabase/AITab';
import { MigrationTab } from '@/admin/components/supabase/MigrationTab';
import type { SupabaseCredentials } from '@/admin/components/supabase/types';

const AdminSupabase = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [creds, setCreds] = useState<SupabaseCredentials | null>(null);

  // Load credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('antigravity_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved));
        setCreds(parsed);
        // Default to functions tab if credentials exist
        setActiveTab('functions');
      } catch (e) {
        console.error("Failed to load saved creds", e);
      }
    }
  }, []);

  const handleSaveCreds = (credentials: SupabaseCredentials) => {
    setCreds(credentials);
    const toSave = btoa(JSON.stringify(credentials));
    localStorage.setItem('antigravity_creds', toSave);
  };

  const handleClearCreds = () => {
    setCreds(null);
    localStorage.removeItem('antigravity_creds');
    setActiveTab('settings');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Database className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Supabase</h1>
          <p className="text-sm text-admin-text-muted">Manage Supabase database configuration and settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-admin-bg-muted">
          <TabsTrigger value="settings" className="data-[state=active]:bg-admin-bg text-admin-text">
            ⚙️ Settings
          </TabsTrigger>
          <TabsTrigger value="functions" className="data-[state=active]:bg-admin-bg text-admin-text">
            ⚡ Edge Functions
          </TabsTrigger>
          <TabsTrigger value="auth" className="data-[state=active]:bg-admin-bg text-admin-text">
            🔒 Auth & Users
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-admin-bg text-admin-text">
            💾 Database
          </TabsTrigger>
          <TabsTrigger value="storage" className="data-[state=active]:bg-admin-bg text-admin-text">
            🪣 Storage
          </TabsTrigger>
          <TabsTrigger value="realtime" className="data-[state=active]:bg-admin-bg text-admin-text">
            📡 Realtime
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-admin-bg text-admin-text">
            🤖 AI Bridge
          </TabsTrigger>
          <TabsTrigger value="migration" className="data-[state=active]:bg-admin-bg text-admin-text">
            🚀 Migration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SupabaseSettingsTab 
            creds={creds} 
            onSave={handleSaveCreds} 
            onClear={handleClearCreds}
          />
        </TabsContent>

        <TabsContent value="functions">
          {creds ? (
            <SupabaseFunctionsTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>

        <TabsContent value="auth">
          {creds ? (
            <SupabaseAuthTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>

        <TabsContent value="database">
          {creds ? (
            <SupabaseDatabaseTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>

        <TabsContent value="storage">
          {creds ? (
            <SupabaseStorageTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>

        <TabsContent value="realtime">
          {creds ? (
            <SupabaseRealtimeTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>

        <TabsContent value="ai">
          <SupabaseAITab creds={creds} />
        </TabsContent>

        <TabsContent value="migration">
          {creds ? (
            <MigrationTab creds={creds} />
          ) : (
            <div className="text-admin-text-muted p-6">Please configure credentials in Settings.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSupabase;
