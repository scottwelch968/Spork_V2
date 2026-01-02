import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Prompt } from '@/hooks/usePrompts';
import { usePromptTemplates } from '@/hooks/usePromptTemplates';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (title: string, content: string, category: string | null) => void;
  prompt?: { title: string; content: string; category: string | null } | null;
}

export const PromptDialog = ({ open, onOpenChange, onSave, prompt }: PromptDialogProps) => {
  const [mode, setMode] = useState<'template' | 'custom'>('custom');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  
  const { templates, incrementUseCount, loading: templatesLoading } = usePromptTemplates();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setTitle(template.title);
      setContent(template.content);
      setCategory(template.category?.name || '');
      incrementUseCount(templateId);
    }
  };

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
      setCategory(prompt.category || '');
    } else {
      setMode('custom');
      setSelectedTemplateId(null);
      setTitle('');
      setContent('');
      setCategory('');
    }
  }, [prompt, open]);

  useEffect(() => {
    if (mode === 'custom' && !prompt) {
      setSelectedTemplateId(null);
      setTitle('');
      setContent('');
      setCategory('');
    }
  }, [mode, prompt]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave(title, content, category.trim() || null);
    onOpenChange(false);
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const categoryName = template.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{prompt ? 'Edit Prompt' : 'Create Prompt'}</DialogTitle>
          <DialogDescription>
            {prompt ? 'Update your prompt details' : 'Save a new prompt for reuse'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!prompt && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'template' | 'custom')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">Start from Template</TabsTrigger>
                <TabsTrigger value="custom">Build Your Own</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === 'template' && !prompt && (
            <div className="grid gap-2">
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
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product Description Writer"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Marketing, Development, Writing"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Prompt Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt..."
              className="min-h-[200px] resize-none whitespace-pre-wrap"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
            {prompt ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
