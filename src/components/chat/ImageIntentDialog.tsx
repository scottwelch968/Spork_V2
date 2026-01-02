import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Image } from 'lucide-react';

interface ImageIntentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  selectedModelName: string;
  imageModelName: string;
  onContinueWithChat: () => void;
  onGenerateImage: () => void;
}

export function ImageIntentDialog({
  open,
  onOpenChange,
  message,
  selectedModelName,
  imageModelName,
  onContinueWithChat,
  onGenerateImage,
}: ImageIntentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Image?</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your message looks like an image request.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm italic line-clamp-2">"{message}"</p>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={onContinueWithChat}
            >
              <MessageSquare className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Continue with {selectedModelName}</div>
                <div className="text-xs text-muted-foreground">Get a text response</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 border-primary/50 hover:bg-primary/5"
              onClick={onGenerateImage}
            >
              <Image className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Generate with {imageModelName}</div>
                <div className="text-xs text-muted-foreground">Create an actual image</div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
