import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import { usePersonaTemplates } from '@/hooks/usePersonaTemplates';

interface Persona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  is_default: boolean;
}

interface PersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  onSuccess: () => void;
}

const ICON_SUGGESTIONS = ['Bot', 'Target', 'Lightbulb', 'Palette', 'FileText', 'Microscope', 'Briefcase', 'GraduationCap', 'Rocket', 'Zap'];

export function PersonaDialog({ open, onOpenChange, persona, onSuccess }: PersonaDialogProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'template' | 'custom'>('custom');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { templates, incrementUseCount, loading: templatesLoading } = usePersonaTemplates();

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

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setDescription(persona.description || '');
      setSystemPrompt(persona.system_prompt);
      setIsDefault(persona.is_default);
    } else {
      setMode('custom');
      setSelectedTemplateId(null);
      setName('');
      setDescription('');
      setSystemPrompt('');
      setIsDefault(false);
    }
  }, [persona, open]);

  useEffect(() => {
    if (mode === 'custom' && !persona) {
      setSelectedTemplateId(null);
      setName('');
      setDescription('');
      setSystemPrompt('');
      setIsDefault(false);
    }
  }, [mode, persona]);

  const handleSave = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      toast.error('Name and system prompt are required');
      return;
    }

    setIsSaving(true);
    try {
      // If setting as default, first unset all other defaults for this user
      if (isDefault && user?.id) {
        await supabase
          .from('personas')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const data = {
        name: name.trim(),
        description: description.trim() || null,
        system_prompt: systemPrompt.trim(),
        is_default: isDefault,
        user_id: user?.id,
        created_by: user?.id,
      };

      if (persona) {
        const { error } = await supabase
          .from('personas')
          .update(data)
          .eq('id', persona.id);

        if (error) throw error;
        toast.success('Persona updated');
      } else {
        const { error } = await supabase
          .from('personas')
          .insert([data]);

        if (error) throw error;
        toast.success('Persona created');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving persona:', error);
      toast.error('Failed to save persona');
    } finally {
      setIsSaving(false);
    }
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{persona ? 'Edit Persona' : 'Create Persona'}</DialogTitle>
          <DialogDescription>
            Define the personality, expertise, and behavior of your AI assistant
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Expert, Code Reviewer, Creative Writer"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this persona's purpose"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful AI assistant specialized in..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This prompt defines how the AI will behave and respond
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isDefault">Default Persona</Label>
              <p className="text-xs text-muted-foreground">
                Use this persona for new chats by default
              </p>
            </div>
            <Switch
              id="isDefault"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : persona ? 'Update' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
