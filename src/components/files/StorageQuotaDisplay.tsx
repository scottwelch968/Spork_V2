import { HardDrive } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface StorageQuotaDisplayProps {
  usedMb: number;
  quotaMb: number | null;
  percentage: number;
  isLoading?: boolean;
}

export function StorageQuotaDisplay({ 
  usedMb, 
  quotaMb, 
  percentage,
  isLoading = false 
}: StorageQuotaDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <HardDrive className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 min-w-[200px]">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    );
  }

  const isNearLimit = percentage > 80;
  const isCritical = percentage > 95;

  const getProgressColor = () => {
    if (isCritical) return '[&>div]:bg-destructive';
    if (isNearLimit) return '[&>div]:bg-orange-500';
    return '';
  };

  const getTextColor = () => {
    if (isCritical) return 'text-destructive';
    if (isNearLimit) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center gap-4">
      <HardDrive className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Storage</span>
          <span className={`text-sm ${getTextColor()}`}>
            {usedMb.toFixed(1)} MB {quotaMb !== null ? `/ ${quotaMb} MB` : '(Unlimited)'}
          </span>
        </div>
        {quotaMb !== null && (
          <Progress 
            value={Math.min(percentage, 100)} 
            className={getProgressColor()} 
          />
        )}
      </div>
    </div>
  );
}
