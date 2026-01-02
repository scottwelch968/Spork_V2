import { AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface StorageQuotaWarningProps {
  warningLevel: '80%' | '95%' | '100%' | null;
  usedMb: number;
  quotaMb: number | null;
  showUpgradeButton?: boolean;
}

export function StorageQuotaWarning({ 
  warningLevel, 
  usedMb, 
  quotaMb, 
  showUpgradeButton = true 
}: StorageQuotaWarningProps) {
  const navigate = useNavigate();

  if (!warningLevel || quotaMb === null) return null;

  const config = {
    '80%': {
      variant: 'default' as const,
      icon: AlertTriangle,
      iconClass: 'text-yellow-600',
      bgClass: 'border-yellow-200 bg-yellow-50',
      title: 'Approaching Storage Limit',
      description: `You've used ${usedMb.toFixed(1)} MB of your ${quotaMb} MB storage quota.`,
    },
    '95%': {
      variant: 'default' as const,
      icon: AlertCircle,
      iconClass: 'text-orange-600',
      bgClass: 'border-orange-200 bg-orange-50',
      title: 'Storage Almost Full',
      description: `You've used ${usedMb.toFixed(1)} MB of your ${quotaMb} MB storage quota. Consider deleting files or upgrading.`,
    },
    '100%': {
      variant: 'destructive' as const,
      icon: XCircle,
      iconClass: 'text-destructive',
      bgClass: 'border-destructive/20 bg-destructive/5',
      title: 'Storage Full',
      description: `Your storage is full (${usedMb.toFixed(1)} MB / ${quotaMb} MB). Delete files or upgrade to continue uploading.`,
    },
  };

  const { icon: Icon, iconClass, bgClass, title, description } = config[warningLevel];

  return (
    <Alert className={bgClass}>
      <Icon className={`h-4 w-4 ${iconClass}`} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{description}</span>
        {showUpgradeButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/billing')}
          >
            Upgrade Plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
