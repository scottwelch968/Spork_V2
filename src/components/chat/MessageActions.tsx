import { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { SaveResponseButton } from './SaveResponseButton';

interface MessageActionsProps {
  content: string;
  messageIndex: number;
  chatTitle?: string;
  isSpaceChat?: boolean;
  spaceId?: string;
  onRegenerate?: () => void;
}

export function MessageActions({
  content,
  messageIndex,
  chatTitle,
  isSpaceChat = false,
  spaceId,
  onRegenerate,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(liked === true ? null : true);
    if (liked !== true) {
      toast.success('Thanks for your feedback!');
    }
  };

  const handleDislike = () => {
    setLiked(liked === false ? null : false);
    if (liked !== false) {
      toast.success('Thanks for your feedback!');
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-0.5">
          {/* Copy */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{copied ? 'Copied!' : 'Copy'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Save */}
          <SaveResponseButton
            messageContent={content}
            chatTitle={chatTitle}
            isSpaceChat={isSpaceChat}
            spaceId={spaceId}
            iconOnly
          />

          {/* Like */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`h-8 w-8 p-0 ${liked === true ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Good response</p>
            </TooltipContent>
          </Tooltip>

          {/* Dislike */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                className={`h-8 w-8 p-0 ${liked === false ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Poor response</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Regenerate */}
        {onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-8 px-3 text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="text-xs">Regenerate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Generate a new response</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
