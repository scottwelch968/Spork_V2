import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge, Switch, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Label, Textarea } from '@/admin/ui';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Loader2,
  Route,
  X
} from 'lucide-react';
import { useCosmoAdmin, CosmoActionMapping } from '@/hooks/useCosmoAdmin';
import type { Json } from '@/integrations/supabase/types';

const ACTION_TYPES = [
  { value: 'function', label: 'Function' },
  { value: 'chain', label: 'Function Chain' },
  { value: 'model_call', label: 'Model Call' },
  { value: 'external_api', label: 'External API' },
  { value: 'system', label: 'System Action' },
];

const CONTEXT_OPTIONS = [
  'history',
  'persona',
  'knowledge_base',
  'personal_context',
  'compliance',
  'workspace',
  'user_preferences',
];

export function CosmoActionMappingsTab() {
  const { 
    actionMappings, 
    actionMappingsLoading, 
    intents,
    createActionMapping, 
    updateActionMapping, 
    deleteActionMapping, 
    toggleActionMapping,
    isCreatingActionMapping,
    isUpdatingActionMapping,
    isDeletingActionMapping,
  } = useCosmoAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CosmoActionMapping | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    intent_key: '',
    action_key: '',
    action_type: 'function',
    required_context: [] as string[],
    priority: 50,
    is_active: true,
  });
  const [actionConfigJson, setActionConfigJson] = useState('{}');
  const [parameterPatternsJson, setParameterPatternsJson] = useState('{}');
  const [conditionsJson, setConditionsJson] = useState('{}');

  const filteredMappings = actionMappings.filter(mapping => 
    mapping.action_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.intent_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingMapping(null);
    setFormData({
      intent_key: intents[0]?.intent_key || '',
      action_key: '',
      action_type: 'function',
      required_context: [],
      priority: 50,
      is_active: true,
    });
    setActionConfigJson('{}');
    setParameterPatternsJson('{}');
    setConditionsJson('{}');
    setIsDialogOpen(true);
  };

  const openEditDialog = (mapping: CosmoActionMapping) => {
    setEditingMapping(mapping);
    setFormData({
      intent_key: mapping.intent_key,
      action_key: mapping.action_key,
      action_type: mapping.action_type,
      required_context: mapping.required_context || [],
      priority: mapping.priority || 50,
      is_active: mapping.is_active ?? true,
    });
    setActionConfigJson(JSON.stringify(mapping.action_config || {}, null, 2));
    setParameterPatternsJson(JSON.stringify(mapping.parameter_patterns || {}, null, 2));
    setConditionsJson(JSON.stringify(mapping.conditions || {}, null, 2));
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    let actionConfig: Json = {};
    let parameterPatterns: Json = {};
    let conditions: Json = {};

    try { actionConfig = JSON.parse(actionConfigJson); } catch { actionConfig = {}; }
    try { parameterPatterns = JSON.parse(parameterPatternsJson); } catch { parameterPatterns = {}; }
    try { conditions = JSON.parse(conditionsJson); } catch { conditions = {}; }

    const submitData = {
      intent_key: formData.intent_key,
      action_key: formData.action_key,
      action_type: formData.action_type,
      required_context: formData.required_context,
      priority: formData.priority,
      is_active: formData.is_active,
      action_config: actionConfig,
      parameter_patterns: parameterPatterns,
      conditions: conditions,
    };

    if (editingMapping) {
      updateActionMapping({ id: editingMapping.id, ...submitData });
    } else {
      createActionMapping(submitData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteActionMapping(id);
    setDeleteConfirmId(null);
  };

  const addContext = (context: string) => {
    if (context && !formData.required_context?.includes(context)) {
      setFormData(prev => ({
        ...prev,
        required_context: [...(prev.required_context || []), context],
      }));
    }
  };

  const removeContext = (context: string) => {
    setFormData(prev => ({
      ...prev,
      required_context: prev.required_context?.filter(c => c !== context) || [],
    }));
  };

  const getIntentDisplayName = (intentKey: string) => {
    const intent = intents.find(i => i.intent_key === intentKey);
    return intent?.display_name || intentKey;
  };

  const getActionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'function': return 'bg-blue-500/10 text-blue-600';
      case 'chain': return 'bg-purple-500/10 text-purple-600';
      case 'model_call': return 'bg-green-500/10 text-green-600';
      case 'external_api': return 'bg-orange-500/10 text-orange-600';
      case 'system': return 'bg-gray-500/10 text-gray-600';
      default: return 'bg-muted';
    }
  };

  if (actionMappingsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4" />
            Action Mappings
          </CardTitle>
          <CardDescription>
            Configure how detected intents map to executable actions
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Intent → Action Mappings</CardTitle>
              <CardDescription>
                {actionMappings.length} mapping{actionMappings.length !== 1 ? 's' : ''} configured
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Mapping
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by intent, action, or type..."
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
                  <TableHead>Action Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required Context</TableHead>
                  <TableHead className="w-[80px]">Priority</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No mappings match your search' : 'No action mappings configured yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell>
                        <Switch
                          checked={mapping.is_active ?? true}
                          onCheckedChange={(checked) => toggleActionMapping({ id: mapping.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getIntentDisplayName(mapping.intent_key)}</p>
                          <p className="text-xs text-muted-foreground">{mapping.intent_key}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {mapping.action_key}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionTypeBadgeColor(mapping.action_type)}>
                          {mapping.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {mapping.required_context?.slice(0, 2).map((ctx) => (
                            <Badge key={ctx} variant="outline" className="text-xs">
                              {ctx}
                            </Badge>
                          ))}
                          {(mapping.required_context?.length || 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(mapping.required_context?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={
                            (mapping.priority || 0) >= 70 ? 'bg-primary/10 text-primary' :
                            (mapping.priority || 0) >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-muted'
                          }
                        >
                          {mapping.priority || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(mapping)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(mapping.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMapping ? 'Edit Action Mapping' : 'Create Action Mapping'}</DialogTitle>
            <DialogDescription>Define how an intent maps to an executable action</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intent_key">Intent</Label>
                <select
                  id="intent_key"
                  value={formData.intent_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, intent_key: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {intents.map((intent) => (
                    <option key={intent.intent_key} value={intent.intent_key}>
                      {intent.display_name} ({intent.intent_key})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="action_key">Action Key</Label>
                <Input
                  id="action_key"
                  placeholder="e.g., execute_code_analysis"
                  value={formData.action_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, action_key: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action_type">Action Type</Label>
                <select
                  id="action_type"
                  value={formData.action_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, action_type: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
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
              <Label>Required Context</Label>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_OPTIONS.map((ctx) => (
                  <Button
                    key={ctx}
                    type="button"
                    variant={formData.required_context?.includes(ctx) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => formData.required_context?.includes(ctx) ? removeContext(ctx) : addContext(ctx)}
                    className="capitalize"
                  >
                    {ctx.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_config">Action Config (JSON)</Label>
              <Textarea
                id="action_config"
                value={actionConfigJson}
                onChange={(e) => setActionConfigJson(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameter_patterns">Parameter Patterns (JSON)</Label>
              <Textarea
                id="parameter_patterns"
                value={parameterPatternsJson}
                onChange={(e) => setParameterPatternsJson(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions (JSON)</Label>
              <Textarea
                id="conditions"
                value={conditionsJson}
                onChange={(e) => setConditionsJson(e.target.value)}
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isCreatingActionMapping || isUpdatingActionMapping}>
              {(isCreatingActionMapping || isUpdatingActionMapping) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingMapping ? 'Update Mapping' : 'Create Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Action Mapping</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={isDeletingActionMapping}>
              {isDeletingActionMapping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
