import { Button } from '@/admin/ui';
import { RefreshCw } from 'lucide-react';

interface ConnectionStatusProps {
  status: 'connected' | 'reconnecting' | 'disconnected';
  onReconnect: () => void;
}

export const ConnectionStatus = ({ status, onReconnect }: ConnectionStatusProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${status === 'connected'
          ? 'bg-admin-success animate-pulse'
          : status === 'reconnecting'
            ? 'bg-admin-warning animate-pulse'
            : 'bg-admin-error'
          }`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">
          {status === 'connected' && 'Live'}
          {status === 'reconnecting' && 'Reconnecting...'}
          {status === 'disconnected' && 'Disconnected'}
        </span>
      </div>

      {status === 'disconnected' && (
        <Button
          variant="ghost"
          size="xs"
          className="text-[10px] font-bold uppercase tracking-widest text-admin-accent hover:text-admin-accent/80 h-auto py-0"
          onClick={onReconnect}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
};
