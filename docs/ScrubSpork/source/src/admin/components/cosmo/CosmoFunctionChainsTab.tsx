import { useState } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea, ScrollArea } from '@/admin/ui';
import { Plus, Search, Pencil, Trash2, Loader2, Link2, ArrowRight, GripVertical, X } from 'lucide-react';
import { useCosmoAdmin, CosmoFunctionChain, CosmoFunctionChainInput } from '@/hooks/useCosmoAdmin';

interface FunctionSequenceItem {
  function_key: string;
  required: boolean;
  wait_for_result: boolean;
  on_error: 'fail' | 'continue' | 'retry';
}

export function CosmoFunctionChainsTab() {
  const { functionChains, chainsLoading, chatFunctions, intents, createChain, updateChain, deleteChain, toggleChain, isCreatingChain, isUpdatingChain, isDeletingChain } = useCosmoAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<CosmoFunctionChain | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewChain, setPreviewChain] = useState<CosmoFunctionChain | null>(null);

  const [formData, setFormData] = useState<CosmoFunctionChainInput>({
    chain_key: '',
    display_name: '',
    description: '',
    trigger_intents: [],
    function_sequence: [],
    fallback_chain_id: null,
    is_active: true,
  });
  const [sequence, setSequence] = useState<FunctionSequenceItem[]>([]);

  const filteredChains = functionChains.filter(chain => 
    chain.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chain.chain_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingChain(null);
    setFormData({ chain_key: '', display_name: '', description: '', trigger_intents: [], function_sequence: [], fallback_chain_id: null, is_active: true });
    setSequence([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (chain: CosmoFunctionChain) => {
    setEditingChain(chain);
    const seq = Array.isArray(chain.function_sequence) ? (chain.function_sequence as unknown as FunctionSequenceItem[]) : [];
    setFormData({ chain_key: chain.chain_key, display_name: chain.display_name, description: chain.description || '', trigger_intents: chain.trigger_intents || [], function_sequence: chain.function_sequence, fallback_chain_id: chain.fallback_chain_id, is_active: chain.is_active ?? true });
    setSequence(seq);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = { ...formData, function_sequence: sequence as unknown as Json };
    if (editingChain) { updateChain({ id: editingChain.id, ...data }); } else { createChain(data); }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => { deleteChain(id); setDeleteConfirmId(null); };

  const addFunctionToSequence = (functionKey: string) => {
    if (!sequence.find(s => s.function_key === functionKey)) {
      setSequence(prev => [...prev, { function_key: functionKey, required: true, wait_for_result: true, on_error: 'fail' as const }]);
    }
  };

  const removeFunctionFromSequence = (index: number) => { setSequence(prev => prev.filter((_, i) => i !== index)); };

  const toggleIntent = (intentKey: string) => {
    setFormData(prev => {
      const intents = prev.trigger_intents || [];
      if (intents.includes(intentKey)) { return { ...prev, trigger_intents: intents.filter(i => i !== intentKey) }; }
      return { ...prev, trigger_intents: [...intents, intentKey] };
    });
  };

  if (chainsLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Functions</CardTitle>
          <CardDescription>Functions that can be used in chains ({chatFunctions.length} available)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {chatFunctions.slice(0, 12).map(fn => (
              <Badge key={fn.id} variant={fn.is_enabled ? 'secondary' : 'outline'} className="cursor-default">
                {fn.name}{fn.is_core && <span className="ml-1 text-xs opacity-50">(core)</span>}
              </Badge>
            ))}
            {chatFunctions.length > 12 && <Badge variant="outline">+{chatFunctions.length - 12} more</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Function Chains</CardTitle><CardDescription>Define sequences of functions to execute for specific intents</CardDescription></div>
            <Button onClick={openCreateDialog} className="gap-2"><Plus className="h-4 w-4" />Add Chain</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search chains..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Active</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Trigger Intents</TableHead>
                  <TableHead>Functions</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChains.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{searchTerm ? 'No chains match your search' : 'No function chains configured yet'}</TableCell></TableRow>
                ) : (
                  filteredChains.map((chain) => {
                    const seq = Array.isArray(chain.function_sequence) ? chain.function_sequence as unknown[] : [];
                    return (
                      <TableRow key={chain.id}>
                        <TableCell><Switch checked={chain.is_active ?? true} onCheckedChange={(checked) => toggleChain({ id: chain.id, is_active: checked })} /></TableCell>
                        <TableCell><div><p className="font-medium">{chain.display_name}</p><p className="text-xs text-muted-foreground">{chain.chain_key}</p></div></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {chain.trigger_intents?.slice(0, 2).map((intent) => (<Badge key={intent} variant="outline" className="text-xs">{intent}</Badge>))}
                            {(chain.trigger_intents?.length || 0) > 2 && <Badge variant="outline" className="text-xs">+{(chain.trigger_intents?.length || 0) - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {seq.slice(0, 3).map((fn: any, i: number) => (
                              <span key={i} className="flex items-center text-xs">
                                <Badge variant="secondary" className="text-xs">{typeof fn === 'string' ? fn : fn.function_key}</Badge>
                                {i < Math.min(seq.length - 1, 2) && <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                              </span>
                            ))}
                            {seq.length > 3 && <Badge variant="outline" className="text-xs">+{seq.length - 3}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPreviewChain(chain)}><Link2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(chain)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(chain.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingChain ? 'Edit Function Chain' : 'Create Function Chain'}</DialogTitle>
            <DialogDescription>Define a sequence of functions to execute for specific intents</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="chain_key">Chain Key</Label><Input id="chain_key" placeholder="e.g., code_analysis_chain" value={formData.chain_key} onChange={(e) => setFormData(prev => ({ ...prev, chain_key: e.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="display_name">Display Name</Label><Input id="display_name" placeholder="e.g., Code Analysis Chain" value={formData.display_name} onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))} /></div>
            </div>

            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" placeholder="Describe what this chain does..." value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} /></div>

            <div className="space-y-2">
              <Label>Trigger Intents</Label>
              <div className="flex flex-wrap gap-2">
                {intents.filter(i => i.is_active).map((intent) => (
                  <Button key={intent.id} type="button" variant={formData.trigger_intents?.includes(intent.intent_key) ? 'default' : 'outline'} size="sm" onClick={() => toggleIntent(intent.intent_key)}>{intent.display_name}</Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Available Functions</Label>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-1">
                    {chatFunctions.filter(fn => fn.is_enabled).map(fn => (
                      <Button key={fn.id} variant="ghost" size="sm" className="w-full justify-start text-left" onClick={() => addFunctionToSequence(fn.function_key)} disabled={sequence.some(s => s.function_key === fn.function_key)}>
                        <Plus className="h-3 w-3 mr-2" />{fn.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Function Sequence</Label>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  {sequence.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Add functions from the left panel</p>
                  ) : (
                    <div className="space-y-2">
                      {sequence.map((item, index) => {
                        const fn = chatFunctions.find(f => f.function_key === item.function_key);
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium flex-1">{index + 1}. {fn?.name || item.function_key}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFunctionFromSequence(index)}><X className="h-3 w-3" /></Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="flex items-center gap-2"><Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))} /><Label htmlFor="is_active">Active</Label></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isCreatingChain || isUpdatingChain}>
              {(isCreatingChain || isUpdatingChain) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingChain ? 'Update Chain' : 'Create Chain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewChain} onOpenChange={() => setPreviewChain(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chain Preview: {previewChain?.display_name}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div><Label className="text-xs text-muted-foreground">Description</Label><p className="text-sm">{previewChain?.description || 'No description'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Execution Flow</Label>
              <div className="mt-2 space-y-2">
                {(Array.isArray(previewChain?.function_sequence) ? previewChain.function_sequence as unknown[] : []).map((fn: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">{i + 1}</div>
                    <Badge variant="secondary">{typeof fn === 'string' ? fn : fn.function_key}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Function Chain</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={isDeletingChain}>
              {isDeletingChain && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
