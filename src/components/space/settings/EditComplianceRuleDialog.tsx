import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface EditComplianceRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRule: string | null;
  onSave: (rule: string) => void;
}

export function EditComplianceRuleDialog({ open, onOpenChange, currentRule, onSave }: EditComplianceRuleDialogProps) {
  const [rule, setRule] = useState(currentRule || '');

  const handleSave = () => {
    onSave(rule.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Compliance Rule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Compliance rules define data handling and content restrictions for this space. These rules are enforced in all AI interactions.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="compliance">Compliance Rule</Label>
            <Textarea
              id="compliance"
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              placeholder="Enter compliance requirements (e.g., HIPAA, GDPR, no PII storage)..."
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={rule === (currentRule || '')}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
