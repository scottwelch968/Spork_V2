import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiffViewerProps {
  original: string;
  modified: string;
  filePath: string;
  onAccept: () => void;
  onReject: () => void;
}

export function DiffViewer({ 
  original, 
  modified, 
  filePath, 
  onAccept, 
  onReject 
}: DiffViewerProps) {
  // Simple line-by-line diff
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  
  const diff = computeDiff(originalLines, modifiedLines);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-muted border-b flex items-center justify-between">
        <span className="text-xs font-mono">{filePath}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="h-7 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAccept}
            className="h-7 text-green-600 hover:text-green-600"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Accept
          </Button>
        </div>
      </div>

      {/* Diff content */}
      <ScrollArea className="max-h-[300px]">
        <pre className="p-3 text-xs font-mono">
          {diff.map((line, idx) => (
            <div
              key={idx}
              className={
                line.type === 'added'
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : line.type === 'removed'
                  ? 'bg-red-500/20 text-red-700 dark:text-red-400'
                  : ''
              }
            >
              <span className="inline-block w-4 text-muted-foreground">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              {line.content}
            </div>
          ))}
        </pre>
      </ScrollArea>
    </div>
  );
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

function computeDiff(original: string[], modified: string[]): DiffLine[] {
  const diff: DiffLine[] = [];
  const maxLen = Math.max(original.length, modified.length);
  
  // Simple line-by-line comparison (not optimal but works for basic cases)
  for (let i = 0; i < maxLen; i++) {
    const origLine = original[i];
    const modLine = modified[i];
    
    if (origLine === modLine) {
      diff.push({ type: 'unchanged', content: origLine || '' });
    } else {
      if (origLine !== undefined) {
        diff.push({ type: 'removed', content: origLine });
      }
      if (modLine !== undefined) {
        diff.push({ type: 'added', content: modLine });
      }
    }
  }
  
  return diff;
}
