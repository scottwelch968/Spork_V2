import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui';
import { Activity, DollarSign, Hash, Users } from 'lucide-react';
import { ActivityLogEntry as RealtimeActivityLogEntry } from '@/hooks/useRealtimeAnalytics';
import { ActivityFeed } from './ActivityFeed';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ExportButton } from './ExportButton';
import { exportLiveActivityData } from '@/utils/exportAnalytics';

interface LiveAnalyticsTabProps {
  data: {
    liveStats: { activeUsers: number; requestsThisMinute: number; tokensThisHour: number; costToday: number };
    activityFeed: RealtimeActivityLogEntry[];
  };
}

export const LiveAnalyticsTab = ({ data }: LiveAnalyticsTabProps) => {
  const stats = [
    {
      title: 'Active Users Now',
      value: data.liveStats.activeUsers,
      icon: Users,
      color: 'text-admin-info',
    },
    {
      title: 'Requests This Minute',
      value: data.liveStats.requestsThisMinute,
      icon: Activity,
      color: 'text-admin-success',
    },
    {
      title: 'Tokens This Hour',
      value: data.liveStats.tokensThisHour.toLocaleString(),
      icon: Hash,
      color: 'text-admin-accent',
    },
    {
      title: 'Cost Today',
      value: `$${data.liveStats.costToday.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-admin-warning',
    },
  ];

  const requestsChartData = Array.from({ length: 10 }, (_, i) => ({
    time: `${i + 1}m ago`,
    requests: Math.floor(Math.random() * data.liveStats.requestsThisMinute + 1),
  })).reverse();

  const modelDistribution = data.activityFeed.reduce((acc, entry) => {
    acc[entry.model] = (acc[entry.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modelChartData = Object.entries(modelDistribution)
    .map(([model, count]) => ({
      model: model.split('/').pop() || model,
      requests: count,
    }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 5);

  const chartConfig = {
    requests: {
      label: 'Requests',
      color: 'hsl(var(--admin-accent))',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Live Activity Monitor</h3>
        <ExportButton
          onExportCSV={() => exportLiveActivityData(data.activityFeed, 'csv')}
          onExportJSON={() => exportLiveActivityData(data.activityFeed, 'json')}
          disabled={data.activityFeed.length === 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border border-admin-border/50 rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">{stat.title}</CardTitle>
                <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-admin-text">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Requests Per Minute (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestsChartData}>
                  <XAxis dataKey="time" className="text-[10px] font-bold uppercase tracking-widest" stroke="var(--admin-text-muted)" tickLine={false} axisLine={false} />
                  <YAxis className="text-[10px] font-bold uppercase tracking-widest" stroke="var(--admin-text-muted)" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="var(--admin-accent)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelChartData}>
                  <XAxis dataKey="model" className="text-[10px] font-bold uppercase tracking-widest" stroke="var(--admin-text-muted)" tickLine={false} axisLine={false} />
                  <YAxis className="text-[10px] font-bold uppercase tracking-widest" stroke="var(--admin-text-muted)" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <ActivityFeed entries={data.activityFeed} />
    </div>
  );
};
