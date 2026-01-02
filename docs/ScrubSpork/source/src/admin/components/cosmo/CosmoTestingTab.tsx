import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Textarea, Badge, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Zap, Wand2, MessageSquare, FlaskConical, Play, CheckCircle2, Brain, ArrowRight } from 'lucide-react';

interface RoutingTestResult { category: string; model: string; costTier: string; }
interface EnhanceTestResult { original: string; enhanced: string; model: string; }

export function CosmoTestingTab() {
  const [routingPrompt, setRoutingPrompt] = useState('');
  const [isTestingRouting, setIsTestingRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<RoutingTestResult | null>(null);

  const [enhancePrompt, setEnhancePrompt] = useState('');
  const [isTestingEnhance, setIsTestingEnhance] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<EnhanceTestResult | null>(null);

  const [chatPrompt, setChatPrompt] = useState('');
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [chatMetadata, setChatMetadata] = useState<any>(null);

  const testRouting = async () => {
    if (!routingPrompt.trim()) { toast.error('Please enter a prompt to test'); return; }
    setIsTestingRouting(true);
    setRoutingResult(null);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: routingPrompt }], model: 'auto', stream: false }),
      });
      const { data: logs } = await supabase.from('cosmo_debug_logs').select('detected_intent, selected_model, intent_patterns').order('created_at', { ascending: false }).limit(1).single();
      if (logs) {
        const costTier = logs.intent_patterns?.find((p: string) => p?.includes('cost_tier:'))?.split(':')[1] || 'balanced';
        setRoutingResult({ category: logs.detected_intent || 'conversation', model: logs.selected_model || 'unknown', costTier });
        toast.success('Routing test completed');
      }
    } catch (error: any) { toast.error('Routing test failed', { description: error.message }); }
    finally { setIsTestingRouting(false); }
  };

  const testEnhancement = async () => {
    if (!enhancePrompt.trim()) { toast.error('Please enter a prompt to enhance'); return; }
    setIsTestingEnhance(true);
    setEnhanceResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-prompt', { body: { prompt: enhancePrompt } });
      if (error) throw error;
      setEnhanceResult({ original: enhancePrompt, enhanced: data.enhancedPrompt || 'No enhancement returned', model: data.model || 'unknown' });
      toast.success('Enhancement test completed');
    } catch (error: any) { toast.error('Enhancement test failed', { description: error.message }); }
    finally { setIsTestingEnhance(false); }
  };

  const testFullChat = async () => {
    if (!chatPrompt.trim()) { toast.error('Please enter a message'); return; }
    setIsTestingChat(true);
    setChatResponse('');
    setChatMetadata(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: chatPrompt }], model: 'auto', stream: true }),
      });
      if (!response.ok) throw new Error('Chat request failed');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'metadata') { setChatMetadata(parsed.data); }
              else if (parsed.choices?.[0]?.delta?.content) { fullResponse += parsed.choices[0].delta.content; setChatResponse(fullResponse); }
            } catch {}
          }
        }
      }
      toast.success('Chat test completed');
    } catch (error: any) { toast.error('Chat test failed', { description: error.message }); }
    finally { setIsTestingChat(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center"><FlaskConical className="h-5 w-5 text-primary" /></div>
            <div><CardTitle>COSMO Testing Sandbox</CardTitle><CardDescription>Test routing, enhancement, and full chat flow</CardDescription></div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="routing" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="routing" className="gap-2"><Zap className="h-4 w-4" />Test Routing</TabsTrigger>
          <TabsTrigger value="enhance" className="gap-2"><Wand2 className="h-4 w-4" />Test Enhancement</TabsTrigger>
          <TabsTrigger value="chat" className="gap-2"><MessageSquare className="h-4 w-4" />Full Chat Test</TabsTrigger>
        </TabsList>

        <TabsContent value="routing">
          <Card>
            <CardHeader><CardTitle className="text-base">Model Routing Test</CardTitle><CardDescription>Test which model COSMO would select</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Test Prompt</Label><Textarea value={routingPrompt} onChange={(e) => setRoutingPrompt(e.target.value)} placeholder="Enter a prompt to test routing..." rows={3} /></div>
              <Button onClick={testRouting} disabled={isTestingRouting} className="gap-2">{isTestingRouting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Test Routing</Button>
              {routingResult && (
                <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" />Routing Result</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Category</Label><Badge variant="secondary" className="mt-1 capitalize">{routingResult.category}</Badge></div>
                    <div><Label className="text-xs text-muted-foreground">Selected Model</Label><p className="text-sm font-mono mt-1">{routingResult.model.split('/').pop()}</p></div>
                    <div><Label className="text-xs text-muted-foreground">Cost Tier</Label><Badge variant="outline" className={`mt-1 capitalize ${routingResult.costTier === 'low' ? 'text-green-600' : routingResult.costTier === 'balanced' ? 'text-yellow-600' : 'text-purple-600'}`}>{routingResult.costTier}</Badge></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhance">
          <Card>
            <CardHeader><CardTitle className="text-base">Prompt Enhancement Test</CardTitle><CardDescription>Test how COSMO enhances prompts</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Original Prompt</Label><Textarea value={enhancePrompt} onChange={(e) => setEnhancePrompt(e.target.value)} placeholder="Enter a simple prompt to enhance..." rows={3} /></div>
              <Button onClick={testEnhancement} disabled={isTestingEnhance} className="gap-2">{isTestingEnhance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}Enhance Prompt</Button>
              {enhanceResult && (
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg"><Label className="text-xs text-muted-foreground">Original</Label><p className="text-sm mt-2">{enhanceResult.original}</p></div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg"><Label className="text-xs text-primary">Enhanced</Label><p className="text-sm mt-2">{enhanceResult.enhanced}</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground">Model used: {enhanceResult.model}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader><CardTitle className="text-base">Full Chat Test</CardTitle><CardDescription>Test the complete COSMO chat flow with streaming</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Message</Label><Textarea value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)} placeholder="Enter a message to test the full chat flow..." rows={3} /></div>
              <Button onClick={testFullChat} disabled={isTestingChat} className="gap-2">{isTestingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}Send Test Message</Button>
              {(chatResponse || chatMetadata) && (
                <div className="mt-6 space-y-4">
                  {chatMetadata && (
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /><span className="text-sm font-medium">COSMO</span><ArrowRight className="h-3 w-3 text-muted-foreground" /></div>
                      <Badge variant="secondary" className="capitalize">{chatMetadata.category || 'conversation'}</Badge>
                      <span className="text-sm text-muted-foreground">{chatMetadata.model?.split('/').pop() || 'unknown'}</span>
                      {chatMetadata.tokens && <Badge variant="outline" className="text-xs">{chatMetadata.tokens} tokens</Badge>}
                    </div>
                  )}
                  <div className="p-4 bg-background border rounded-lg">
                    <Label className="text-xs text-muted-foreground mb-2 block">Response</Label>
                    <div className="prose prose-sm max-w-none">{chatResponse || <span className="text-muted-foreground">Waiting for response...</span>}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
