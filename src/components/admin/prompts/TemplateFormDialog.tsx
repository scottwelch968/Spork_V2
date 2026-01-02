import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminPromptTemplates } from '@/hooks/useAdminPromptTemplates';
import { ColorPicker } from '@/components/admin/shared/ColorPicker';
import { DisplayModeSelector } from '@/components/admin/shared/DisplayModeSelector';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  categories: any[];
}

export const TemplateFormDialog = ({
  open,
  onOpenChange,
  template,
  categories,
}: TemplateFormDialogProps) => {
  const { createTemplate, updateTemplate } = useAdminPromptTemplates();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    category_id: '',
    is_featured: false,
    is_active: true,
    display_mode: 'icon' as 'icon' | 'image',
    icon: 'FileText' as string | null,
    image_url: null as string | null,
    color_code: null as string | null,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || '',
        content: template.content || '',
        description: template.description || '',
        category_id: template.category_id || '',
        is_featured: template.is_featured || false,
        is_active: template.is_active ?? true,
        display_mode: template.display_mode || 'icon',
        icon: template.icon || 'FileText',
        image_url: template.image_url || null,
        color_code: template.color_code || null,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        description: '',
        category_id: '',
        is_featured: false,
        is_active: true,
        display_mode: 'icon',
        icon: 'FileText',
        image_url: null,
        color_code: null,
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (template) {
        await updateTemplate(template.id, formData);
      } else {
        await createTemplate(formData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Add Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description for the card"
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
            folder="templates/prompts"
            templateName={formData.title}
          />

          {/* Color Picker */}
          <ColorPicker
            value={formData.color_code}
            onChange={(color) => setFormData({ ...formData, color_code: color })}
            label="Card Background Color"
          />

          <div className="space-y-2">
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="featured">Featured Template</Label>
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_featured: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {template ? 'Update' : 'Create'} Template
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};