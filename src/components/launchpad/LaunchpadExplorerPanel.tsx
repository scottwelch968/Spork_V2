import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Search, Loader2, Github, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

interface LaunchpadExplorerPanelProps {
  files: FileTreeNode[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  onFileSelect: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  isLoading?: boolean;
  storageMode?: 'github' | 'database';
}

export function LaunchpadExplorerPanel({
  files,
  activeFile,
  modifiedFiles,
  onFileSelect,
  onCreateFile,
  onDeleteFile,
  isLoading = false,
  storageMode = 'database'
}: LaunchpadExplorerPanelProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/components']));
  const [searchQuery, setSearchQuery] = useState('');

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

  const getFileIconClass = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const iconClasses: Record<string, string> = {
      'tsx': 'lp-file-tsx',
      'ts': 'lp-file-ts',
      'jsx': 'lp-file-jsx',
      'js': 'lp-file-js',
      'css': 'lp-file-css',
      'scss': 'lp-file-css',
      'html': 'lp-file-html',
      'json': 'lp-file-json',
      'md': 'lp-file-md',
      'sql': 'lp-file-json'
    };
    return iconClasses[ext || ''] || '';
  };

  const filterFiles = (nodes: FileTreeNode[], query: string): FileTreeNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce<FileTreeNode[]>((acc, node) => {
      if (node.type === 'file') {
        if (node.name.toLowerCase().includes(query.toLowerCase())) {
          acc.push(node);
        }
      } else if (node.children) {
        const filteredChildren = filterFiles(node.children, query);
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = node.path === activeFile;
    const isModified = modifiedFiles.has(node.path);

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer lp-explorer-item rounded-md group"
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 lp-explorer-folder-icon shrink-0" />
            ) : (
              <Folder className="h-4 w-4 lp-explorer-folder-icon shrink-0" />
            )}
            <span className="text-sm truncate flex-1">{node.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                const fileName = prompt('Enter file name:');
                if (fileName) {
                  onCreateFile(`${node.path}/${fileName}`);
                }
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={cn(
          "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md group lp-explorer-item",
          isActive && "active"
        )}
        style={{ paddingLeft: `${depth * 16 + 28}px` }}
        onClick={() => onFileSelect(node.path)}
      >
        <File className={cn("h-4 w-4 shrink-0", getFileIconClass(node.name))} />
        <span className="text-sm truncate flex-1">
          {node.name}
          {isModified && <span className="lp-status-modified ml-1">●</span>}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${node.name}?`)) {
              onDeleteFile(node.path);
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const filteredFiles = filterFiles(files, searchQuery);

  return (
    <div className="h-full flex flex-col lp-explorer">
      {/* Header with search */}
      <div className="p-4 border-b lp-explorer-header space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide lp-explorer-title">
            Explorer
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const fileName = prompt('Enter file path (e.g., src/components/NewFile.tsx):');
              if (fileName) {
                onCreateFile(fileName);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            New File
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 lp-explorer-search"
          />
        </div>
      </div>

      {/* File tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 lp-code-empty">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading files from {storageMode === 'github' ? 'GitHub' : 'database'}...</p>
            </div>
          ) : filteredFiles.length > 0 ? (
            filteredFiles.map(node => renderNode(node))
          ) : (
            <div className="text-center lp-code-empty text-sm py-8">
              {searchQuery ? 'No files match your search' : 'No files in project'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer stats */}
      <div className="p-3 border-t lp-explorer-footer text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {storageMode === 'github' ? (
            <Github className="h-3 w-3" />
          ) : (
            <Database className="h-3 w-3" />
          )}
          <span>{files.length} items</span>
        </div>
        {modifiedFiles.size > 0 && (
          <span className="lp-status-modified">{modifiedFiles.size} modified</span>
        )}
      </div>
    </div>
  );
}
