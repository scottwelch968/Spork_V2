import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, Home } from 'lucide-react';
import { FileFolder } from '@/hooks/useFiles';

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FileFolder[];
  onMove: (folderId: string | null) => void;
  currentFolderId?: string | null;
}

export function MoveFileDialog({ 
  open, 
  onOpenChange, 
  folders, 
  onMove, 
  currentFolderId 
}: MoveFileDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);

  const handleMove = () => {
    onMove(selectedFolderId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
          <DialogDescription>
            Select a folder to move this file to
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {/* Root/No Folder option */}
            <Button
              variant={selectedFolderId === null ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolderId(null)}
            >
              <Home className="h-4 w-4 mr-2" />
              Root (No Folder)
            </Button>
            
            {/* Folder list */}
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolderId(folder.id)}
                disabled={folder.id === currentFolderId}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={selectedFolderId === currentFolderId}>
            Move File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
