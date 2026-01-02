import React, { useEffect, useState } from 'react';
import { SupabaseCredentials, EdgeFunction } from './types';
import { supabaseService } from './services/supabaseService';
import { aiService } from './services/aiService';
import { usePublicModels } from '@/hooks/usePublicModels';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Textarea } from '@/admin/ui/textarea';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/admin/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/admin/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Loader2, Zap, Trash2, Edit, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  creds: SupabaseCredentials;
}

const TEMPLATES = {
  'hello-world': `Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: "Hello from Antigravity Bridge!" }),
    { headers: { "Content-Type": "application/json" } },
  )
})`,
  'openai': `import OpenAI from 'https://deno.land/x/openai@v4.24.0/mod.ts'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

Deno.serve(async (req) => {
  const { prompt } = await req.json()
  
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  })

  return new Response(
    JSON.stringify(completion.choices[0]),
    { headers: { "Content-Type": "application/json" } },
  )
})`,
  'stripe-webhook': `import { Stripe } from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      secret!,
      undefined,
      cryptoProvider
    )
    
    // Handle the event
    console.log(event.type)
    
    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }
})`
};

export const SupabaseFunctionsTab: React.FC<Props> = ({ creds }) => {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  
  // Form State
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [verifyJwt, setVerifyJwt] = useState(true);
  const [functionBody, setFunctionBody] = useState(TEMPLATES['hello-world'] || '');
  
  // Interaction State
  const [processing, setProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');
  
  // Safely get models - handle potential errors
  let activeModels: any[] = [];
  let modelsLoading = false;
  try {
    const modelsData = usePublicModels();
    activeModels = modelsData?.activeModels || [];
    modelsLoading = modelsData?.isLoading || false;
  } catch (err) {
    console.warn('Could not load models:', err);
    activeModels = [];
    modelsLoading = false;
  }

  const loadFunctions = async () => {
    if (!creds) return;
    try {
      setLoading(true);
      setError(null);
      const data = await supabaseService.listFunctions(creds);
      setFunctions(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to load functions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  // Set default model when models load
  useEffect(() => {
    if (!modelsLoading && activeModels.length > 0 && !selectedModel) {
      // Prefer coding models
      const codingModel = activeModels.find(m => 
        m.best_for === 'coding' || m.model_id.includes('gpt-4') || m.model_id.includes('claude')
      );
      setSelectedModel(codingModel?.model_id || activeModels[0].model_id);
    }
  }, [activeModels, modelsLoading, selectedModel]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSlug('');
    setName('');
    setVerifyJwt(true);
    setFunctionBody(TEMPLATES['hello-world']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (func: EdgeFunction) => {
    setModalMode('edit');
    setSlug(func.slug);
    setName(func.name);
    setVerifyJwt(func.verify_jwt);
    // Note: We cannot retrieve the source code of an existing function via the API.
    setFunctionBody(`// ⚠️ EXISTING CODE CANNOT BE RETRIEVED FROM THE API.\n// Enter new code below to redeploy/overwrite '${func.slug}'.\n\n${TEMPLATES['hello-world']}`);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;
    try {
      await supabaseService.deleteFunction(creds, deleteSlug);
      setFunctions(functions.filter(f => f.slug !== deleteSlug));
      toast.success('Function deleted successfully');
      setDeleteSlug(null);
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || !selectedModel) {
      toast.error('Please enter a prompt and select a model');
      return;
    }
    setGeneratingCode(true);
    try {
      // Use AI service to generate code
      const prompt = `Write a Supabase Edge Function (Deno/TypeScript) for: ${aiPrompt}. Return ONLY raw code, no markdown, no explanations.`;
      const code = await aiService.askAssistant(prompt, creds, selectedModel);
      // Clean up the response (remove markdown code blocks if present)
      let cleanedCode = code.trim();
      cleanedCode = cleanedCode.replace(/^```typescript\n?/, '').replace(/^```ts\n?/, '').replace(/```$/, '').trim();
      setFunctionBody(cleanedCode);
      setAiPrompt('');
      toast.success('Code generated successfully');
    } catch (err: any) {
      toast.error(`Failed to generate code: ${err.message}`);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (modalMode === 'create') {
        const newFunc = await supabaseService.createFunction(creds, {
            name,
            slug,
            verify_jwt: verifyJwt,
            body: functionBody
        });
        setFunctions([...functions, newFunc]);
        toast.success('Function deployed successfully');
      } else {
        const updatedFunc = await supabaseService.updateFunction(creds, slug, {
            name,
            verify_jwt: verifyJwt,
            body: functionBody
        });
        setFunctions(functions.map(f => f.slug === slug ? updatedFunc : f));
        toast.success('Function updated successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(`Failed to ${modalMode}: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (!creds) {
    return (
      <div className="space-y-4">
        <p className="text-admin-text-muted">Please configure credentials in Settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">Edge Functions</h2>
          <p className="text-sm text-admin-text-muted mt-1">Manage server-side logic, integrations, and webhooks</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Deploy Function
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-600">Error: {error}</p>
                {error.includes('CORS') && (
                  <p className="text-xs text-red-500 mt-1">
                    The browser blocked the request to Supabase Management API. Ensure the Vite Proxy is active or check your network connection.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Function Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-48">
              <CardContent className="pt-6">
                <div className="h-full bg-admin-bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : functions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-admin-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-admin-text-muted">
                {error ? 'Unable to load functions.' : 'No functions deployed yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {functions.map(func => (
            <Card key={func.id} className="hover:border-admin-accent transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-admin-accent-muted rounded-lg">
                    <Zap className="h-5 w-5 text-admin-accent" />
                  </div>
                  <Badge variant={func.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {func.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg truncate">{func.name}</CardTitle>
                <p className="text-xs text-admin-text-muted font-mono mt-1">{func.slug}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between pt-4 border-t border-admin-border">
                  <div className="flex gap-2 text-xs">
                    {func.verify_jwt ? (
                      <Badge variant="outline" className="text-xs">JWT</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Public</Badge>
                    )}
                    <span className="text-admin-text-muted">v{func.version}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(func)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteSlug(func.slug)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deploy/Manage Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Deploy New Function' : 'Manage Function'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create' 
                ? 'Create a new Supabase Edge Function using Deno/TypeScript'
                : 'Update or redeploy an existing function. Note: Existing code cannot be retrieved.'}
            </DialogDescription>
          </DialogHeader>

          <form id="functionForm" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Function Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="process-payment"
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL Path)</Label>
                <Input
                  id="slug"
                  required
                  disabled={modalMode === 'edit'}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="process-payment"
                  className="font-mono"
                />
                {modalMode === 'edit' && (
                  <p className="text-xs text-admin-text-muted mt-1">Slug cannot be changed</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="verifyJwt"
                checked={verifyJwt}
                onCheckedChange={setVerifyJwt}
              />
              <Label htmlFor="verifyJwt" className="cursor-pointer">
                Enforce JWT Verification (Secure)
              </Label>
            </div>

            {/* Editor Section */}
            <div className="space-y-2">
              <Label>Function Code (TypeScript/Deno)</Label>
              
              {/* AI Bar */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Sparkles className="absolute left-2.5 top-2.5 h-4 w-4 text-admin-accent" />
                  <Input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask AI to write code (e.g. 'Create a function that calls OpenAI')"
                    className="pl-8"
                  />
                </div>
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
                  type="button"
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={generatingCode || !aiPrompt.trim() || !selectedModel}
                >
                  {generatingCode ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
                <Select
                  onValueChange={(value) => setFunctionBody(TEMPLATES[value as keyof typeof TEMPLATES])}
                  defaultValue=""
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Templates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hello-world">Hello World</SelectItem>
                    <SelectItem value="openai">OpenAI Wrapper</SelectItem>
                    <SelectItem value="stripe-webhook">Stripe Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                value={functionBody}
                onChange={(e) => setFunctionBody(e.target.value)}
                className="font-mono text-sm min-h-[300px]"
                spellCheck={false}
                placeholder="Enter your Deno/TypeScript code here..."
              />
              <p className="text-xs text-admin-text-muted">
                Powered by Deno. Supports standard Web APIs (fetch, Request, Response).
              </p>
            </div>
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="functionForm"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {modalMode === 'create' ? 'Deploy Function' : 'Redeploy / Update'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSlug} onOpenChange={(open) => !open && setDeleteSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Function</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete function '{deleteSlug}'? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
