import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DangerZoneCardProps {
  spaceName: string;
  isArchived: boolean;
  onArchive: () => void;
  onDelete: () => void;
}

export function DangerZoneCard({ spaceName, isArchived, onArchive, onDelete }: DangerZoneCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = () => {
    if (confirmText === spaceName) {
      onDelete();
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Card className="p-6 border-destructive">
      <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div>
            <p className="font-medium">{isArchived ? 'Unarchive' : 'Archive'} Space</p>
            <p className="text-sm text-muted-foreground">
              {isArchived ? 'Restore this space to active status' : 'Hide this space from your active list'}
            </p>
          </div>
          <Button variant={isArchived ? 'default' : 'outline'} onClick={onArchive}>
            <Archive className="h-4 w-4 mr-2" />
            {isArchived ? 'Unarchive' : 'Archive'}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-destructive">
          <div>
            <p className="font-medium text-destructive">Delete Space</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete this space and all its data
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Space</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the space and all its data including chats, files, personas, and prompts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label>
              Type <span className="font-bold">{spaceName}</span> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={spaceName}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== spaceName}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Space
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
