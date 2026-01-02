import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  GitCommit, 
  RotateCcw, 
  ExternalLink, 
  User, 
  Calendar,
  FileText
} from 'lucide-react';
import { CommitInfo } from '@/hooks/useGitHubSync';
import { formatDistanceToNow } from 'date-fns';

interface GitHistoryPanelProps {
  history: CommitInfo[];
  isLoading: boolean;
  onRestore?: (commit: CommitInfo) => void;
  activeFile?: string | null;
  fileHistory?: CommitInfo[];
  isLoadingFileHistory?: boolean;
}

export function GitHistoryPanel({
  history,
  isLoading,
  onRestore,
  activeFile,
  fileHistory,
  isLoadingFileHistory
}: GitHistoryPanelProps) {
  const displayHistory = activeFile && fileHistory ? fileHistory : history;
  const displayLoading = activeFile ? isLoadingFileHistory : isLoading;

  if (displayLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (displayHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <GitCommit className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No commit history</p>
        {activeFile && (
          <p className="text-xs mt-1">for {activeFile}</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {activeFile && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{activeFile}</span>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {displayHistory.map((commit, index) => (
            <div
              key={commit.sha}
              className="group p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <GitCommit className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {commit.message}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {commit.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {commit.sha.substring(0, 7)}
                    </Badge>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onRestore && index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => onRestore(commit)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open(commit.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
