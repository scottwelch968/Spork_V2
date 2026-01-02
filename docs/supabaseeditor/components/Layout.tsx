import React from 'react';
import { DashboardTab } from '../types';

interface LayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
  projectRef: string;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, onTabChange, children, projectRef }) => {
  const tabs = [
    { id: DashboardTab.FUNCTIONS, label: 'Edge Functions', icon: '⚡' },
    { id: DashboardTab.AUTH, label: 'Auth & Users', icon: '🔒' },
    { id: DashboardTab.DATABASE, label: 'Database', icon: '💾' },
    { id: DashboardTab.STORAGE, label: 'Storage', icon: '🪣' },
    { id: DashboardTab.REALTIME, label: 'Realtime', icon: '📡' },
    { id: DashboardTab.AI_BRIDGE, label: 'AI Bridge', icon: '🤖' },
  ];

  const bottomTabs = [
    { id: DashboardTab.SETTINGS, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="flex h-screen w-full bg-supa-900 text-supa-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-supa-950 border-r border-supa-800 flex flex-col">
        <div className="p-6 border-b border-supa-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-supa-accent to-cyan-400 bg-clip-text text-transparent">
            ANTIGRAVITY
          </h1>
          <p className="text-xs text-supa-400 mt-1 font-mono">Bridge :: {projectRef || 'No Project'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-supa-800 text-supa-accent border-l-2 border-supa-accent'
                  : 'text-supa-400 hover:bg-supa-900 hover:text-supa-200'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-supa-800 space-y-2">
            {bottomTabs.map((tab) => (
                <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                    ? 'bg-supa-800 text-supa-accent border-l-2 border-supa-accent'
                    : 'text-supa-400 hover:bg-supa-900 hover:text-supa-200'
                }`}
                >
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium text-sm">{tab.label}</span>
                </button>
            ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-supa-900 to-supa-800">
        <div className="p-8 max-w-6xl mx-auto h-full">
            {children}
        </div>
      </main>
    </div>
  );
};