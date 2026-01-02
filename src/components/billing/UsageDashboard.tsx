import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Image, 
  Video, 
  FileText, 
  HardDrive, 
  Coins,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { formatBytes, getUsageStatusColor, getProgressColorClass } from '@/utils/formatBytes';
import { cn } from '@/lib/utils';

export interface UsageData {
  // Monthly usage
  tokens_input_used: number;
  tokens_output_used: number;
  tokens_input_quota: number | null;
  tokens_output_quota: number | null;
  images_generated: number;
  images_quota: number | null;
  videos_generated: number;
  videos_quota: number | null;
  documents_parsed: number;
  documents_quota: number | null;
  // Daily usage
  daily_tokens_input_used: number;
  daily_tokens_output_used: number;
  daily_images_used: number;
  daily_videos_used: number;
  daily_reset_at: string | null;
  // Storage
  file_storage_used_bytes: number;
  file_storage_quota_bytes: number | null;
  // Credits
  token_credits_remaining: number | null;
  image_credits_remaining: number | null;
  video_credits_remaining: number | null;
  // Meta
  period_start: string;
  period_end: string;
  last_usage_at: string | null;
}

interface UsageDashboardProps {
  usage: UsageData | null;
  isSuperUser: boolean;
  formatCredits: (value: number | null) => string;
}

