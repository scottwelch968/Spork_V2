import { useState, useEffect } from 'react';
import { useAdminSpaces } from '@/hooks/useAdminSpaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useModels } from '@/hooks/useModels';
import { usePersonaTemplates } from '@/hooks/usePersonaTemplates';
import { ColorPicker } from '@/components/admin/shared/ColorPicker';
import { DisplayModeSelector } from '@/components/admin/shared/DisplayModeSelector';

interface SpaceTemplateFormDialogProps {
  template: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpaceTemplateFormDialog({ template, open, onOpenChange }: SpaceTemplateFormDialogProps) {
  const { createTemplate, updateTemplate, categories } = useAdminSpaces();
  const { models } = useModels();
  const { templates: personaTemplates, loading: personasLoading } = usePersonaTemplates();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    ai_model: '',
    ai_instructions: '',
    compliance_rule: '',
    file_quota_mb: 1000,
    is_active: true,
    is_featured: false,
    default_personas: [] as any[],
    display_mode: 'icon' as 'icon' | 'image',
    icon: 'Boxes' as string | null,
    image_url: null as string | null,
    color_code: null as string | null,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        category_id: template.category_id || '',
        ai_model: template.ai_model || '',
        ai_instructions: template.ai_instructions || '',
        compliance_rule: template.compliance_rule || '',
        file_quota_mb: template.file_quota_mb || 1000,
        is_active: template.is_active !== false,
        is_featured: template.is_featured || false,
        default_personas: template.default_personas || [],
        display_mode: template.display_mode || 'icon',
        icon: template.icon || 'Boxes',
        image_url: template.image_url || null,
        color_code: template.color_code || null,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category_id: '',
        ai_model: '',
        ai_instructions: '',
        compliance_rule: '',
        file_quota_mb: 1000,
        is_active: true,
        is_featured: false,
        default_personas: [],
        display_mode: 'icon',
        icon: 'Boxes',
        image_url: null,
        color_code: null,
      });
    }
  }, [template, open]);

  const handlePersonaToggle = (persona: any, checked: boolean) => {
    if (checked) {
      const newPersona = {
        template_id: persona.id,
        name: persona.name,
        description: persona.description,
        system_prompt: persona.system_prompt,
        icon: persona.icon,
        is_default: formData.default_personas.length === 0
      };
      setFormData({
        ...formData,
        default_personas: [...formData.default_personas, newPersona]
      });
    } else {
      const updated = formData.default_personas.filter(p => p.template_id !== persona.id);
      if (updated.length > 0 && !updated.some(p => p.is_default)) {
        updated[0].is_default = true;
      }
      setFormData({
        ...formData,
        default_personas: updated
      });
    }
  };

  const isPersonaSelected = (personaId: string) => {
    return formData.default_personas.some(p => p.template_id === personaId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (template?.id) {
        updateTemplate({ id: template.id, ...formData });
      } else {
        createTemplate(formData);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit Template' : 'Create Template'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marketing Team, Engineering Team"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this template..."
              rows={3}
            />
          </div>

          {/* Display Mode Selector */}
          <DisplayModeSelector
            displayMode={formData.display_mode}
            icon={formData.icon}
            imageUrl={formData.image_url}
            onDisplayModeChange={(mode) => setFormData({ ...formData, display_mode: mode })}
            onIconChange={(icon) => setFormData({ ...formData, icon })}
            onImageChange={(url) => setFormData({ ...formData, image_url: url })}
            folder="templates/spaces"
            templateName={formData.name}
          />

          {/* Color Picker */}
          <ColorPicker
            value={formData.color_code}
            onChange={(color) => setFormData({ ...formData, color_code: color })}
            label="Card Background Color"
          />

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.filter(c => c.is_active).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_model">Default AI Model</Label>
            <Select
              value={formData.ai_model}
              onValueChange={(value) => setFormData({ ...formData, ai_model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models?.filter(m => m.is_active).map((model) => (
                  <SelectItem key={model.id} value={model.model_id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_quota_mb">File Quota (MB)</Label>
            <Input
              id="file_quota_mb"
              type="number"
              value={formData.file_quota_mb}
              onChange={(e) => setFormData({ ...formData, file_quota_mb: parseInt(e.target.value) })}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_instructions">AI Instructions</Label>
            <Textarea
              id="ai_instructions"
              value={formData.ai_instructions}
              onChange={(e) => setFormData({ ...formData, ai_instructions: e.target.value })}
              placeholder="Custom AI instructions for this space..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Personas</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select personas to be automatically created when a space uses this template.
            </p>
            <div className="border border-border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto bg-background">
              {personasLoading ? (
                <p className="text-sm text-muted-foreground">Loading personas...</p>
              ) : personaTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No persona templates available</p>
              ) : (
                personaTemplates.map((persona) => (
                  <div key={persona.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`persona-${persona.id}`}
                      checked={isPersonaSelected(persona.id)}
                      onCheckedChange={(checked) => handlePersonaToggle(persona, !!checked)}
                    />
                    <Label htmlFor={`persona-${persona.id}`} className="cursor-pointer text-sm font-normal">
                      {persona.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="compliance_rule">Compliance Rule</Label>
            <Textarea
              id="compliance_rule"
              value={formData.compliance_rule}
              onChange={(e) => setFormData({ ...formData, compliance_rule: e.target.value })}
              placeholder="Compliance rules for this space..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Saving...' : template?.id ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}