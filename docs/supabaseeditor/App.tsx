import React, { useState, useEffect } from 'react';
import { DashboardTab, SupabaseCredentials } from './types';
import { Layout } from './components/Layout';
import { FunctionsManager } from './components/FunctionsManager';
import { AuthManager } from './components/AuthManager';
import { AIAssistant } from './components/AIAssistant';
import { DatabaseManager } from './components/DatabaseManager';
import { StorageManager } from './components/StorageManager';
import { RealtimeManager } from './components/RealtimeManager';
import { SettingsManager } from './components/SettingsManager';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.SETTINGS);
  const [creds, setCreds] = useState<SupabaseCredentials | null>(null);

  // Load credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('antigravity_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved));
        setCreds(parsed);
        // Default to functions tab if credentials exist
        setActiveTab(DashboardTab.FUNCTIONS);
      } catch (e) {
        console.error("Failed to load saved creds", e);
      }
    } else {
        setActiveTab(DashboardTab.SETTINGS);
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
    setActiveTab(DashboardTab.SETTINGS);
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      projectRef={creds?.projectRef || ''}
    >
      {activeTab === DashboardTab.SETTINGS && (
        <SettingsManager 
            creds={creds} 
            onSave={handleSaveCreds} 
            onClear={handleClearCreds}
        />
      )}
      {activeTab === DashboardTab.FUNCTIONS && (
        creds ? <FunctionsManager creds={creds} /> : <div className="text-supa-400">Please configure credentials in Settings.</div>
      )}
      {activeTab === DashboardTab.AUTH && (
        creds ? <AuthManager creds={creds} /> : <div className="text-supa-400">Please configure credentials in Settings.</div>
      )}
      {activeTab === DashboardTab.DATABASE && (
        creds ? <DatabaseManager creds={creds} /> : <div className="text-supa-400">Please configure credentials in Settings.</div>
      )}
      {activeTab === DashboardTab.STORAGE && (
        creds ? <StorageManager creds={creds} /> : <div className="text-supa-400">Please configure credentials in Settings.</div>
      )}
      {activeTab === DashboardTab.REALTIME && (
        creds ? <RealtimeManager creds={creds} /> : <div className="text-supa-400">Please configure credentials in Settings.</div>
      )}
      {activeTab === DashboardTab.AI_BRIDGE && (
        <AIAssistant creds={creds} />
      )}
    </Layout>
  );
};

export default App;