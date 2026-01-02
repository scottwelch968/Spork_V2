import { X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LaunchpadTabsProps {
  openFiles: string[];
  activeFile: string | null;
  modifiedFiles: Set<string>;
  onTabClick: (path: string) => void;
  onTabClose: (path: string) => void;
}

export function LaunchpadTabs({
  openFiles,
  activeFile,
  modifiedFiles,
  onTabClick,
  onTabClose
}: LaunchpadTabsProps) {
  const getFileName = (path: string) => path.split('/').pop() || path;

  const getFileIconClass = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClasses: Record<string, string> = {
      'ts': 'lp-file-ts',
      'tsx': 'lp-file-tsx',
      'js': 'lp-file-js',
      'jsx': 'lp-file-jsx',
      'css': 'lp-file-css',
      'html': 'lp-file-html',
      'json': 'lp-file-json',
      'md': 'lp-file-md'
    };
    return iconClasses[ext || ''] || '';
  };

  if (openFiles.length === 0) {
    return (
      <div className="h-9 border-b lp-tabs-bar flex items-center px-3 text-xs lp-code-empty">
        No files open
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="h-9 border-b lp-tabs-bar flex items-center">
        {openFiles.map((filePath) => {
          const fileName = getFileName(filePath);
          const isActive = activeFile === filePath;
          const isModified = modifiedFiles.has(filePath);

          return (
            <div
              key={filePath}
              className={cn(
                "group h-full flex items-center gap-1.5 px-3 border-r cursor-pointer lp-tab",
                isActive && "active"
              )}
              onClick={() => onTabClick(filePath)}
            >
              <File className={cn("h-3.5 w-3.5 shrink-0", getFileIconClass(fileName))} />
              <span className="text-xs truncate max-w-[120px]" title={filePath}>
                {fileName}
              </span>
              {isModified && (
                <span className="h-1.5 w-1.5 rounded-full lp-status-modified shrink-0" style={{ backgroundColor: 'currentColor' }} />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 lp-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(filePath);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
