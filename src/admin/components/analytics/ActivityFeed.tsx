import { Card, CardContent } from '@/admin/ui';
import { formatDistanceToNow } from 'date-fns';

import { ActivityLogEntry } from '@/hooks/useRealtimeAnalytics';

interface ActivityFeedProps {
  entries: ActivityLogEntry[];
}

export const ActivityFeed = ({ entries }: ActivityFeedProps) => {
  return (
    <Card className="border border-admin-border/50 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-admin-border/50">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Recent Activity</h3>
      </div>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="p-4 text-xs text-admin-muted-text text-center">No activity yet</p>
          ) : (
            <div className="divide-y divide-admin-border/50">
              {entries.map((entry) => (
                <div key={entry.id} className="px-4 py-3 hover:bg-admin-bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-admin-text truncate">
                        {entry.userEmail}
                      </p>
                      <p className="text-xs text-admin-muted-text font-mono">
                        {entry.model.split('/').pop()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-admin-text">
                        {entry.tokens?.toLocaleString() || 0} tokens
                      </p>
                      <p className="text-xs text-admin-muted-text">
                        ${(entry.cost || 0).toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70 mt-1">
                    {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
