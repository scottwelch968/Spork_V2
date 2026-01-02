import React, { useState, useEffect, useRef } from 'react';
import { SupabaseCredentials } from '../types';

interface ConnectProps {
  onConnect: (creds: SupabaseCredentials) => void;
}

export const Connect: React.FC<ConnectProps> = ({ onConnect }) => {
  const [projectRef, setProjectRef] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('antigravity_creds');
    if (saved) {
      try {
        const parsed = JSON.parse(atob(saved));
        setProjectRef(parsed.projectRef || '');
        setAccessToken(parsed.accessToken || '');
        setServiceRoleKey(parsed.serviceRoleKey || '');
        setRemember(true);
      } catch (e) {
        console.error("Failed to load saved creds");
        localStorage.removeItem('antigravity_creds');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const creds = { 
        projectRef: projectRef.trim(), 
        accessToken: accessToken.trim(), 
        serviceRoleKey: serviceRoleKey.trim() !== '' ? serviceRoleKey.trim() : undefined 
    };

    if (remember) {
      // Simple base64 encoding to prevent shoulder surfing, not encryption
      const toSave = btoa(JSON.stringify(creds));
      localStorage.setItem('antigravity_creds', toSave);
    } else {
      localStorage.removeItem('antigravity_creds');
    }

    setTimeout(() => {
        onConnect(creds);
        setLoading(false);
    }, 800);
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
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-supa-950 p-4">
      <div className="w-full max-w-md bg-supa-900 border border-supa-800 rounded-xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-supa-accent via-cyan-500 to-purple-500"></div>
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
        />

        <div className="p-8">
          <div className="mb-8 text-center relative">
             <div className="w-16 h-16 bg-supa-800 rounded-full mx-auto flex items-center justify-center mb-4 border border-supa-700 shadow-inner">
                <span className="text-3xl">🌉</span>
             </div>
            <h1 className="text-2xl font-bold text-white mb-2">Antigravity Bridge</h1>
            <p className="text-supa-400 text-sm">
              Connect to your Supabase Infrastructure
            </p>
            
            {/* Action Bar */}
            <div className="absolute top-0 right-0 flex gap-2">
                <button 
                    type="button"
                    onClick={handleImportClick}
                    className="text-xs text-supa-400 hover:text-white bg-supa-800 hover:bg-supa-700 px-2 py-1 rounded transition-colors"
                    title="Load from JSON file"
                >
                    📂 Load
                </button>
                 <button 
                    type="button"
                    onClick={handleExport}
                    disabled={!projectRef && !accessToken}
                    className="text-xs text-supa-400 hover:text-white bg-supa-800 hover:bg-supa-700 px-2 py-1 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Save to JSON file"
                >
                    💾 Save
                </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider">Project Reference ID *</label>
              <input
                type="text"
                required
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                placeholder="e.g. abcdefghijklmno"
                className="w-full bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent focus:ring-1 focus:ring-supa-accent transition-all font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider">Personal Access Token *</label>
              <input
                type="password"
                required
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="sbp_..."
                className="w-full bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent focus:ring-1 focus:ring-supa-accent transition-all font-mono text-sm"
              />
              <p className="mt-1 text-[10px] text-supa-500">
                Found in Supabase Dashboard &gt; Account &gt; Access Tokens.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono text-supa-400 mb-1 uppercase tracking-wider flex items-center justify-between">
                <span>Service Role Key</span>
                <span className="text-supa-500 normal-case tracking-normal">(Optional)</span>
              </label>
              <input
                type="password"
                value={serviceRoleKey}
                onChange={(e) => setServiceRoleKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                className="w-full bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent focus:ring-1 focus:ring-supa-accent transition-all font-mono text-sm"
              />
              <p className="mt-1 text-[10px] text-supa-500">
                Required for User Management. Found in Project Settings &gt; API.
              </p>
            </div>

            <div className="flex items-center">
                <input 
                    id="remember-me" 
                    type="checkbox" 
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-supa-600 text-supa-accent focus:ring-supa-accent bg-supa-950"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-supa-400 cursor-pointer">
                    Remember details locally
                </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-supa-accent hover:bg-supa-accentDark text-supa-950 font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="animate-pulse">Establishing Link...</span>
              ) : (
                'Initialize Bridge'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};