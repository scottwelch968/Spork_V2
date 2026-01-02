import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, Paperclip, ImagePlus } from 'lucide-react';

interface AttachmentDropdownProps {
  onAddFiles: () => void;
  onGenerateImage: () => void;
}

export function AttachmentDropdown({ onAddFiles, onGenerateImage }: AttachmentDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-card">
        <DropdownMenuItem onClick={onAddFiles} className="cursor-pointer">
          <Paperclip className="h-4 w-4 mr-2" />
          Add images or files
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGenerateImage} className="cursor-pointer">
          <ImagePlus className="h-4 w-4 mr-2" />
          Generate image
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
