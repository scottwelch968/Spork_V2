import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SpaceModelSelector } from '../ai-config/SpaceModelSelector';

interface EditAIModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: string | null;
  onSave: (model: string) => void;
}

export function EditAIModelDialog({ open, onOpenChange, currentModel, onSave }: EditAIModelDialogProps) {
  const [model, setModel] = useState(currentModel || '');

  const handleSave = () => {
    onSave(model);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit AI Model</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <SpaceModelSelector
            selectedModel={model}
            onModelChange={setModel}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={model === (currentModel || '')}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
