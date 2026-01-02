import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';

interface SpaceTemplate {
  id: string;
  name: string;
  description: string | null;
  ai_model: string | null;
  ai_instructions: string | null;
  color_code: string | null;
  compliance_rule: string | null;
  file_quota_mb: number | null;
  default_personas: any;
  default_prompts: any;
  is_featured: boolean | null;
  use_count: number | null;
}

interface ViewSpaceTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: SpaceTemplate | null;
  onCreateSpace?: (template: SpaceTemplate) => void;
}

export const ViewSpaceTemplateDialog = ({
  open,
  onOpenChange,
  template,
  onCreateSpace,
}: ViewSpaceTemplateDialogProps) => {
  if (!template) return null;

  const personas = Array.isArray(template.default_personas) ? template.default_personas : [];
  const prompts = Array.isArray(template.default_prompts) ? template.default_prompts : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {template.color_code && (
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: template.color_code }}
              />
            )}
            <DialogTitle>{template.name}</DialogTitle>
          </div>
          <DialogDescription>
            {template.description || 'No description provided'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-sm font-medium mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                {template.ai_model && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">AI Model:</span>
                    <Badge variant="secondary">{template.ai_model}</Badge>
                  </div>
                )}
                {template.file_quota_mb && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Storage Quota:</span>
                    <Badge variant="outline">{template.file_quota_mb}MB</Badge>
                  </div>
                )}
                {template.use_count !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Times Used:</span>
                    <Badge variant="outline">{template.use_count}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* AI Instructions */}
            {template.ai_instructions && (
              <div>
                <h4 className="text-sm font-medium mb-2">AI Instructions</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.ai_instructions}
                </p>
              </div>
            )}

            {/* Compliance Rule */}
            {template.compliance_rule && (
              <div>
                <h4 className="text-sm font-medium mb-2">Compliance Rule</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.compliance_rule}
                </p>
              </div>
            )}

            {/* Default Personas */}
            {personas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Default Personas</h4>
                <div className="space-y-2">
                  {personas.map((persona: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{persona.name}</div>
                      {persona.description && (
                        <div className="text-muted-foreground">{persona.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Prompts */}
            {prompts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Default Prompts</h4>
                <div className="space-y-2">
                  {prompts.map((prompt: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{prompt.title}</div>
                      {prompt.content && (
                        <div className="text-muted-foreground line-clamp-2">{prompt.content}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {onCreateSpace && (
          <DialogFooter className="mt-6">
            <Button
              onClick={() => {
                onCreateSpace(template);
                onOpenChange(false);
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Space from Template
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
