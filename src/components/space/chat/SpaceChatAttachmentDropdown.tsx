import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, Paperclip, ImagePlus, BookOpen } from 'lucide-react';

interface SpaceChatAttachmentDropdownProps {
  onAddFiles: () => void;
  onGenerateImage: () => void;
  onAskKnowledgeBase: () => void;
  hasKnowledgeBase: boolean;
}

export function SpaceChatAttachmentDropdown({
  onAddFiles,
  onGenerateImage,
  onAskKnowledgeBase,
  hasKnowledgeBase,
}: SpaceChatAttachmentDropdownProps) {
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
          Add files
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onGenerateImage} className="cursor-pointer">
          <ImagePlus className="h-4 w-4 mr-2" />
          Generate image
        </DropdownMenuItem>
        {hasKnowledgeBase && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onAskKnowledgeBase} className="cursor-pointer">
              <BookOpen className="h-4 w-4 mr-2" />
              Ask Knowledge Base
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
