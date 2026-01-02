import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

interface EditorFileTreeProps {
  files: FileTreeNode[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  onFileSelect: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

export function EditorFileTree({
  files,
  activeFile,
  modifiedFiles,
  onFileSelect,
  onCreateFile,
  onDeleteFile
}: EditorFileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/components']));
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconColors: Record<string, string> = {
      'ts': 'text-blue-500',
      'tsx': 'text-blue-500',
      'js': 'text-yellow-500',
      'jsx': 'text-yellow-500',
      'css': 'text-purple-500',
      'html': 'text-orange-500',
      'json': 'text-green-500',
      'md': 'text-gray-500'
    };
    return iconColors[ext || ''] || 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col border-r">
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center justify-between shrink-0">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Explorer</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* New file input */}
      {isCreating && (
        <div className="px-2 py-2 border-b">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            onBlur={() => setIsCreating(false)}
            placeholder="path/to/file.tsx"
            className="h-7 text-xs"
            autoFocus
          />
        </div>
      )}

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {files.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              level={0}
              activeFile={activeFile}
              modifiedFiles={modifiedFiles}
              expandedFolders={expandedFolders}
              onToggle={toggleFolder}
              onSelect={onFileSelect}
              onDelete={onDeleteFile}
              getFileIcon={getFileIcon}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  activeFile: string | null;
  modifiedFiles: Set<string>;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
  getFileIcon: (name: string) => string;
}

function TreeNode({
  node,
  level,
  activeFile,
  modifiedFiles,
  expandedFolders,
  onToggle,
  onSelect,
  onDelete,
  getFileIcon
}: TreeNodeProps) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFile === node.path;
  const isModified = modifiedFiles.has(node.path);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className={cn(
            "w-full flex items-center gap-1 px-2 py-1 rounded text-sm hover:bg-muted transition-colors",
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                level={level + 1}
                activeFile={activeFile}
                modifiedFiles={modifiedFiles}
                expandedFolders={expandedFolders}
                onToggle={onToggle}
                onSelect={onSelect}
                onDelete={onDelete}
                getFileIcon={getFileIcon}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={() => onSelect(node.path)}
          className={cn(
            "w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm hover:bg-muted transition-colors",
            isActive && "bg-muted"
          )}
          style={{ paddingLeft: `${level * 12 + 24}px` }}
        >
          <File className={cn("h-4 w-4 shrink-0", getFileIcon(node.name))} />
          <span className="truncate flex-1 text-left">{node.name}</span>
          {isModified && (
            <span className="h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onDelete(node.path)} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
