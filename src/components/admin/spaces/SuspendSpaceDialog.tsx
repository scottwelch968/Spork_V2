import { useState } from 'react';
import { useAdminSpaces } from '@/hooks/useAdminSpaces';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SuspendSpaceDialogProps {
  space: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendSpaceDialog({ space, open, onOpenChange }: SuspendSpaceDialogProps) {
  const { suspendSpace, unsuspendSpace } = useAdminSpaces();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const isSuspended = space?.is_suspended;

  const handleSubmit = async () => {
    if (!space) return;
    
    setLoading(true);
    try {
      if (isSuspended) {
        unsuspendSpace(space.id);
      } else {
        suspendSpace({ spaceId: space.id, reason });
      }
      onOpenChange(false);
      setReason('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isSuspended ? 'Unsuspend Space' : 'Suspend Space'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {isSuspended
                ? 'Are you sure you want to unsuspend this space? Members will regain access.'
                : 'Suspending this space will prevent all members from accessing it.'}
            </p>
            <p className="text-sm font-medium mt-2">Space: {space?.name}</p>
          </div>

          {!isSuspended && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for suspension</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for suspending this space..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (!isSuspended && !reason.trim())}
            variant={isSuspended ? 'default' : 'destructive'}
          >
            {loading ? 'Processing...' : isSuspended ? 'Unsuspend' : 'Suspend Space'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
