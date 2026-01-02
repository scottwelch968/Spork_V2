import { Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { PromptTemplate } from '@/hooks/usePromptTemplates';

interface ViewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PromptTemplate | null;
  onSave?: (template: PromptTemplate) => void;
}

export const ViewTemplateDialog = ({
  open,
  onOpenChange,
  template,
  onSave,
}: ViewTemplateDialogProps) => {
  if (!template) return null;

  const handleSave = () => {
    if (onSave && template) {
      onSave(template);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>View Template</DialogTitle>
          <DialogDescription>
            Preview this template's content
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="view-title">Title</Label>
            <Input
              id="view-title"
              value={template.title}
              disabled
              className="bg-muted"
            />
          </div>
          {template.category && (
            <div className="grid gap-2">
              <Label htmlFor="view-category">Category</Label>
              <Input
                id="view-category"
                value={template.category.name}
                disabled
                className="bg-muted"
              />
            </div>
          )}
          {template.description && (
            <div className="grid gap-2">
              <Label htmlFor="view-description">Description</Label>
              <Input
                id="view-description"
                value={template.description}
                disabled
                className="bg-muted"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="view-content">Prompt Content</Label>
            <Textarea
              id="view-content"
              value={template.content}
              disabled
              className="min-h-[300px] bg-muted font-mono text-sm whitespace-pre-wrap"
            />
          </div>
        </div>
        {onSave && (
          <DialogFooter>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save to My Prompts
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