export function UsageDashboard({ usage, isSuperUser, formatCredits }: UsageDashboardProps) {
  const getUsagePercentage = (used: number, quota: number | null) => {
    if (!quota || quota === 0) return isSuperUser ? 0 : 0;
    return Math.min((used / quota) * 100, 100);
  };

  const totalTokensUsed = (usage?.tokens_input_used || 0) + (usage?.tokens_output_used || 0);
  const totalTokensQuota = (usage?.tokens_input_quota || 0) + (usage?.tokens_output_quota || 0);
  const dailyTokensUsed = (usage?.daily_tokens_input_used || 0) + (usage?.daily_tokens_output_used || 0);

  const storagePercentage = getUsagePercentage(
    usage?.file_storage_used_bytes || 0,
    usage?.file_storage_quota_bytes
  );

  const usageMetrics = [
    {
      label: 'Chat Tokens',
      icon: MessageSquare,
      iconColor: 'text-blue-500',
      used: totalTokensUsed,
      quota: totalTokensQuota,
      dailyUsed: dailyTokensUsed,
      format: (v: number) => v.toLocaleString(),
      credits: usage?.token_credits_remaining,
    },
    {
      label: 'Images',
      icon: Image,
      iconColor: 'text-purple-500',
      used: usage?.images_generated || 0,
      quota: usage?.images_quota,
      dailyUsed: usage?.daily_images_used || 0,
      format: (v: number) => v.toString(),
      credits: usage?.image_credits_remaining,
    },
    {
      label: 'Videos',
      icon: Video,
      iconColor: 'text-pink-500',
      used: usage?.videos_generated || 0,
      quota: usage?.videos_quota,
      dailyUsed: usage?.daily_videos_used || 0,
      format: (v: number) => v.toString(),
      credits: usage?.video_credits_remaining,
    },
    {
      label: 'Documents',
      icon: FileText,
      iconColor: 'text-green-500',
      used: usage?.documents_parsed || 0,
      quota: usage?.documents_quota,
      dailyUsed: 0,
      format: (v: number) => v.toString(),
      credits: null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Billing Period Info */}
      <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            Billing Period: {usage?.period_start ? format(new Date(usage.period_start), 'MMM dd') : 'N/A'} - {usage?.period_end ? format(new Date(usage.period_end), 'MMM dd, yyyy') : 'N/A'}
          </span>
        </div>
        {usage?.last_usage_at && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Last Activity: {format(new Date(usage.last_usage_at), 'MMM dd, h:mm a')}</span>
          </div>
        )}
        {isSuperUser && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <TrendingUp className="h-3 w-3 mr-1" />
            Super User - Unlimited
          </Badge>
        )}
      </div>

      {/* Main Usage Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {usageMetrics.map((metric) => {
          const percentage = getUsagePercentage(metric.used, metric.quota);
          const IconComponent = metric.icon;
          
          return (
            <Card key={metric.label} className="relative overflow-hidden">
              {percentage >= 80 && !isSuperUser && (
                <div className="absolute top-2 right-2">
                  <AlertTriangle className={cn("h-4 w-4", percentage >= 95 ? "text-destructive" : "text-yellow-500")} />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <IconComponent className={cn("h-4 w-4", metric.iconColor)} />
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{metric.format(metric.used)}</span>
                    <span className="text-sm text-muted-foreground">
                      / {isSuperUser ? '∞' : (metric.quota ? metric.format(metric.quota) : '0')}
                    </span>
                  </div>
                  {!isSuperUser && metric.quota && (
                    <Progress 
                      value={percentage} 
                      className={cn("h-2 mt-2", getProgressColorClass(percentage))}
                    />
                  )}
                </div>
                
                {/* Daily Usage */}
                {metric.dailyUsed > 0 && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Today: <span className="font-medium text-foreground">{metric.format(metric.dailyUsed)}</span>
                  </div>
                )}
                
                {/* Credits Remaining */}
                {(isSuperUser || (metric.credits !== null && metric.credits > 0)) && (
                  <div className="pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Credits: </span>
                    <span className="font-medium text-primary">{formatCredits(metric.credits)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Storage Card */}
        <Card className="relative overflow-hidden">
          {storagePercentage >= 80 && !isSuperUser && (
            <div className="absolute top-2 right-2">
              <AlertTriangle className={cn("h-4 w-4", storagePercentage >= 95 ? "text-destructive" : "text-yellow-500")} />
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {formatBytes(usage?.file_storage_used_bytes || 0)}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {isSuperUser ? '∞' : (usage?.file_storage_quota_bytes ? formatBytes(usage.file_storage_quota_bytes) : '0 B')}
                </span>
              </div>
              {!isSuperUser && usage?.file_storage_quota_bytes && (
                <Progress 
                  value={storagePercentage} 
                  className={cn("h-2 mt-2", getProgressColorClass(storagePercentage))}
                />
              )}
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              {storagePercentage.toFixed(1)}% used
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Token Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Token Usage Breakdown</CardTitle>
            <CardDescription>Input vs Output tokens this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Input Tokens</span>
                <span className="text-sm text-muted-foreground">
                  {(usage?.tokens_input_used || 0).toLocaleString()} / {isSuperUser ? '∞' : (usage?.tokens_input_quota?.toLocaleString() || '0')}
                </span>
              </div>
              {!isSuperUser && (
                <Progress 
                  value={getUsagePercentage(usage?.tokens_input_used || 0, usage?.tokens_input_quota)} 
                  className={cn("h-2", getProgressColorClass(getUsagePercentage(usage?.tokens_input_used || 0, usage?.tokens_input_quota)))}
                />
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Output Tokens</span>
                <span className="text-sm text-muted-foreground">
                  {(usage?.tokens_output_used || 0).toLocaleString()} / {isSuperUser ? '∞' : (usage?.tokens_output_quota?.toLocaleString() || '0')}
                </span>
              </div>
              {!isSuperUser && (
                <Progress 
                  value={getUsagePercentage(usage?.tokens_output_used || 0, usage?.tokens_output_quota)} 
                  className={cn("h-2", getProgressColorClass(getUsagePercentage(usage?.tokens_output_used || 0, usage?.tokens_output_quota)))}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credits Balance Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Credits Balance</CardTitle>
            </div>
            <CardDescription>
              {isSuperUser ? 'Unlimited access to all features' : 'Available credits beyond subscription quota'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Tokens</p>
                <p className="text-xl font-bold">{formatCredits(usage?.token_credits_remaining ?? null)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Images</p>
                <p className="text-xl font-bold">{formatCredits(usage?.image_credits_remaining ?? null)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Videos</p>
                <p className="text-xl font-bold">{formatCredits(usage?.video_credits_remaining ?? null)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reset Info */}
      {usage?.daily_reset_at && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Clock className="h-4 w-4" />
          <span>
            Daily limits reset at: {format(new Date(usage.daily_reset_at), 'h:mm a')} (next reset: {format(new Date(usage.daily_reset_at), 'MMM dd, yyyy')})
          </span>
        </div>
      )}
    </div>
  );
}
