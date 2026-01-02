/**
 * Container Form - Create/Edit container configurations
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useChatFunctions, useChatActors } from '@/hooks/useChatFunctionsAdmin';

export interface ContainerFormData {
  container_key: string;
  name: string;
  description: string;
  function_key: string | null;
  subscribes_to: string[];
  content_type: string;
  target_actors: string[];
  display_config: Record<string, unknown>;
  style_config: Record<string, unknown>;
  format_config: Record<string, unknown>;
  render_schema: Record<string, unknown>;
  is_enabled: boolean;
  is_core: boolean;
  is_deletable: boolean;
  display_order: number;
}

interface ContainerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ContainerFormData>;
  onSubmit: (data: ContainerFormData) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const CONTENT_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'image', label: 'Image' },
  { value: 'map', label: 'Map' },
  { value: 'code', label: 'Code' },
  { value: 'table', label: 'Table' },
  { value: 'media', label: 'Media' },
  { value: 'custom', label: 'Custom' },
];

const LAYOUT_OPTIONS = ['inline', 'card', 'modal', 'sidebar', 'fullscreen'];
const MAX_WIDTH_OPTIONS = ['sm', 'md', 'lg', 'xl', 'full'];
const ASPECT_RATIO_OPTIONS = ['1:1', '4:3', '16:9', 'auto'];
const STYLE_VARIANTS = ['default', 'minimal', 'accent', 'destructive'];

const defaultFormData: ContainerFormData = {
  container_key: '',
  name: '',
  description: '',
  function_key: null,
  subscribes_to: [],
  content_type: 'text',
  target_actors: [],
  display_config: { layout: 'card', showHeader: true, maxWidth: 'md' },
  style_config: { variant: 'default' },
  format_config: {},
  render_schema: {},
  is_enabled: true,
  is_core: false,
  is_deletable: true,
  display_order: 100,
};

export function ContainerForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
  mode,
}: ContainerFormProps) {
  const [formData, setFormData] = useState<ContainerFormData>(defaultFormData);
  const [newEvent, setNewEvent] = useState('');
  const { data: functions } = useChatFunctions();
  const { data: actors } = useChatActors();

  useEffect(() => {
    if (initialData) {
      setFormData({ ...defaultFormData, ...initialData });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addEvent = () => {
    if (newEvent && !formData.subscribes_to.includes(newEvent)) {
      setFormData((prev) => ({
        ...prev,
        subscribes_to: [...prev.subscribes_to, newEvent],
      }));
      setNewEvent('');
    }
  };

  const removeEvent = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      subscribes_to: prev.subscribes_to.filter((e) => e !== event),
    }));
  };

  const toggleActor = (actorType: string) => {
    setFormData((prev) => ({
      ...prev,
      target_actors: prev.target_actors.includes(actorType)
        ? prev.target_actors.filter((a) => a !== actorType)
        : [...prev.target_actors, actorType],
    }));
  };

  const updateDisplayConfig = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      display_config: { ...prev.display_config, [key]: value },
    }));
  };

  const updateStyleConfig = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      style_config: { ...prev.style_config, [key]: value },
    }));
  };

  const updateFormatConfig = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      format_config: { ...prev.format_config, [key]: value },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Container' : 'Edit Container'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="display">Display</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="format">Format</TabsTrigger>
              <TabsTrigger value="render">Render</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="container_key">Container Key</Label>
                  <Input
                    id="container_key"
                    value={formData.container_key}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, container_key: e.target.value }))
                    }
                    placeholder="my-container"
                    disabled={mode === 'edit'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="My Container"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Container description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Linked Function</Label>
                  <Select
                    value={formData.function_key || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        function_key: v === 'none' ? null : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select function" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {functions?.map((f) => (
                        <SelectItem key={f.function_key} value={f.function_key}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, content_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Subscribes To Events */}
              <div className="space-y-2">
                <Label>Subscribes To Events</Label>
                <div className="flex gap-2">
                  <Input
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    placeholder="event:name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEvent())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addEvent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.subscribes_to.map((event) => (
                    <Badge key={event} variant="secondary" className="gap-1">
                      {event}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeEvent(event)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Target Actors */}
              <div className="space-y-2">
                <Label>Target Actors (empty = all)</Label>
                <div className="flex flex-wrap gap-2">
                  {actors?.map((actor) => (
                    <Badge
                      key={actor.actor_type}
                      variant={
                        formData.target_actors.includes(actor.actor_type) ? 'default' : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => toggleActor(actor.actor_type)}
                    >
                      {actor.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Flags */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_enabled}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_enabled: v }))}
                  />
                  <Label>Enabled</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_core}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_core: v }))}
                  />
                  <Label>Core</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_deletable}
                    onCheckedChange={(v) => setFormData((prev) => ({ ...prev, is_deletable: v }))}
                  />
                  <Label>Deletable</Label>
                </div>
              </div>
            </TabsContent>

            {/* Display Tab */}
            <TabsContent value="display" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select
                    value={(formData.display_config.layout as string) || 'card'}
                    onValueChange={(v) => updateDisplayConfig('layout', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_OPTIONS.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l.charAt(0).toUpperCase() + l.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Width</Label>
                  <Select
                    value={(formData.display_config.maxWidth as string) || 'md'}
                    onValueChange={(v) => updateDisplayConfig('maxWidth', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAX_WIDTH_OPTIONS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select
                    value={(formData.display_config.aspectRatio as string) || 'auto'}
                    onValueChange={(v) => updateDisplayConfig('aspectRatio', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_OPTIONS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, display_order: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(formData.display_config.showHeader as boolean) ?? true}
                    onCheckedChange={(v) => updateDisplayConfig('showHeader', v)}
                  />
                  <Label>Show Header</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={(formData.display_config.showFooter as boolean) ?? false}
                    onCheckedChange={(v) => updateDisplayConfig('showFooter', v)}
                  />
                  <Label>Show Footer</Label>
                </div>
              </div>
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Variant</Label>
                  <Select
                    value={(formData.style_config.variant as string) || 'default'}
                    onValueChange={(v) => updateStyleConfig('variant', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_VARIANTS.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Background Class</Label>
                  <Input
                    value={(formData.style_config.bgClass as string) || ''}
                    onChange={(e) => updateStyleConfig('bgClass', e.target.value)}
                    placeholder="bg-muted/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Border Class</Label>
                  <Input
                    value={(formData.style_config.borderClass as string) || ''}
                    onChange={(e) => updateStyleConfig('borderClass', e.target.value)}
                    placeholder="border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon Color</Label>
                  <Input
                    value={(formData.style_config.iconColor as string) || ''}
                    onChange={(e) => updateStyleConfig('iconColor', e.target.value)}
                    placeholder="text-primary"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Format Tab */}
            <TabsContent value="format" className="space-y-4 pt-4">
              {formData.content_type === 'text' && (
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(formData.format_config.markdown as boolean) ?? true}
                      onCheckedChange={(v) => updateFormatConfig('markdown', v)}
                    />
                    <Label>Markdown</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(formData.format_config.codeHighlight as boolean) ?? true}
                      onCheckedChange={(v) => updateFormatConfig('codeHighlight', v)}
                    />
                    <Label>Code Highlighting</Label>
                  </div>
                </div>
              )}

              {formData.content_type === 'image' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Image Size</Label>
                    <Select
                      value={(formData.format_config.imageSize as string) || 'medium'}
                      onValueChange={(v) => updateFormatConfig('imageSize', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Image Quality</Label>
                    <Select
                      value={(formData.format_config.imageQuality as string) || 'high'}
                      onValueChange={(v) => updateFormatConfig('imageQuality', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.content_type === 'map' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Map Style</Label>
                    <Select
                      value={(formData.format_config.mapStyle as string) || 'roadmap'}
                      onValueChange={(v) => updateFormatConfig('mapStyle', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roadmap">Roadmap</SelectItem>
                        <SelectItem value="satellite">Satellite</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Zoom</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={(formData.format_config.defaultZoom as number) || 14}
                      onChange={(e) => updateFormatConfig('defaultZoom', Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {formData.content_type === 'code' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Input
                      value={(formData.format_config.language as string) || ''}
                      onChange={(e) => updateFormatConfig('language', e.target.value)}
                      placeholder="javascript"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      checked={(formData.format_config.lineNumbers as boolean) ?? true}
                      onCheckedChange={(v) => updateFormatConfig('lineNumbers', v)}
                    />
                    <Label>Line Numbers</Label>
                  </div>
                </div>
              )}

              {(formData.content_type === 'custom' || formData.content_type === 'table' || formData.content_type === 'media') && (
                <div className="space-y-2">
                  <Label>Custom Format Config (JSON)</Label>
                  <Textarea
                    value={JSON.stringify(formData.format_config, null, 2)}
                    onChange={(e) => {
                      try {
                        setFormData((prev) => ({
                          ...prev,
                          format_config: JSON.parse(e.target.value),
                        }));
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </TabsContent>

            {/* Render Tab - Dynamic UI Schema */}
            <TabsContent value="render" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Render Schema (JSON)</Label>
                <p className="text-xs text-muted-foreground">
                  Define the UI structure using primitives: card, text, image, list, row, button, badge, divider, grid, conditional.
                  Use {'{{fieldName}}'} syntax to map data from function output.
                </p>
                <Textarea
                  value={JSON.stringify(formData.render_schema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData((prev) => ({
                        ...prev,
                        render_schema: JSON.parse(e.target.value),
                      }));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder={`{
  "type": "card",
  "children": [
    { "type": "text", "value": "{{title}}", "style": "accent" },
    { "type": "text", "value": "{{description}}" }
  ]
}`}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Templates</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        render_schema: {
                          type: 'card',
                          children: [
                            { type: 'text', value: '{{title}}', style: 'accent' },
                            { type: 'text', value: '{{content}}' },
                          ],
                        },
                      }))
                    }
                  >
                    Simple Card
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        render_schema: {
                          type: 'list',
                          items: '{{results}}',
                          itemTemplate: {
                            type: 'row',
                            icon: '{{icon}}',
                            primary: '{{name}}',
                            secondary: '{{description}}',
                          },
                        },
                      }))
                    }
                  >
                    List View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        render_schema: {
                          type: 'card',
                          children: [
                            { type: 'image', src: '{{imageUrl}}', alt: '{{title}}' },
                            { type: 'text', value: '{{title}}', style: 'accent' },
                            { type: 'badge', value: '{{status}}', variant: 'secondary' },
                          ],
                        },
                      }))
                    }
                  >
                    Image Card
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}