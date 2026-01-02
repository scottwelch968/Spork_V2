import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface PersonaTemplate {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  category?: string | { name: string; slug?: string; icon?: string | null };
  persona_categories?: { name: string };
  is_featured: boolean;
  use_count: number;
}

interface ViewPersonaTemplateDialogProps {
  template: PersonaTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (template: PersonaTemplate) => void;
}

export function ViewPersonaTemplateDialog({
  template,
  open,
  onOpenChange,
  onUse,
}: ViewPersonaTemplateDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div>
            <DialogTitle>{template.name}</DialogTitle>
            {template.is_featured && (
              <Badge variant="secondary" className="mt-1">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {template.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-1">Category</h4>
            <Badge variant="outline" className="capitalize">
              {typeof template.category === 'string' 
                ? template.category 
                : template.category?.name || template.persona_categories?.name || 'General'}
            </Badge>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">System Prompt</h4>
            <div className="bg-muted/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{template.system_prompt}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Used by {template.use_count} users
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onUse(template)}>
              Import to My Library
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
