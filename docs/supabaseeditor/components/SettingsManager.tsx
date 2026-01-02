import React, { useState, useEffect, useRef } from 'react';
import { SupabaseCredentials } from '../types';

interface Props {
  creds: SupabaseCredentials | null;
  onSave: (creds: SupabaseCredentials) => void;
  onClear: () => void;
}

export const SettingsManager: React.FC<Props> = ({ creds, onSave, onClear }) => {
  const [projectRef, setProjectRef] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creds) {
        setProjectRef(creds.projectRef || '');
        setAccessToken(creds.accessToken || '');
        setServiceRoleKey(creds.serviceRoleKey || '');
    }
  }, [creds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newCreds = { 
        projectRef: projectRef.trim(), 
        accessToken: accessToken.trim(), 
        serviceRoleKey: serviceRoleKey.trim() !== '' ? serviceRoleKey.trim() : undefined 
    };

    // Simulate short delay for UX
    setTimeout(() => {
        onSave(newCreds);
        setLoading(false);
        alert("Configuration saved.");
    }, 500);
  };

  const handleExport = () => {
    const data = JSON.stringify({
      projectRef,
      accessToken,
      serviceRoleKey
    }, null, 2);
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `antigravity-keys-${projectRef || 'config'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (json.projectRef) setProjectRef(json.projectRef);
        if (json.accessToken) setAccessToken(json.accessToken);
        if (json.serviceRoleKey) setServiceRoleKey(json.serviceRoleKey);
      } catch (err) {
        alert("Invalid configuration file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-3xl font-bold text-white tracking-tight">Connection Settings</h2>
                 <p className="text-supa-400 mt-1">Configure your link to the Supabase Management API.</p>
             </div>
             <div className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
                <button 
                    type="button"
                    onClick={handleImportClick}
                    className="bg-supa-800 hover:bg-supa-700 text-supa-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                    📂 Import Config
                </button>
                 <button 
                    type="button"
                    onClick={handleExport}
                    disabled={!projectRef}
                    className="bg-supa-800 hover:bg-supa-700 text-supa-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                    💾 Export Config
                </button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-supa-950 border border-supa-800 rounded-xl p-6 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider">Project Reference ID</label>
                        <input
                            type="text"
                            required
                            value={projectRef}
                            onChange={(e) => setProjectRef(e.target.value)}
                            placeholder="e.g. abcdefghijklmno"
                            className="w-full bg-supa-900 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider">Personal Access Token</label>
                        <input
                            type="password"
                            required
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            placeholder="sbp_..."
                            className="w-full bg-supa-900 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent font-mono text-sm"
                        />
                        <p className="mt-1 text-[10px] text-supa-500">
                            Required for Management API. Found in Supabase Dashboard &gt; Account &gt; Access Tokens.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                            <span>Service Role Key</span>
                            <span className="text-supa-500 normal-case tracking-normal">(Optional but recommended)</span>
                        </label>
                        <input
                            type="password"
                            value={serviceRoleKey}
                            onChange={(e) => setServiceRoleKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                            className="w-full bg-supa-900 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent font-mono text-sm"
                        />
                        <p className="mt-1 text-[10px] text-supa-500">
                            Required for Storage, Realtime, and User Management (Admin Auth). Found in Project Settings &gt; API.
                        </p>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-supa-accent hover:bg-supa-accentDark text-supa-950 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                        <button
                            type="button"
                            onClick={onClear}
                            className="px-6 py-3 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 rounded-lg font-bold transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Section */}
            <div className="space-y-6">
                <div className="bg-supa-900/50 border border-supa-800 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-2">How it works</h3>
                    <p className="text-sm text-supa-300 leading-relaxed mb-4">
                        Antigravity Bridge connects directly to the Supabase Management API to orchestrate your infrastructure. 
                        It uses your Personal Access Token to deploy Edge Functions and manage Auth Config.
                    </p>
                    <p className="text-sm text-supa-300 leading-relaxed">
                        The Service Role Key is used for direct database access (via SQL Editor), Storage management, and Realtime inspection. 
                        Credentials are stored in your browser's LocalStorage.
                    </p>
                </div>

                 <div className="bg-supa-900/50 border border-supa-800 rounded-xl p-6">
                    <h3 className="font-bold text-white mb-2">Security Note</h3>
                    <p className="text-sm text-supa-300 leading-relaxed">
                        Your keys are never sent to any third-party server other than Supabase itself. 
                        Since this application runs client-side, ensure you are using it on a secure machine.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};