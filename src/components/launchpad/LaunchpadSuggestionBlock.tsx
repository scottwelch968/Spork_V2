import { useState } from 'react';
import { Copy, Check, FileCode, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LaunchpadSuggestionBlockProps {
  filePath: string;
  content: string;
  action: 'create' | 'edit' | 'delete';
  onApply: () => void;
}

export function LaunchpadSuggestionBlock({ 
  filePath, 
  content, 
  action, 
  onApply 
}: LaunchpadSuggestionBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionIcon = () => {
    switch (action) {
      case 'create':
        return <Plus className="h-3 w-3" />;
      case 'edit':
        return <Pencil className="h-3 w-3" />;
      case 'delete':
        return <Trash2 className="h-3 w-3" />;
    }
  };

  const getActionClass = () => {
    switch (action) {
      case 'create':
        return 'lp-suggestion-action-create';
      case 'edit':
        return 'lp-suggestion-action-edit';
      case 'delete':
        return 'lp-suggestion-action-delete';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden lp-suggestion-block">
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center justify-between lp-suggestion-header">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 lp-suggestion-filepath" />
          <span className="text-xs font-mono lp-suggestion-filepath">{filePath}</span>
          <span className={cn("text-xs px-1.5 py-0.5 rounded flex items-center gap-1", getActionClass())}>
            {getActionIcon()}
            {action}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 mr-1" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onApply}
            className="h-7"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Code content */}
      {action !== 'delete' && (
        <ScrollArea className="max-h-[200px]">
          <pre className="p-3 text-xs font-mono overflow-x-auto lp-suggestion-code">
            <code>{content}</code>
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}
