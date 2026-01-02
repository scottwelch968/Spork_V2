import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { SupabaseCredentials } from './types';
import { supabaseService } from './services/supabaseService';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  creds: SupabaseCredentials | null;
  onSave: (creds: SupabaseCredentials) => void;
  onClear: () => void;
}

export const SupabaseSettingsTab: React.FC<Props> = ({ creds, onSave, onClear }) => {
  const [projectRef, setProjectRef] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
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
    
    const newCreds: SupabaseCredentials = { 
        projectRef: projectRef.trim(), 
        accessToken: accessToken.trim(), 
        serviceRoleKey: serviceRoleKey.trim() !== '' ? serviceRoleKey.trim() : undefined 
    };

    setTimeout(() => {
        onSave(newCreds);
        setLoading(false);
        toast.success("Configuration saved.");
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
        toast.error("Invalid configuration file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestConnection = async () => {
    if (!projectRef.trim() || !accessToken.trim()) {
      toast.error("Please enter Project Reference ID and Access Token first");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const testCreds: SupabaseCredentials = {
        projectRef: projectRef.trim(),
        accessToken: accessToken.trim(),
        serviceRoleKey: serviceRoleKey.trim() !== '' ? serviceRoleKey.trim() : undefined
      };

      const result = await supabaseService.testConnection(testCreds);
      setTestResult(result);

      if (result.success) {
        toast.success("Connection test successful!");
      } else {
        toast.error("Connection test failed");
      }
    } catch (error: any) {
      const result = {
        success: false,
        message: error.message || 'Unknown error occurred'
      };
      setTestResult(result);
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">Connection Settings</h2>
                 <p className="text-sm text-admin-text-muted mt-1">Configure your link to the Supabase Management API.</p>
             </div>
             <div className="flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />
                <Button 
                    type="button"
                    variant="outline"
                    onClick={handleImportClick}
                >
                    📂 Import Config
                </Button>
                 <Button 
                    type="button"
                    variant="outline"
                    onClick={handleExport}
                    disabled={!projectRef}
                >
                    💾 Export Config
                </Button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-admin-bg-elevated border-admin-border">
                <CardHeader>
                    <CardTitle>Credentials</CardTitle>
                    <CardDescription>Enter your Supabase credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="projectRef">Project Reference ID</Label>
                            <Input
                                id="projectRef"
                                type="text"
                                required
                                value={projectRef}
                                onChange={(e) => setProjectRef(e.target.value)}
                                placeholder="e.g. abcdefghijklmno"
                                className="font-mono"
                            />
                        </div>

                        <div>
                            <Label htmlFor="accessToken">Personal Access Token</Label>
                            <Input
                                id="accessToken"
                                type="password"
                                required
                                value={accessToken}
                                onChange={(e) => setAccessToken(e.target.value)}
                                placeholder="sbp_..."
                                className="font-mono"
                            />
                            <p className="text-xs text-admin-text-muted mt-1">
                                Required for Management API. Found in Supabase Dashboard &gt; Account &gt; Access Tokens.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="serviceRoleKey">
                                Service Role Key <span className="text-admin-text-muted normal-case">(Optional but recommended)</span>
                            </Label>
                            <Input
                                id="serviceRoleKey"
                                type="password"
                                value={serviceRoleKey}
                                onChange={(e) => setServiceRoleKey(e.target.value)}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                                className="font-mono"
                            />
                            <p className="text-xs text-admin-text-muted mt-1">
                                Required for Storage, Realtime, and User Management (Admin Auth). Found in Project Settings &gt; API.
                            </p>
                        </div>

                        <div className="pt-4 space-y-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={testing || !projectRef.trim() || !accessToken.trim()}
                                className="w-full"
                            >
                                {testing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Testing Connection...
                                    </>
                                ) : (
                                    <>
                                        🔌 Test Connection
                                    </>
                                )}
                            </Button>

                            {testResult && (
                                <div className={`p-3 rounded-lg border ${
                                    testResult.success 
                                        ? 'bg-green-500/10 border-green-500/50 text-green-600' 
                                        : 'bg-red-500/10 border-red-500/50 text-red-600'
                                }`}>
                                    <div className="flex items-start gap-2">
                                        {testResult.success ? (
                                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{testResult.message}</p>
                                            {testResult.details && (
                                                <div className="mt-2 text-xs opacity-80">
                                                    {testResult.details.serviceRoleError && (
                                                        <p>Service Role Error: {testResult.details.serviceRoleError}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Saving...' : 'Save Configuration'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={onClear}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <Card className="bg-admin-bg-elevated border-admin-border">
                    <CardHeader>
                        <CardTitle>How it works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-admin-text-muted">
                            Antigravity Bridge connects directly to the Supabase Management API to orchestrate your infrastructure. 
                            It uses your Personal Access Token to deploy Edge Functions and manage Auth Config.
                        </p>
                        <p className="text-sm text-admin-text-muted">
                            The Service Role Key is used for direct database access (via SQL Editor), Storage management, and Realtime inspection. 
                            Credentials are stored in your browser's LocalStorage.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-admin-bg-elevated border-admin-border">
                    <CardHeader>
                        <CardTitle>Security Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-admin-text-muted">
                            Your keys are never sent to any third-party server other than Supabase itself. 
                            Since this application runs client-side, ensure you are using it on a secure machine.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
};

