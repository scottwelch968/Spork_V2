/**
 * Function Form - Create/Edit chat functions
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Loader2 } from 'lucide-react';
import type { ChatFunction } from '@/lib/chatFunctions/registry';

const CATEGORIES = ['core', 'ui', 'persistence', 'feature'] as const;

// Use Json type from Supabase for schema fields
import type { Json } from '@/integrations/supabase/types';

export interface FunctionFormData {
  function_key: string;
  name: string;
  description: string;
  category: string;
  code_path: string;
  events_emitted: string[];
  depends_on: string[];
  tags: string[];
  input_schema: Json;
  output_schema: Json;
  is_core: boolean;
  is_enabled: boolean;
  display_order: number;
}

interface FunctionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  func?: ChatFunction;
  existingFunctions: ChatFunction[];
  onSubmit: (data: FunctionFormData) => void;
  isSubmitting: boolean;
}

export function FunctionForm({
  open,
  onOpenChange,
  func,
  existingFunctions,
  onSubmit,
  isSubmitting,
}: FunctionFormProps) {
  const isEditing = !!func;
  
  const [formData, setFormData] = useState<FunctionFormData>({
    function_key: '',
    name: '',
    description: '',
    category: 'feature',
    code_path: '',
    events_emitted: [],
    depends_on: [],
    tags: [],
    input_schema: {} as Json,
    output_schema: {} as Json,
    is_core: false,
    is_enabled: true,
    display_order: 0,
  });
  
  const [newEvent, setNewEvent] = useState('');
  const [newTag, setNewTag] = useState('');
  const [inputSchemaText, setInputSchemaText] = useState('{}');
  const [outputSchemaText, setOutputSchemaText] = useState('{}');
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or func changes
  useEffect(() => {
    if (open && func) {
      setFormData({
        function_key: func.function_key,
        name: func.name,
        description: func.description || '',
        category: func.category,
        code_path: func.code_path || '',
        events_emitted: func.events_emitted || [],
        depends_on: func.depends_on || [],
        tags: func.tags || [],
        input_schema: (func.input_schema || {}) as Json,
        output_schema: (func.output_schema || {}) as Json,
        is_core: func.is_core || false,
        is_enabled: func.is_enabled ?? true,
        display_order: func.display_order || 0,
      });
      setInputSchemaText(JSON.stringify(func.input_schema || {}, null, 2));
      setOutputSchemaText(JSON.stringify(func.output_schema || {}, null, 2));
      setNewTag('');
    } else if (open) {
      // Reset for new function
      const maxOrder = Math.max(...existingFunctions.map(f => f.display_order || 0), 0);
      setFormData({
        function_key: '',
        name: '',
        description: '',
        category: 'feature',
        code_path: '',
        events_emitted: [],
        depends_on: [],
        tags: [],
        input_schema: {} as Json,
        output_schema: {} as Json,
        is_core: false,
        is_enabled: true,
        display_order: maxOrder + 1,
      });
      setInputSchemaText('{}');
      setOutputSchemaText('{}');
      setNewTag('');
    }
    setSchemaError(null);
  }, [open, func, existingFunctions]);

  const handleAddEvent = () => {
    if (newEvent && !formData.events_emitted.includes(newEvent)) {
      setFormData(prev => ({
        ...prev,
        events_emitted: [...prev.events_emitted, newEvent],
      }));
      setNewEvent('');
    }
  };

  const handleRemoveEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events_emitted: prev.events_emitted.filter(e => e !== event),
    }));
  };

  const handleAddTag = () => {
    const tag = newTag.toLowerCase().trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleToggleDependency = (funcKey: string) => {
    setFormData(prev => ({
      ...prev,
      depends_on: prev.depends_on.includes(funcKey)
        ? prev.depends_on.filter(d => d !== funcKey)
        : [...prev.depends_on, funcKey],
    }));
  };

  const handleSubmit = () => {
    // Validate JSON schemas
    try {
      const inputSchema = JSON.parse(inputSchemaText);
      const outputSchema = JSON.parse(outputSchemaText);
      setSchemaError(null);
      
      onSubmit({
        ...formData,
        input_schema: inputSchema,
        output_schema: outputSchema,
      });
    } catch (e) {
      setSchemaError('Invalid JSON in schema fields');
    }
  };

  const availableDependencies = existingFunctions.filter(
    f => f.function_key !== formData.function_key
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Function' : 'Create Function'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="function_key">Function Key</Label>
                <Input
                  id="function_key"
                  value={formData.function_key}
                  onChange={e => setFormData(prev => ({ ...prev, function_key: e.target.value }))}
                  placeholder="myFunction"
                  disabled={isEditing}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier (camelCase)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Function"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this function do?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code_path">Code Path</Label>
                <Input
                  id="code_path"
                  value={formData.code_path}
                  onChange={e => setFormData(prev => ({ ...prev, code_path: e.target.value }))}
                  placeholder="src/lib/chatFunctions/myFunction.ts"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label>Events Emitted</Label>
              <div className="flex gap-2">
                <Input
                  value={newEvent}
                  onChange={e => setNewEvent(e.target.value)}
                  placeholder="event:name"
                  className="font-mono"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddEvent())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddEvent}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.events_emitted.map(event => (
                  <Badge key={event} variant="secondary" className="font-mono text-xs">
                    {event}
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(event)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (for Cosmo Ai matching)</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="location, maps, ai..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs bg-primary/10">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Semantic tags help Cosmo match user intent to functions
              </p>
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <Label>Dependencies</Label>
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px]">
                {availableDependencies.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No other functions available</span>
                ) : (
                  availableDependencies.map(f => (
                    <Badge
                      key={f.function_key}
                      variant={formData.depends_on.includes(f.function_key) ? 'default' : 'outline'}
                      className="cursor-pointer font-mono text-xs"
                      onClick={() => handleToggleDependency(f.function_key)}
                    >
                      {f.function_key}
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Click to toggle dependency
              </p>
            </div>

            {/* Schemas */}
            <div className="space-y-2">
              <Label htmlFor="input_schema">Input Schema (JSON)</Label>
              <Textarea
                id="input_schema"
                value={inputSchemaText}
                onChange={e => setInputSchemaText(e.target.value)}
                className="font-mono text-xs"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="output_schema">Output Schema (JSON)</Label>
              <Textarea
                id="output_schema"
                value={outputSchemaText}
                onChange={e => setOutputSchemaText(e.target.value)}
                className="font-mono text-xs"
                rows={4}
              />
            </div>

            {schemaError && (
              <p className="text-sm text-destructive">{schemaError}</p>
            )}

            {/* Flags */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_enabled"
                    checked={formData.is_enabled}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, is_enabled: checked }))}
                  />
                  <Label htmlFor="is_enabled">Enabled</Label>
                </div>
                {!isEditing && (
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_core"
                      checked={formData.is_core}
                      onCheckedChange={checked => setFormData(prev => ({ ...prev, is_core: checked }))}
                    />
                    <Label htmlFor="is_core">Core Function</Label>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="display_order">Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={e => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.function_key || !formData.name}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Function'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
