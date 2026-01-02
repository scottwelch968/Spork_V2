import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, DollarSign, Hash, Users } from 'lucide-react';
import { RealtimeAnalyticsState } from '@/hooks/useRealtimeAnalytics';
import { ActivityFeed } from './ActivityFeed';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ExportButton } from './ExportButton';
import { exportLiveActivityData } from '@/utils/exportAnalytics';

interface LiveAnalyticsTabProps {
  data: RealtimeAnalyticsState;
}

export const LiveAnalyticsTab = ({ data }: LiveAnalyticsTabProps) => {
  const stats = [
    {
      title: 'Active Users Now',
      value: data.liveStats.activeUsers,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Requests This Minute',
      value: data.liveStats.requestsThisMinute,
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Tokens This Hour',
      value: data.liveStats.tokensThisHour.toLocaleString(),
      icon: Hash,
      color: 'text-purple-500',
    },
    {
      title: 'Cost Today',
      value: `$${data.liveStats.costToday.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-orange-500',
    },
  ];

  // Generate mock chart data for requests per minute (last 10 minutes)
  const requestsChartData = Array.from({ length: 10 }, (_, i) => ({
    time: `${i + 1}m ago`,
    requests: Math.floor(Math.random() * data.liveStats.requestsThisMinute + 1),
  })).reverse();

  // Generate model distribution from activity feed
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
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Live Activity Monitor</h3>
        <ExportButton
          onExportCSV={() => exportLiveActivityData(data.activityFeed, 'csv')}
          onExportJSON={() => exportLiveActivityData(data.activityFeed, 'json')}
          disabled={data.activityFeed.length === 0}
        />
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests Per Minute (Live)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestsChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="model" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <ActivityFeed entries={data.activityFeed} />
    </div>
  );
};
