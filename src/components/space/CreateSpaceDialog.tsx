import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useSpaceTemplates } from '@/hooks/useSpaceTemplates';
import { usePersonaTemplates } from '@/hooks/usePersonaTemplates';

// Strict space color options
const SPACE_COLORS = ['blue', 'gray', 'red', 'green'] as const;

interface CreateSpaceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { 
    name: string; 
    description: string;
    templateId?: string;
    ai_model?: string;
    ai_instructions?: string;
    compliance_rule?: string;
    file_quota_mb?: number;
    default_personas?: any;
    default_prompts?: any;
  }) => void;
  isCreating: boolean;
}

export function CreateSpaceDialog({ open, onClose, onCreate, isCreating }: CreateSpaceDialogProps) {
  const [mode, setMode] = useState<'scratch' | 'template'>('scratch');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [aiInstructions, setAiInstructions] = useState('');
  const [selectedPersonaTemplateId, setSelectedPersonaTemplateId] = useState<string | null>(null);
  
  const { templates, loading: templatesLoading, incrementUseCount } = useSpaceTemplates();
  const { templates: personaTemplates } = usePersonaTemplates();

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const categoryName = template.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  // When template is selected, populate form
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
      }
    }
  }, [selectedTemplateId, templates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Default to blue for new spaces
    const data: any = {
      name: name.trim(),
      description: description.trim(),
      color_code: 'blue',
    };

    // If using a template, include template config
    if (mode === 'template' && selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        data.templateId = template.id;
        data.ai_model = template.ai_model;
        data.ai_instructions = template.ai_instructions;
        data.compliance_rule = template.compliance_rule;
        data.file_quota_mb = template.file_quota_mb;
        
        // Resolve persona template UUIDs to full objects
        if (template.default_personas && Array.isArray(template.default_personas)) {
          data.default_personas = template.default_personas
            .map((personaId: string) => {
              const personaTemplate = personaTemplates.find(p => p.id === personaId);
              if (personaTemplate) {
                return {
                  name: personaTemplate.name,
                  description: personaTemplate.description,
                  system_prompt: personaTemplate.system_prompt,
                  icon: personaTemplate.icon,
                  is_default: false, // Will be set on first one in useSpace
                };
              }
              return null;
            })
            .filter(Boolean);
          
          // Set first persona as default
          if (data.default_personas.length > 0) {
            data.default_personas[0].is_default = true;
          }
        }
        
        data.default_prompts = template.default_prompts;

        // Increment use count
        incrementUseCount(template.id);
      }
    }

    // If creating from scratch, include AI instructions and persona
    if (mode === 'scratch') {
      if (aiInstructions.trim()) {
        data.ai_instructions = aiInstructions.trim();
      }
      
      // If a persona template was selected, include it
      if (selectedPersonaTemplateId) {
        const personaTemplate = personaTemplates.find(p => p.id === selectedPersonaTemplateId);
        if (personaTemplate) {
          data.default_personas = [{
            name: personaTemplate.name,
            description: personaTemplate.description,
            system_prompt: personaTemplate.system_prompt,
            icon: personaTemplate.icon,
            is_default: true
          }];
        }
      }
      // If no persona selected, General Assistant is created by default (handled in useSpace)
    }

    onCreate(data);

    // Reset form
    setName('');
    setDescription('');
    setMode('scratch');
    setSelectedTemplateId(null);
    setAiInstructions('');
    setSelectedPersonaTemplateId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new space to organize your work and collaborate with others
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'scratch' | 'template')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scratch">Start from Scratch</TabsTrigger>
            <TabsTrigger value="template">Start from Template</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <TabsContent value="template" className="mt-0 space-y-4">
              <div>
                <Label htmlFor="template-select">Choose a Template</Label>
                <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                      <SelectGroup key={category}>
                        <SelectLabel>{category}</SelectLabel>
                        {categoryTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                            {template.is_featured && ' ⭐'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId && templates.find(t => t.id === selectedTemplateId)?.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {templates.find(t => t.id === selectedTemplateId)?.description}
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scratch" className="mt-0 space-y-4">
              {/* AI Instructions - only shown in scratch mode */}
              <div>
                <Label htmlFor="ai-instructions">AI Instructions (Optional)</Label>
                <Textarea
                  id="ai-instructions"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Custom instructions for AI in this space..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  These instructions will guide AI responses in this space
                </p>
              </div>

              {/* Default Persona - only shown in scratch mode */}
              <div>
                <Label htmlFor="persona-select">Default Persona (Optional)</Label>
                <Select 
                  value={selectedPersonaTemplateId || 'general'} 
                  onValueChange={(v) => setSelectedPersonaTemplateId(v === 'general' ? null : v)}
                >
                  <SelectTrigger id="persona-select">
                    <SelectValue placeholder="Select a persona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Assistant (Default)</SelectItem>
                    {personaTemplates.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.name}
                        {persona.is_featured && ' ⭐'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The persona defines the AI's personality and expertise
                </p>
              </div>
            </TabsContent>

            {/* Common fields for both modes */}
            <div>
              <Label htmlFor="space-name">Space Name *</Label>
              <Input
                id="space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Client Projects"
                required
              />
            </div>

            <div>
              <Label htmlFor="space-description">Description</Label>
              <Textarea
                id="space-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this space for?"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!name.trim() || isCreating || (mode === 'template' && !selectedTemplateId)}
              >
                {isCreating ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
