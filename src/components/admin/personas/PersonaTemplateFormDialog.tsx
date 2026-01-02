import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonaTemplate, PersonaCategory } from '@/hooks/useAdminPersonas';
import { ColorPicker } from '@/components/admin/shared/ColorPicker';
import { TemplateImageGalleryPicker } from '@/components/admin/shared/TemplateImageGalleryPicker';

interface PersonaTemplateFormDialogProps {
  template?: PersonaTemplate | null;
  categories: PersonaCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Omit<PersonaTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'use_count' | 'persona_categories'>) => void;
}

export function PersonaTemplateFormDialog({ 
  template,
  categories,
  open, 
  onOpenChange, 
  onSave 
}: PersonaTemplateFormDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [colorCode, setColorCode] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setSystemPrompt(template.system_prompt);
      setCategoryId(template.category_id || '');
      setIsActive(template.is_active);
      setIsFeatured(template.is_featured);
      setImageUrl(template.image_url || null);
      setColorCode(template.color_code || null);
    } else {
      setName('');
      setDescription('');
      setSystemPrompt('');
      setCategoryId(categories.find(c => c.slug === 'general')?.id || categories[0]?.id || '');
      setIsActive(true);
      setIsFeatured(false);
      setImageUrl(null);
      setColorCode(null);
    }
  }, [template, open, categories]);

  const handleSubmit = () => {
    if (!name.trim() || !systemPrompt.trim()) {
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      system_prompt: systemPrompt.trim(),
      icon: null,
      category_id: categoryId || null,
      is_active: isActive,
      is_featured: isFeatured,
      is_default_for_users: template?.is_default_for_users || false,
      is_default_for_spaces: template?.is_default_for_spaces || false,
      image_url: imageUrl,
      color_code: colorCode,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Persona Template' : 'Create Persona Template'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Code Assistant"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this persona"
            />
          </div>

          {/* Avatar selection with gallery */}
          <TemplateImageGalleryPicker
            value={imageUrl}
            onChange={setImageUrl}
            folder="templates/personas"
            label="Avatar"
          />

          {/* Color picker */}
          <ColorPicker
            value={colorCode}
            onChange={setColorCode}
            label="Card Background Color"
          />

          <div>
            <Label htmlFor="system-prompt">System Prompt *</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter the system prompt that defines this persona's behavior..."
              className="min-h-[150px]"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => c.is_active).map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured</Label>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!name.trim() || !systemPrompt.trim()}
            >
              {template ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
