import React, { useState, useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseCredentials } from './types';
import { aiService } from './services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Textarea } from '@/admin/ui/textarea';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Loader2, Radio, Send, Trash2, Code, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePublicModels } from '@/hooks/usePublicModels';

interface Props {
  creds: SupabaseCredentials;
}

interface LogEntry {
  id: string;
  time: string;
  type: 'system' | 'postgres' | 'broadcast' | 'presence';
  message: string;
  payload?: any;
}

export const SupabaseRealtimeTab: React.FC<Props> = ({ creds }) => {
  // Connection State
  const [client, setClient] = useState<any>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Config State
  const [channelName, setChannelName] = useState('room-1');
  const [enablePostgres, setEnablePostgres] = useState(false);
  const [pgTable, setPgTable] = useState('*');
  const [pgEvent, setPgEvent] = useState('*');
  const [enableBroadcast, setEnableBroadcast] = useState(true);
  const [enablePresence, setEnablePresence] = useState(true);
  const [presenceState, setPresenceState] = useState<any>({});

  // Broadcast Sender State
  const [broadcastEvent, setBroadcastEvent] = useState('message');
  const [broadcastPayload, setBroadcastPayload] = useState('{"text": "Hello World"}');

  // AI State
  const [showAiCode, setShowAiCode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Get models
  let activeModels: any[] = [];
  let modelsLoading = false;
  try {
    const modelsResult = usePublicModels();
    activeModels = Array.isArray(modelsResult?.activeModels) ? modelsResult.activeModels : [];
    modelsLoading = modelsResult?.isLoading ?? false;
  } catch (err) {
    console.warn('Could not load models:', err);
    activeModels = [];
    modelsLoading = false;
  }

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [channel]);

  const addLog = (type: LogEntry['type'], message: string, payload?: any) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      payload
    }]);
  };

  const handleConnect = () => {
    if (!creds.serviceRoleKey) {
      toast.error("Service Role Key required for full Realtime access.");
      return;
    }

    // Initialize Client
    const supabase = createClient(`https://${creds.projectRef}.supabase.co`, creds.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    setClient(supabase);

    const ch = supabase.channel(channelName);

    // Postgres Changes
    if (enablePostgres) {
      ch.on('postgres_changes', 
        { event: pgEvent as any, schema: 'public', table: pgTable }, 
        (payload) => {
          addLog('postgres', `DB Change on ${payload.table}`, payload);
        }
      );
    }

    // Broadcast
    if (enableBroadcast) {
      ch.on('broadcast', { event: '*' }, (payload) => {
        addLog('broadcast', `Received '${payload.event}'`, payload.payload);
      });
    }

    // Presence
    if (enablePresence) {
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        setPresenceState(state);
        addLog('presence', 'Presence Synced', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        addLog('presence', `User Joined: ${key}`, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        addLog('presence', `User Left: ${key}`, leftPresences);
      });
    }

    // Subscribe
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        addLog('system', `Connected to channel '${channelName}'`);
        toast.success(`Connected to channel '${channelName}'`);
        
        // Track own presence if enabled
        if (enablePresence) {
          ch.track({ 
            online_at: new Date().toISOString(), 
            user: 'Antigravity Admin',
            platform: navigator.platform 
          });
        }
      } else {
        addLog('system', `Status: ${status}`);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error(`Connection status: ${status}`);
        }
      }
    });

    setChannel(ch);
  };

  const handleDisconnect = () => {
    if (channel) {
      channel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
      setPresenceState({});
      addLog('system', 'Disconnected');
      toast.info('Disconnected from channel');
    }
  };

  const handleSendBroadcast = async () => {
    if (!channel || !isConnected) {
      toast.error('Not connected to channel');
      return;
    }
    try {
      const payload = JSON.parse(broadcastPayload);
      await channel.send({
        type: 'broadcast',
        event: broadcastEvent,
        payload: payload
      });
      addLog('system', `Sent Broadcast '${broadcastEvent}'`);
      toast.success(`Broadcast '${broadcastEvent}' sent`);
    } catch (e: any) {
      toast.error(`Invalid JSON payload: ${e.message}`);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !selectedModel) {
      toast.error('Please enter a prompt and select a model');
      return;
    }
    setGenerating(true);
    try {
      const prompt = `Generate Supabase Realtime client code for: ${aiPrompt}. Return ONLY raw JavaScript/TypeScript code, no markdown, no explanations. Use @supabase/supabase-js client.`;
      const code = await aiService.askAssistant(prompt, creds, selectedModel);
      // Clean up the response
      let cleanedCode = code.trim();
      cleanedCode = cleanedCode.replace(/^```typescript\n?/, '').replace(/^```ts\n?/, '').replace(/^```javascript\n?/, '').replace(/^```js\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
      setGeneratedCode(cleanedCode);
    } catch (err: any) {
      toast.error(`Failed to generate code: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">Real-time Inspector</h2>
          <p className="text-sm text-admin-text-muted mt-1">Debug Broadcasts, Presence, and Database changes</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAiCode(!showAiCode)}
        >
          <Code className="h-4 w-4 mr-2" />
          {showAiCode ? 'Hide Code Gen' : 'Generate Client Code'}
        </Button>
      </div>

      {/* AI Code Generator */}
      {showAiCode && (
        <Card>
          <CardHeader>
            <CardTitle>AI Code Generator</CardTitle>
            <p className="text-sm text-admin-text-muted">Describe what you want to listen for and generate client code</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleGenerateCode} className="flex gap-2">
              <Input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe what you want to listen for (e.g. 'Update user count when new users join')"
                className="flex-1"
              />
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={modelsLoading}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={modelsLoading ? "Loading..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {activeModels.map((model) => (
                    <SelectItem key={model.model_id} value={model.model_id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="submit"
                disabled={generating || !aiPrompt.trim() || !selectedModel}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </Button>
            </form>
            {generatedCode && (
              <div className="bg-admin-bg-muted rounded-lg p-4 border border-admin-border">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-xs">Generated Code</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGeneratedCode('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-xs font-mono text-admin-text whitespace-pre-wrap overflow-x-auto">
                  {generatedCode}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  type="text"
                  value={channelName}
                  disabled={isConnected}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="font-mono mt-1"
                />
              </div>
              
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  className="w-full"
                  disabled={!creds.serviceRoleKey}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="w-full"
                >
                  Disconnect
                </Button>
              )}
              
              {isConnected && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Connected</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Postgres Changes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Postgres Changes</Label>
                  <Switch
                    checked={enablePostgres}
                    disabled={isConnected}
                    onCheckedChange={setEnablePostgres}
                  />
                </div>
                {enablePostgres && (
                  <div className="pl-4 border-l-2 border-admin-border space-y-2">
                    <div>
                      <Label className="text-xs">Event</Label>
                      <Select
                        value={pgEvent}
                        onValueChange={setPgEvent}
                        disabled={isConnected}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">ALL (Insert/Update/Delete)</SelectItem>
                          <SelectItem value="INSERT">INSERT</SelectItem>
                          <SelectItem value="UPDATE">UPDATE</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Table</Label>
                      <Input
                        type="text"
                        value={pgTable}
                        disabled={isConnected}
                        onChange={(e) => setPgTable(e.target.value)}
                        placeholder="* or table_name"
                        className="font-mono text-xs mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Broadcast */}
              <div className="flex items-center justify-between">
                <Label>Broadcast</Label>
                <Switch
                  checked={enableBroadcast}
                  disabled={isConnected}
                  onCheckedChange={setEnableBroadcast}
                />
              </div>

              {/* Presence */}
              <div className="flex items-center justify-between">
                <Label>Presence</Label>
                <Switch
                  checked={enablePresence}
                  disabled={isConnected}
                  onCheckedChange={setEnablePresence}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle: Event Log */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Live Logs</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-admin-bg-muted rounded-lg p-4 h-[600px] overflow-y-auto space-y-3 font-mono text-sm">
              {logs.length === 0 && (
                <div className="text-admin-text-muted italic text-center mt-10">Waiting for events...</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="animate-in fade-in slide-in-from-left-2">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-admin-text-muted text-[10px]">{log.time}</span>
                    <Badge
                      variant={
                        log.type === 'system' ? 'secondary' :
                        log.type === 'postgres' ? 'default' :
                        log.type === 'broadcast' ? 'outline' : 'default'
                      }
                      className="text-xs"
                    >
                      {log.type.toUpperCase()}
                    </Badge>
                    <span className="text-admin-text text-xs">{log.message}</span>
                  </div>
                  {log.payload && (
                    <pre className="text-[10px] text-admin-text-muted bg-admin-bg-elevated p-2 rounded ml-14 overflow-x-auto border-l-2 border-admin-border">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Right: Tools */}
        <div className="space-y-4">
          {/* Broadcast Sender */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Send Broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Event Name</Label>
                <Input
                  type="text"
                  value={broadcastEvent}
                  disabled={!isConnected || !enableBroadcast}
                  onChange={(e) => setBroadcastEvent(e.target.value)}
                  className="font-mono text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Payload (JSON)</Label>
                <Textarea
                  value={broadcastPayload}
                  disabled={!isConnected || !enableBroadcast}
                  onChange={(e) => setBroadcastPayload(e.target.value)}
                  className="font-mono text-xs min-h-[100px] mt-1"
                />
              </div>
              <Button
                onClick={handleSendBroadcast}
                disabled={!isConnected || !enableBroadcast}
                className="w-full"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Presence List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Presence State</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {Object.keys(presenceState).length} Users
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!isConnected || !enablePresence ? (
                <div className="text-xs text-admin-text-muted italic">Presence disabled or disconnected.</div>
              ) : Object.keys(presenceState).length === 0 ? (
                <div className="text-xs text-admin-text-muted italic">No users present.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(presenceState).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-admin-bg-muted rounded p-2 text-xs border border-admin-border">
                      <div className="font-semibold text-admin-text mb-1 truncate">{key}</div>
                      <div className="text-admin-text-muted">
                        {(value as any[]).map((v, i) => (
                          <div key={i} className="truncate pl-2 border-l border-admin-border">
                            {v.user || 'Anonymous'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
