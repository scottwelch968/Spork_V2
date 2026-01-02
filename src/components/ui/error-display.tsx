import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  message = 'Something went wrong', 
  onRetry,
  className = ''
}: ErrorDisplayProps) {
  return (
    <div className={`p-4 rounded-lg bg-destructive/10 border border-destructive/20 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-destructive text-sm">{message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry} 
              className="mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
