import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, XCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { useEmailTesting } from '@/hooks/useEmailTesting';

export function EmailQuickStats() {
  const { stats, loadStats } = useEmailTesting();

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Sent',
      value: stats?.total_sent || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Failed',
      value: stats?.total_failed || 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Success Rate',
      value: `${(stats?.success_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Sent Today',
      value: stats?.sent_today || 0,
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Sent This Week',
      value: stats?.sent_week || 0,
      icon: Calendar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Sent This Month',
      value: stats?.sent_month || 0,
      icon: Mail,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Failures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Emails Delivered</p>
                  <p className="text-sm text-muted-foreground">Successfully sent to recipients</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-500">{stats?.total_sent || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Delivery Failures</p>
                  <p className="text-sm text-muted-foreground">Failed to reach recipient</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-500">{stats?.total_failed || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
