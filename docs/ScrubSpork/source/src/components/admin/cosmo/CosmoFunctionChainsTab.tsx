import { useState } from 'react';
import type { Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Link2,
  ArrowRight,
  GripVertical,
  X
} from 'lucide-react';
import { useCosmoAdmin, CosmoFunctionChain, CosmoFunctionChainInput } from '@/hooks/useCosmoAdmin';

interface FunctionSequenceItem {
  function_key: string;
  required: boolean;
  wait_for_result: boolean;
  on_error: 'fail' | 'continue' | 'retry';
}

export function CosmoFunctionChainsTab() {
  const { 
    functionChains, 
    chainsLoading, 
    chatFunctions,
    intents,
    createChain, 
    updateChain, 
    deleteChain, 
    toggleChain,
    isCreatingChain,
    isUpdatingChain,
    isDeletingChain,
  } = useCosmoAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChain, setEditingChain] = useState<CosmoFunctionChain | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewChain, setPreviewChain] = useState<CosmoFunctionChain | null>(null);

  // Form state
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
    setFormData({
      chain_key: '',
      display_name: '',
      description: '',
      trigger_intents: [],
      function_sequence: [],
      fallback_chain_id: null,
      is_active: true,
    });
    setSequence([]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (chain: CosmoFunctionChain) => {
    setEditingChain(chain);
    const seq = Array.isArray(chain.function_sequence) 
      ? (chain.function_sequence as unknown as FunctionSequenceItem[])
      : [];
    setFormData({
      chain_key: chain.chain_key,
      display_name: chain.display_name,
      description: chain.description || '',
      trigger_intents: chain.trigger_intents || [],
      function_sequence: chain.function_sequence,
      fallback_chain_id: chain.fallback_chain_id,
      is_active: chain.is_active ?? true,
    });
    setSequence(seq);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      function_sequence: sequence as unknown as Json,
    };
    if (editingChain) {
      updateChain({ id: editingChain.id, ...data });
    } else {
      createChain(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteChain(id);
    setDeleteConfirmId(null);
  };

  const addFunctionToSequence = (functionKey: string) => {
    if (!sequence.find(s => s.function_key === functionKey)) {
      setSequence(prev => [...prev, {
        function_key: functionKey,
        required: true,
        wait_for_result: true,
        on_error: 'fail' as const,
      }]);
    }
  };

  const removeFunctionFromSequence = (index: number) => {
    setSequence(prev => prev.filter((_, i) => i !== index));
  };

  const toggleIntent = (intentKey: string) => {
    setFormData(prev => {
      const intents = prev.trigger_intents || [];
      if (intents.includes(intentKey)) {
        return { ...prev, trigger_intents: intents.filter(i => i !== intentKey) };
      }
      return { ...prev, trigger_intents: [...intents, intentKey] };
    });
  };

  if (chainsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Functions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Functions</CardTitle>
          <CardDescription>
            Functions that can be used in chains ({chatFunctions.length} available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {chatFunctions.slice(0, 12).map(fn => (
              <Badge 
                key={fn.id} 
                variant={fn.is_enabled ? 'secondary' : 'outline'}
                className="cursor-default"
              >
                {fn.name}
                {fn.is_core && <span className="ml-1 text-xs opacity-50">(core)</span>}
              </Badge>
            ))}
            {chatFunctions.length > 12 && (
              <Badge variant="outline">+{chatFunctions.length - 12} more</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chains Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Function Chains</CardTitle>
              <CardDescription>
                Define sequences of functions to execute for specific intents
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Chain
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No chains match your search' : 'No function chains configured yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChains.map((chain) => {
                    const seq = Array.isArray(chain.function_sequence) ? chain.function_sequence as unknown[] : [];
                    return (
                      <TableRow key={chain.id}>
                        <TableCell>
                          <Switch
                            checked={chain.is_active ?? true}
                            onCheckedChange={(checked) => toggleChain({ id: chain.id, is_active: checked })}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{chain.display_name}</p>
                            <p className="text-xs text-muted-foreground">{chain.chain_key}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {chain.trigger_intents?.slice(0, 2).map((intent) => (
                              <Badge key={intent} variant="outline" className="text-xs">
                                {intent}
                              </Badge>
                            ))}
                            {(chain.trigger_intents?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(chain.trigger_intents?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {seq.slice(0, 3).map((fn: any, i: number) => (
                              <span key={i} className="flex items-center text-xs">
                                <Badge variant="secondary" className="text-xs">
                                  {typeof fn === 'string' ? fn : fn.function_key}
                                </Badge>
                                {i < Math.min(seq.length - 1, 2) && (
                                  <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                                )}
                              </span>
                            ))}
                            {seq.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{seq.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewChain(chain)}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(chain)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(chain.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChain ? 'Edit Function Chain' : 'Create Function Chain'}
            </DialogTitle>
            <DialogDescription>
              Define a sequence of functions to execute for specific intents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chain_key">Chain Key</Label>
                <Input
                  id="chain_key"
                  placeholder="e.g., code_analysis_chain"
                  value={formData.chain_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, chain_key: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Code Analysis Chain"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this chain does..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Intents</Label>
              <div className="flex flex-wrap gap-2">
                {intents.filter(i => i.is_active).map((intent) => (
                  <Button
                    key={intent.id}
                    type="button"
                    variant={formData.trigger_intents?.includes(intent.intent_key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleIntent(intent.intent_key)}
                  >
                    {intent.display_name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Available Functions</Label>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-1">
                    {chatFunctions.filter(fn => fn.is_enabled).map(fn => (
                      <Button
                        key={fn.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => addFunctionToSequence(fn.function_key)}
                        disabled={sequence.some(s => s.function_key === fn.function_key)}
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        {fn.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-2">
                <Label>Function Sequence</Label>
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  {sequence.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Add functions from the left panel
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sequence.map((item, index) => {
                        const fn = chatFunctions.find(f => f.function_key === item.function_key);
                        return (
                          <div 
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium flex-1">
                              {index + 1}. {fn?.name || item.function_key}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeFunctionFromSequence(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreatingChain || isUpdatingChain}>
              {(isCreatingChain || isUpdatingChain) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingChain ? 'Update Chain' : 'Create Chain'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewChain} onOpenChange={() => setPreviewChain(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewChain?.display_name}</DialogTitle>
            <DialogDescription>Chain execution flow visualization</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center gap-2">
              {Array.isArray(previewChain?.function_sequence) && 
                previewChain.function_sequence.map((fn: any, i: number) => {
                  const funcDef = chatFunctions.find(f => 
                    f.function_key === (typeof fn === 'string' ? fn : fn.function_key)
                  );
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="px-4 py-3 rounded-lg bg-muted border text-center min-w-[200px]">
                        <p className="font-medium">{funcDef?.name || fn}</p>
                        {funcDef?.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {funcDef.description}
                          </p>
                        )}
                      </div>
                      {i < (Array.isArray(previewChain.function_sequence) ? previewChain.function_sequence.length : 0) - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 my-1" />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Function Chain</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chain? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeletingChain}
            >
              {isDeletingChain && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
