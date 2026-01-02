import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { usePersonaTemplates } from '@/hooks/usePersonaTemplates';

interface SpacePersonaDialogProps {
  open?: boolean;
  persona: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function SpacePersonaDialog({ open, persona, onClose, onSave }: SpacePersonaDialogProps) {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const { templates, incrementUseCount, loading: templatesLoading } = usePersonaTemplates();

  const groupedTemplates = useMemo(() => {
    return templates.reduce((acc, template) => {
      const categoryName = template.category?.name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);
  }, [templates]);

  useEffect(() => {
    if (persona) {
      setName(persona.name || '');
      setDescription(persona.description || '');
      setSystemPrompt(persona.system_prompt || '');
    }
  }, [persona]);

  useEffect(() => {
    if (mode === 'custom' && !persona) {
      setSelectedTemplateId(null);
      setName('');
      setDescription('');
      setSystemPrompt('');
    }
  }, [mode, persona]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setName(template.name);
      setDescription(template.description || '');
      setSystemPrompt(template.system_prompt);
      incrementUseCount(templateId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      system_prompt: systemPrompt.trim(),
      is_default: false,
    });
  };

  // Reset form when dialog opens for new persona
  useEffect(() => {
    if (open && !persona) {
      setMode('template');
      setSelectedTemplateId(null);
      setName('');
      setDescription('');
      setSystemPrompt('');
    }
  }, [open, persona]);

  return (
    <Dialog open={open !== undefined ? open : true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{persona ? 'Edit Persona' : 'Create Persona'}</DialogTitle>
          <DialogDescription>
            Define a persona with custom behavior for this space
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!persona && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'template' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Start from Template</TabsTrigger>
                <TabsTrigger value="custom">Build Your Own</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === 'template' && !persona && (
            <div className="space-y-2">
              <Label htmlFor="template">Select Template</Label>
              <Select
                value={selectedTemplateId || ''}
                onValueChange={handleTemplateSelect}
                disabled={templatesLoading}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder={templatesLoading ? 'Loading templates...' : 'Choose a template...'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedTemplates).map(([categoryName, categoryTemplates]) => (
                    <SelectGroup key={categoryName}>
                      <SelectLabel>{categoryName}</SelectLabel>
                      {categoryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Support Agent"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this persona"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define how this persona should behave..."
              className="min-h-[150px]"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {persona ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
