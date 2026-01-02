import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  onReconnect: () => void;
}

export const ConnectionStatus = ({ status, onReconnect }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${
          status === 'connected' 
            ? 'bg-green-500 animate-pulse' 
            : status === 'reconnecting'
            ? 'bg-yellow-500 animate-pulse'
            : 'bg-red-500'
        }`} />
        <span className="text-sm text-muted-foreground">
          {status === 'connected' && 'Live'}
          {status === 'reconnecting' && 'Reconnecting...'}
          {status === 'disconnected' && 'Disconnected'}
        </span>
      </div>
      
      {status === 'disconnected' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReconnect}
          className="h-7"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};
