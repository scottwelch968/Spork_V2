import { useState } from 'react';
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
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Brain,
  Zap,
  X
} from 'lucide-react';
import { useCosmoAdmin, CosmoIntent, CosmoIntentInput } from '@/hooks/useCosmoAdmin';

const INTENT_CATEGORIES = [
  'conversation',
  'coding',
  'research',
  'writing',
  'image_generation',
  'video_generation',
  'deep_think',
  'analysis',
  'translation',
  'summarization',
];

const CONTEXT_NEEDS = [
  'history',
  'persona',
  'knowledge_base',
  'personal_context',
  'compliance',
];

export function CosmoIntentsTab() {
  const { 
    intents, 
    intentsLoading, 
    createIntent, 
    updateIntent, 
    deleteIntent, 
    toggleIntent,
    isCreatingIntent,
    isUpdatingIntent,
    isDeletingIntent,
  } = useCosmoAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntent, setEditingIntent] = useState<CosmoIntent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CosmoIntentInput>({
    intent_key: '',
    display_name: '',
    description: '',
    category: 'conversation',
    keywords: [],
    priority: 50,
    required_functions: [],
    preferred_models: [],
    context_needs: [],
    is_active: true,
  });
  const [keywordInput, setKeywordInput] = useState('');

  const filteredIntents = intents.filter(intent => 
    intent.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intent.intent_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intent.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openCreateDialog = () => {
    setEditingIntent(null);
    setFormData({
      intent_key: '',
      display_name: '',
      description: '',
      category: 'conversation',
      keywords: [],
      priority: 50,
      required_functions: [],
      preferred_models: [],
      context_needs: [],
      is_active: true,
    });
    setKeywordInput('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (intent: CosmoIntent) => {
    setEditingIntent(intent);
    setFormData({
      intent_key: intent.intent_key,
      display_name: intent.display_name,
      description: intent.description || '',
      category: intent.category,
      keywords: intent.keywords || [],
      priority: intent.priority || 50,
      required_functions: intent.required_functions || [],
      preferred_models: intent.preferred_models || [],
      context_needs: intent.context_needs || [],
      is_active: intent.is_active ?? true,
    });
    setKeywordInput('');
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingIntent) {
      updateIntent({ id: editingIntent.id, ...formData });
    } else {
      createIntent(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteIntent(id);
    setDeleteConfirmId(null);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()],
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || [],
    }));
  };

  const toggleContextNeed = (need: string) => {
    setFormData(prev => {
      const needs = prev.context_needs || [];
      if (needs.includes(need)) {
        return { ...prev, context_needs: needs.filter(n => n !== need) };
      }
      return { ...prev, context_needs: [...needs, need] };
    });
  };

  if (intentsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intent Analyzer Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Intent Analyzer
          </CardTitle>
          <CardDescription>
            Test which intent COSMO would detect for a given prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input 
              placeholder="Enter a test prompt to analyze intent..."
              className="flex-1"
            />
            <Button variant="secondary" className="gap-2">
              <Brain className="h-4 w-4" />
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Intents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Intent Definitions</CardTitle>
              <CardDescription>
                Configure how COSMO categorizes user prompts
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Intent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search intents by name or keywords..."
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
                  <TableHead>Intent</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead className="w-[80px]">Priority</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No intents match your search' : 'No intents configured yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIntents.map((intent) => (
                    <TableRow key={intent.id}>
                      <TableCell>
                        <Switch
                          checked={intent.is_active ?? true}
                          onCheckedChange={(checked) => toggleIntent({ id: intent.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{intent.display_name}</p>
                          <p className="text-xs text-muted-foreground">{intent.intent_key}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {intent.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {intent.keywords?.slice(0, 3).map((kw) => (
                            <Badge key={kw} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {(intent.keywords?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(intent.keywords?.length || 0) - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={
                            (intent.priority || 0) >= 70 ? 'bg-primary/10 text-primary' :
                            (intent.priority || 0) >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-muted'
                          }
                        >
                          {intent.priority || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(intent)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(intent.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIntent ? 'Edit Intent' : 'Create New Intent'}
            </DialogTitle>
            <DialogDescription>
              Define how COSMO should recognize and route this type of request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intent_key">Intent Key</Label>
                <Input
                  id="intent_key"
                  placeholder="e.g., code_review"
                  value={formData.intent_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, intent_key: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Code Review"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe when this intent should be detected..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {INTENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority ({formData.priority})</Label>
                <Input
                  id="priority"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keywords</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" variant="secondary" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.keywords?.map((kw) => (
                  <Badge key={kw} variant="secondary" className="gap-1">
                    {kw}
                    <button onClick={() => removeKeyword(kw)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Context Needs</Label>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_NEEDS.map((need) => (
                  <Button
                    key={need}
                    type="button"
                    variant={formData.context_needs?.includes(need) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleContextNeed(need)}
                    className="capitalize"
                  >
                    {need.replace('_', ' ')}
                  </Button>
                ))}
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
            <Button onClick={handleSubmit} disabled={isCreatingIntent || isUpdatingIntent}>
              {(isCreatingIntent || isUpdatingIntent) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingIntent ? 'Update Intent' : 'Create Intent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Intent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this intent? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeletingIntent}
            >
              {isDeletingIntent && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
