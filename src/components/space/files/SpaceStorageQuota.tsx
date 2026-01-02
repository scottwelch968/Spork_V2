import { Progress } from '@/components/ui/progress';
import { HardDrive } from 'lucide-react';

interface SpaceStorageQuotaProps {
  usedMb: number;
  quotaMb: number;
}

export function SpaceStorageQuota({ usedMb, quotaMb }: SpaceStorageQuotaProps) {
  const percentage = (usedMb / quotaMb) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="flex items-center gap-4">
      <HardDrive className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Storage</span>
          <span className={`text-sm ${isNearLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {usedMb.toFixed(2)} MB / {quotaMb} MB
          </span>
        </div>
        <Progress 
          value={percentage} 
          className={isNearLimit ? '[&>div]:bg-destructive' : ''} 
        />
      </div>
    </div>
  );
}
