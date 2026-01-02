import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface EditAIInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentInstructions: string | null;
  onSave: (instructions: string) => void;
}

export function EditAIInstructionsDialog({ open, onOpenChange, currentInstructions, onSave }: EditAIInstructionsDialogProps) {
  const [instructions, setInstructions] = useState(currentInstructions || '');

  const handleSave = () => {
    onSave(instructions.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit AI Instructions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">AI Instructions</Label>
            <p className="text-sm text-muted-foreground">
              Set custom instructions for AI behavior in this space
            </p>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter AI instructions for this space..."
              className="min-h-[150px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={instructions === (currentInstructions || '')}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
