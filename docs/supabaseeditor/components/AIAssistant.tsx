import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { SupabaseCredentials } from '../types';

interface Props {
  creds: SupabaseCredentials | null;
}

export const AIAssistant: React.FC<Props> = ({ creds }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello. I am the Antigravity Bridge Assistant. I am connected to your project's live data. I can list users, check status, or query the database for you. How can I help?" }
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!creds) {
        setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: "Please configure your credentials in the Settings tab first." }]);
        setInput('');
        return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setThinking(true);

    const response = await geminiService.askAssistant(userMsg, creds);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setThinking(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-supa-950 border border-supa-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
       <div className="p-4 border-b border-supa-800 bg-supa-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${creds ? 'bg-supa-accent' : 'bg-red-500'} animate-pulse`}></div>
                <h3 className="font-bold text-white">Bridge Assistant</h3>
            </div>
            <span className="text-xs text-supa-500 font-mono">Agentic Mode: {creds ? 'Active' : 'Offline'}</span>
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-4 text-sm leading-relaxed ${
                    m.role === 'user' 
                    ? 'bg-supa-700 text-white rounded-br-none' 
                    : 'bg-supa-900 text-supa-100 border border-supa-800 rounded-bl-none shadow-lg'
                }`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                </div>
             </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
                <div className="bg-supa-900 border border-supa-800 p-4 rounded-xl rounded-bl-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-supa-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-supa-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-supa-400 rounded-full animate-bounce delay-200"></span>
                    <span className="text-xs text-supa-500 ml-2">Accessing Supabase API...</span>
                </div>
            </div>
          )}
          <div ref={bottomRef}></div>
       </div>

       <div className="p-4 bg-supa-900 border-t border-supa-800">
          <form onSubmit={handleSend} className="flex gap-2">
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={creds ? "e.g., List my edge functions and tell me which are active" : "Connect in settings to enable tools"}
                disabled={!creds}
                className="flex-1 bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent disabled:opacity-50"
             />
             <button 
                type="submit"
                disabled={thinking || !creds}
                className="bg-supa-accent text-supa-950 font-bold px-6 py-2 rounded-lg hover:bg-supa-accentDark disabled:opacity-50 transition-colors"
             >
                Send
             </button>
          </form>
       </div>
    </div>
  );
};