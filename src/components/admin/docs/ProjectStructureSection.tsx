import { Folder, File, FolderOpen } from 'lucide-react';
import type { ProjectFile } from '@/utils/generateDocumentation';

interface ProjectStructureSectionProps {
  structure: ProjectFile[];
}

function FileTreeItem({ item, depth = 0 }: { item: ProjectFile; depth?: number }) {
  const isFolder = item.type === 'folder';
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="font-mono text-sm">
      <div 
        className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {isFolder ? (
          hasChildren ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )
        ) : (
          <File className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={isFolder ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          {item.name}
        </span>
        {item.description && (
          <span className="text-xs text-muted-foreground ml-2">— {item.description}</span>
        )}
      </div>
      {hasChildren && (
        <div>
          {item.children!.map((child, index) => (
            <FileTreeItem key={`${child.name}-${index}`} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectStructureSection({ structure }: ProjectStructureSectionProps) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="space-y-1">
        {structure.map((item, index) => (
          <FileTreeItem key={`${item.name}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
