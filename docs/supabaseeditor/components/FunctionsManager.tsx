import React, { useEffect, useState } from 'react';
import { SupabaseCredentials, EdgeFunction } from '../types';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';

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

export const FunctionsManager: React.FC<Props> = ({ creds }) => {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [verifyJwt, setVerifyJwt] = useState(true);
  const [functionBody, setFunctionBody] = useState(TEMPLATES['hello-world']);
  
  // Interaction State
  const [processing, setProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    loadFunctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  const loadFunctions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supabaseService.listFunctions(creds);
      setFunctions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    // We provide a comment explaining this.
    setFunctionBody(`// ⚠️ EXISTING CODE CANNOT BE RETRIEVED FROM THE API.\n// Enter new code below to redeploy/overwrite '${func.slug}'.\n\n${TEMPLATES['hello-world']}`);
    setIsModalOpen(true);
  };

  const handleDelete = async (slugToDelete: string) => {
    if (!confirm(`Are you sure you want to delete function '${slugToDelete}'? This cannot be undone.`)) return;
    try {
      await supabaseService.deleteFunction(creds, slugToDelete);
      setFunctions(functions.filter(f => f.slug !== slugToDelete));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setGeneratingCode(true);
    try {
        const code = await geminiService.generateFunctionCode(aiPrompt);
        setFunctionBody(code);
    } catch (err) {
        alert("Failed to generate code");
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
      } else {
        // Update
        const updatedFunc = await supabaseService.updateFunction(creds, slug, {
            name,
            verify_jwt: verifyJwt,
            body: functionBody
        });
        setFunctions(functions.map(f => f.slug === slug ? updatedFunc : f));
      }
      setIsModalOpen(false);
    } catch (err: any) {
        alert(`Failed to ${modalMode}: ${err.message}`);
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Edge Functions</h2>
          <p className="text-supa-400 mt-1">Manage server-side logic, integrations, and webhooks.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-supa-accent text-supa-950 font-bold px-4 py-2 rounded-lg hover:bg-supa-accentDark transition-colors flex items-center gap-2"
        >
          <span>+</span> Deploy Function
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex flex-col gap-2">
          <div className="font-bold flex items-center gap-2">
             <span className="text-xl">⚠️</span> Error: {error}
          </div>
          {error.includes('CORS') && (
              <p className="text-xs text-red-300 ml-7">
                  The browser blocked the request to Supabase Management API. Ensure the Vite Proxy is active or check your network connection.
              </p>
          )}
        </div>
      )}

      {/* Function Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           [1,2,3].map(i => (
             <div key={i} className="h-40 bg-supa-800 rounded-xl animate-pulse"></div>
           ))
        ) : functions.length === 0 ? (
          <div className="col-span-full text-center py-20 text-supa-500 border-2 border-dashed border-supa-800 rounded-xl">
            {error ? 'Unable to load functions.' : 'No functions deployed yet.'}
          </div>
        ) : (
          functions.map(func => (
            <div key={func.id} className="bg-supa-950 border border-supa-800 rounded-xl p-5 hover:border-supa-600 transition-all group relative overflow-hidden flex flex-col justify-between h-48">
              <div>
                <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-supa-800 rounded-lg">
                        <span className="text-xl">⚡</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${func.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {func.status}
                    </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 truncate">{func.name}</h3>
                <p className="text-supa-500 text-xs font-mono mb-4">{func.slug}</p>
              </div>
              
              <div className="border-t border-supa-800 pt-4 flex items-center justify-between">
                 <div className="text-xs flex gap-2">
                    {func.verify_jwt ? (
                        <span className="text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded">JWT</span>
                    ) : (
                        <span className="text-orange-400 bg-orange-900/20 px-1.5 py-0.5 rounded">Public</span>
                    )}
                    <span className="text-supa-500">v{func.version}</span>
                 </div>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleOpenEdit(func)}
                        className="text-supa-300 hover:text-white text-xs bg-supa-800 hover:bg-supa-700 px-2 py-1 rounded transition-colors"
                     >
                        Manage
                     </button>
                     <button 
                        onClick={() => handleDelete(func.slug)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition-colors text-xs"
                     >
                        Delete
                     </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Deploy/Manage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-supa-900 border border-supa-700 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-supa-800 flex justify-between items-center bg-supa-950 rounded-t-xl">
                    <h3 className="text-xl font-bold text-white">
                        {modalMode === 'create' ? 'Deploy New Function' : 'Manage Function'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-supa-400 hover:text-white">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="functionForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider mb-1">Function Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-supa-950 border border-supa-700 rounded px-3 py-2 text-white focus:border-supa-accent focus:outline-none font-mono text-sm"
                                    placeholder="process-payment"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider mb-1">Slug (URL Path)</label>
                                <input 
                                    type="text" 
                                    required
                                    disabled={modalMode === 'edit'}
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full bg-supa-950 border border-supa-700 rounded px-3 py-2 text-white focus:border-supa-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                                    placeholder="process-payment"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                id="verifyJwt"
                                checked={verifyJwt}
                                onChange={(e) => setVerifyJwt(e.target.checked)}
                                className="rounded bg-supa-950 border-supa-700 text-supa-accent focus:ring-offset-supa-900"
                             />
                             <label htmlFor="verifyJwt" className="text-sm text-supa-200">Enforce JWT Verification (Secure)</label>
                        </div>

                        {/* Editor Section */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider">Function Code (TypeScript/Deno)</label>
                            
                            {/* AI Bar */}
                            <div className="flex gap-2 mb-2">
                                <div className="flex-1 relative">
                                    <input 
                                        type="text" 
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Ask AI to write code (e.g. 'Create a function that calls OpenAI with a user prompt')"
                                        className="w-full bg-supa-800 border border-supa-700 rounded px-3 py-2 text-sm text-white focus:border-supa-accent focus:outline-none pl-8"
                                    />
                                    <span className="absolute left-2.5 top-2 text-supa-accent">✨</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleGenerateCode}
                                    disabled={generatingCode || !aiPrompt.trim()}
                                    className="bg-supa-700 hover:bg-supa-600 text-supa-200 px-4 py-2 rounded text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {generatingCode ? 'Writing...' : 'Generate'}
                                </button>
                                <select 
                                    onChange={(e) => setFunctionBody(TEMPLATES[e.target.value as keyof typeof TEMPLATES])}
                                    className="bg-supa-800 border border-supa-700 text-supa-300 text-xs rounded px-2 focus:outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Templates</option>
                                    <option value="hello-world">Hello World</option>
                                    <option value="openai">OpenAI Wrapper</option>
                                    <option value="stripe-webhook">Stripe Webhook</option>
                                </select>
                            </div>

                            <div className="relative border border-supa-700 rounded-lg overflow-hidden h-64 bg-[#1e1e1e]">
                                <textarea 
                                    value={functionBody}
                                    onChange={(e) => setFunctionBody(e.target.value)}
                                    className="w-full h-full bg-transparent p-4 font-mono text-sm text-blue-100 focus:outline-none resize-none leading-relaxed"
                                    spellCheck={false}
                                />
                            </div>
                            <p className="text-[10px] text-supa-500">
                                Powered by Deno. Supports standard Web APIs (fetch, Request, Response).
                            </p>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-supa-800 bg-supa-950 rounded-b-xl flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-supa-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        form="functionForm"
                        disabled={processing}
                        className="px-6 py-2 bg-supa-accent text-supa-950 font-bold rounded hover:bg-supa-accentDark disabled:opacity-50 flex items-center gap-2"
                    >
                        {processing ? (
                            <>
                                <span className="animate-spin text-supa-950">⟳</span>
                                <span>Deploying...</span>
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>{modalMode === 'create' ? 'Deploy Function' : 'Redeploy / Update'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};