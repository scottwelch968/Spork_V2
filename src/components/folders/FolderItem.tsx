import { useState } from 'react';
import { Folder as FolderIcon, ChevronRight, ChevronDown, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Folder } from '@/hooks/useFolders';
import { useDroppable } from '@dnd-kit/core';

interface FolderItemProps {
  folder: Folder;
  chatCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export const FolderItem = ({
  folder,
  chatCount,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  children,
}: FolderItemProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
          isOver ? 'bg-primary/20 border-2 border-primary' : 'hover:bg-muted'
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={onToggle}
        >
          <FolderIcon
            className="h-4 w-4 flex-shrink-0"
            style={{ color: folder.color || 'currentColor' }}
          />
          <span className="text-sm truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground">({chatCount})</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover z-50">
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && children && (
        <div className="ml-6 space-y-1">{children}</div>
      )}
    </div>
  );
};
