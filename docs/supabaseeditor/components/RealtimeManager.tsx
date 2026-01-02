import React, { useState, useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseCredentials } from '../types';
import { geminiService } from '../services/geminiService';

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

export const RealtimeManager: React.FC<Props> = ({ creds }) => {
  // Connection State
  const [client, setClient] = useState<any>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Config State
  const [channelName, setChannelName] = useState('room-1');
  const [enablePostgres, setEnablePostgres] = useState(false);
  const [pgTable, setPgTable] = useState('*');
  const [pgEvent, setPgEvent] = useState('*'); // INSERT, UPDATE, DELETE, *
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

  const logsEndRef = useRef<HTMLDivElement>(null);

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
        alert("Service Role Key required for full Realtime access.");
        return;
    }

    // Initialize Client
    const supabase = createClient(`https://${creds.projectRef}.supabase.co`, creds.serviceRoleKey);
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
      }
  };

  const handleSendBroadcast = async () => {
      if (!channel || !isConnected) return;
      try {
          const payload = JSON.parse(broadcastPayload);
          await channel.send({
              type: 'broadcast',
              event: broadcastEvent,
              payload: payload
          });
          addLog('system', `Sent Broadcast '${broadcastEvent}'`);
      } catch (e) {
          alert("Invalid JSON payload");
      }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiPrompt.trim()) return;
      setGenerating(true);
      try {
          const code = await geminiService.generateRealtimeCode(aiPrompt);
          setGeneratedCode(code);
      } catch (err) {
          alert("Failed to generate code");
      } finally {
          setGenerating(false);
      }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-3xl font-bold text-white tracking-tight">Real-time Inspector</h2>
                 <p className="text-supa-400 mt-1">Debug Broadcasts, Presence, and Database changes.</p>
             </div>
             <button 
                onClick={() => setShowAiCode(!showAiCode)}
                className="bg-supa-800 border border-supa-600 text-supa-200 hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
             >
                 <span>🤖</span> {showAiCode ? 'Hide Code Gen' : 'Generate Client Code'}
             </button>
        </div>

        {/* AI Code Generator Overlay */}
        {showAiCode && (
             <div className="bg-supa-900 border border-supa-700 rounded-xl p-6 shadow-xl animate-in slide-in-from-top-4">
                 <h3 className="text-lg font-bold text-white mb-2">AI Code Generator</h3>
                 <form onSubmit={handleGenerateCode} className="flex gap-2 mb-4">
                     <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe what you want to listen for (e.g. 'Update user count when new users join')"
                        className="flex-1 bg-supa-950 border border-supa-700 rounded px-4 py-2 text-white focus:outline-none focus:border-supa-accent"
                     />
                     <button 
                        type="submit"
                        disabled={generating || !aiPrompt.trim()}
                        className="bg-supa-accent text-supa-950 font-bold px-6 py-2 rounded hover:bg-supa-accentDark disabled:opacity-50"
                     >
                        {generating ? 'Generating...' : 'Generate Code'}
                     </button>
                 </form>
                 {generatedCode && (
                     <div className="relative bg-black rounded-lg p-4 border border-supa-800">
                         <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{generatedCode}</pre>
                     </div>
                 )}
             </div>
        )}

        <div className="flex flex-1 gap-6 min-h-0">
            {/* Left: Configuration */}
            <div className="w-80 flex flex-col gap-4 overflow-y-auto">
                {/* Connection Config */}
                <div className="bg-supa-950 border border-supa-800 rounded-xl p-5">
                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Connection</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-supa-400 mb-1">Channel Name</label>
                            <input 
                                type="text" 
                                value={channelName}
                                disabled={isConnected}
                                onChange={(e) => setChannelName(e.target.value)}
                                className="w-full bg-supa-900 border border-supa-700 rounded px-3 py-2 text-white text-sm focus:border-supa-accent outline-none disabled:opacity-50"
                            />
                        </div>
                        
                        {!isConnected ? (
                            <button 
                                onClick={handleConnect}
                                className="w-full bg-supa-accent hover:bg-supa-accentDark text-supa-950 font-bold py-2 rounded transition-colors"
                            >
                                Connect
                            </button>
                        ) : (
                            <button 
                                onClick={handleDisconnect}
                                className="w-full bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-900 font-bold py-2 rounded transition-colors"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>
                </div>

                {/* Subscriptions Config */}
                <div className="bg-supa-950 border border-supa-800 rounded-xl p-5 flex-1">
                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Subscriptions</h3>
                    <div className="space-y-6">
                        {/* Postgres Changes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-supa-200">Postgres Changes</label>
                                <input 
                                    type="checkbox" 
                                    checked={enablePostgres} 
                                    disabled={isConnected}
                                    onChange={(e) => setEnablePostgres(e.target.checked)}
                                    className="rounded bg-supa-900 border-supa-700 text-supa-accent"
                                />
                            </div>
                            {enablePostgres && (
                                <div className="pl-2 border-l-2 border-supa-800 space-y-2 pt-1">
                                    <div>
                                        <label className="block text-xs text-supa-500">Event</label>
                                        <select 
                                            value={pgEvent} 
                                            disabled={isConnected}
                                            onChange={(e) => setPgEvent(e.target.value)}
                                            className="w-full bg-supa-900 text-xs text-white p-1 rounded border border-supa-700"
                                        >
                                            <option value="*">ALL (Insert/Update/Delete)</option>
                                            <option value="INSERT">INSERT</option>
                                            <option value="UPDATE">UPDATE</option>
                                            <option value="DELETE">DELETE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-supa-500">Table</label>
                                        <input 
                                            type="text" 
                                            value={pgTable} 
                                            disabled={isConnected}
                                            onChange={(e) => setPgTable(e.target.value)}
                                            placeholder="* or table_name"
                                            className="w-full bg-supa-900 text-xs text-white p-1 rounded border border-supa-700"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Broadcast */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-supa-200">Broadcast</label>
                            <input 
                                type="checkbox" 
                                checked={enableBroadcast} 
                                disabled={isConnected}
                                onChange={(e) => setEnableBroadcast(e.target.checked)}
                                className="rounded bg-supa-900 border-supa-700 text-supa-accent"
                            />
                        </div>

                        {/* Presence */}
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-supa-200">Presence</label>
                            <input 
                                type="checkbox" 
                                checked={enablePresence} 
                                disabled={isConnected}
                                onChange={(e) => setEnablePresence(e.target.checked)}
                                className="rounded bg-supa-900 border-supa-700 text-supa-accent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle: Event Log */}
            <div className="flex-1 bg-[#0d1117] border border-supa-800 rounded-xl flex flex-col overflow-hidden font-mono text-sm shadow-2xl">
                <div className="bg-supa-950 border-b border-supa-800 p-2 px-4 flex justify-between items-center">
                    <span className="font-bold text-supa-400 text-xs uppercase">Live Logs</span>
                    <button onClick={() => setLogs([])} className="text-xs text-supa-500 hover:text-white">Clear</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                    {logs.length === 0 && (
                        <div className="text-supa-600 italic text-center mt-10">Waiting for events...</div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-supa-600 text-[10px]">{log.time}</span>
                                <span className={`text-xs font-bold px-1.5 rounded ${
                                    log.type === 'system' ? 'bg-gray-800 text-gray-300' :
                                    log.type === 'postgres' ? 'bg-blue-900/30 text-blue-400' :
                                    log.type === 'broadcast' ? 'bg-purple-900/30 text-purple-400' :
                                    'bg-green-900/30 text-green-400'
                                }`}>
                                    {log.type.toUpperCase()}
                                </span>
                                <span className="text-supa-200">{log.message}</span>
                            </div>
                            {log.payload && (
                                <pre className="text-[10px] text-supa-500 bg-black/30 p-2 rounded ml-14 overflow-x-auto border-l-2 border-supa-800">
                                    {JSON.stringify(log.payload, null, 2)}
                                </pre>
                            )}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Right: Tools (Broadcast Sender & Presence List) */}
            <div className="w-80 flex flex-col gap-4 overflow-y-auto">
                {/* Broadcast Sender */}
                <div className="bg-supa-950 border border-supa-800 rounded-xl p-5">
                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Send Broadcast</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-supa-400 mb-1">Event Name</label>
                            <input 
                                type="text" 
                                value={broadcastEvent}
                                disabled={!isConnected || !enableBroadcast}
                                onChange={(e) => setBroadcastEvent(e.target.value)}
                                className="w-full bg-supa-900 border border-supa-700 rounded px-2 py-1.5 text-white text-xs focus:border-supa-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-supa-400 mb-1">Payload (JSON)</label>
                            <textarea 
                                value={broadcastPayload}
                                disabled={!isConnected || !enableBroadcast}
                                onChange={(e) => setBroadcastPayload(e.target.value)}
                                className="w-full h-24 bg-supa-900 border border-supa-700 rounded px-2 py-1.5 text-white text-xs font-mono focus:border-supa-accent outline-none resize-none"
                            />
                        </div>
                        <button 
                            onClick={handleSendBroadcast}
                            disabled={!isConnected || !enableBroadcast}
                            className="w-full bg-supa-800 hover:bg-supa-700 text-white font-bold py-2 rounded text-xs transition-colors disabled:opacity-50"
                        >
                            Send Message
                        </button>
                    </div>
                </div>

                {/* Presence List */}
                <div className="bg-supa-950 border border-supa-800 rounded-xl p-5 flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Presence State</h3>
                        <span className="text-xs text-supa-500 bg-supa-900 px-2 py-0.5 rounded-full">
                            {Object.keys(presenceState).length} Users
                        </span>
                    </div>
                    
                    {!isConnected || !enablePresence ? (
                        <div className="text-xs text-supa-600 italic">Presence disabled or disconnected.</div>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(presenceState).map(([key, value]: [string, any]) => (
                                <div key={key} className="bg-supa-900 rounded p-2 text-xs border border-supa-800">
                                    <div className="font-bold text-green-400 mb-1 truncate">{key}</div>
                                    <div className="text-supa-400">
                                        {(value as any[]).map((v, i) => (
                                            <div key={i} className="truncate pl-2 border-l border-supa-700">
                                                {v.user || 'Anonymous'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};