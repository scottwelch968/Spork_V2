import React, { useState, useEffect, useRef } from 'react';
import { SupabaseCredentials } from './types';
import { usePublicModels } from '@/hooks/usePublicModels';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Label } from '@/admin/ui/label';
import { aiService } from './services/aiService';

interface Props {
  creds: SupabaseCredentials | null;
}

export const SupabaseAITab: React.FC<Props> = ({ creds }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello. I am the Antigravity Bridge Assistant. I am connected to your project's live data. I can list users, check status, or query the database for you. How can I help?" }
  ]);
  const [thinking, setThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Get models - use defaults to prevent crashes
  const modelsResult = usePublicModels();
  const activeModels = Array.isArray(modelsResult?.activeModels) ? modelsResult.activeModels : [];
  const modelsLoading = modelsResult?.isLoading ?? false;

  // Set default model when models load
  useEffect(() => {
    if (!modelsLoading && Array.isArray(activeModels) && activeModels.length > 0 && !selectedModel) {
      // Prefer models that support function calling (OpenAI models)
      const functionCallingModel = activeModels.find(m => 
        m?.model_id?.includes('gpt-4') || m?.model_id?.includes('gpt-3.5') || m?.model_id?.includes('o1')
      );
      setSelectedModel(functionCallingModel?.model_id || activeModels[0]?.model_id || '');
    }
  }, [activeModels, modelsLoading, selectedModel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel) return;

    if (!creds) {
        setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: "Please configure your credentials in the Settings tab first." }]);
        setInput('');
        return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setThinking(true);

    try {
      const response = await aiService.askAssistant(userMsg, creds, selectedModel);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Failed to get response'}` }]);
    } finally {
      setThinking(false);
    }
  };

  const selectedModelName = Array.isArray(activeModels) ? activeModels.find(m => m.model_id === selectedModel)?.name || selectedModel : selectedModel;

  return (
    <div className="space-y-4">
      <Card className="bg-admin-bg-elevated border-admin-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${creds ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <CardTitle>Bridge Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="model-select" className="text-xs text-admin-text-muted">Model:</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={modelsLoading}>
                <SelectTrigger id="model-select" className="w-[200px]">
                  <SelectValue placeholder={modelsLoading ? "Loading models..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(activeModels) && activeModels.length > 0 ? (
                    activeModels.map((model) => (
                      <SelectItem key={model.model_id} value={model.model_id}>
                        {model.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No models available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-admin-text-muted mt-2">
            Agentic Mode: {creds ? 'Active' : 'Offline'} | Using: {selectedModelName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col h-[500px] border border-admin-border rounded-lg overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-admin-bg">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    m.role === 'user' 
                      ? 'bg-admin-accent text-admin-accent-foreground' 
                      : 'bg-admin-bg-elevated border border-admin-border text-admin-text'
                  }`}>
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="bg-admin-bg-elevated border border-admin-border p-3 rounded-lg flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-admin-accent rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-admin-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1.5 h-1.5 bg-admin-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="text-xs text-admin-text-muted ml-2">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef}></div>
            </div>

            <div className="p-4 bg-admin-bg-muted border-t border-admin-border">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={creds ? "e.g., List my edge functions and tell me which are active" : "Connect in settings to enable tools"}
                  disabled={!creds || !selectedModel}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={thinking || !creds || !selectedModel}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

