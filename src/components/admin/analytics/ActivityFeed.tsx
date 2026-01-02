import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityLogEntry } from '@/hooks/useRealtimeAnalytics';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  entries: ActivityLogEntry[];
}

export const ActivityFeed = ({ entries }: ActivityFeedProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-sm font-medium truncate">
                        {entry.userEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {entry.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {entry.tokens.toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-right">
                    ${entry.cost.toFixed(4)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
