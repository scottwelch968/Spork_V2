import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';

interface SpacePromptDialogProps {
  prompt: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
  open?: boolean;
}

export function SpacePromptDialog({ prompt, onClose, onSave, open }: SpacePromptDialogProps) {
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const { templates, incrementUseCount } = usePromptTemplates();

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, typeof templates> = {};
    templates.forEach((template) => {
      const categoryName = template.category?.name || 'Uncategorized';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(template);
    });
    return groups;
  }, [templates]);

  // Reset form when dialog opens for new prompt
  useEffect(() => {
    if (open && !prompt) {
      setMode('template');
      setSelectedTemplateId('');
      setTitle('');
      setContent('');
      setCategory('');
    }
  }, [open, prompt]);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title || '');
      setContent(prompt.content || '');
      setCategory(prompt.category || '');
      setMode('custom');
    }
  }, [prompt]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      setCategory(template.category?.name || '');
      incrementUseCount(templateId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || null,
    });
  };

  const isEditing = !!prompt;

  return (
    <Dialog open={open !== undefined ? open : true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Prompt' : 'Create Prompt'}</DialogTitle>
          <DialogDescription>
            Save a prompt for quick reuse in this space
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template/Custom Tabs - only show when creating new */}
          {!isEditing && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'template' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Start from Template</TabsTrigger>
                <TabsTrigger value="custom">Build Your Own</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Template Selection - only show in template mode when creating */}
          {!isEditing && mode === 'template' && (
            <div className="space-y-2">
              <Label>Select a Template</Label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a prompt template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedTemplates).map(([categoryName, categoryTemplates]) => (
                    <SelectGroup key={categoryName}>
                      <SelectLabel>{categoryName}</SelectLabel>
                      {categoryTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Code Review Template"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Coding, Writing, Research"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Prompt Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt..."
              className="min-h-[200px] whitespace-pre-wrap"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
