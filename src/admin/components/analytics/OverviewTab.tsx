import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui';
import { Users, MessageSquare, Image, Video, Folder, FileText } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ExportButton } from './ExportButton';
import { exportOverviewData } from '@/utils/exportAnalytics';

interface OverviewTabProps {
  analytics: any;
  chartData: any[];
}

export const OverviewTab = ({ analytics, chartData }: OverviewTabProps) => {
  const stats = [
    { title: 'Total Users', value: analytics?.totalUsers || 0, icon: Users, color: 'text-admin-info' },
    { title: 'Total Workspaces', value: analytics?.totalWorkspaces || 0, icon: Folder, color: 'text-admin-accent' },
    { title: 'Total Chats', value: analytics?.totalChats || 0, icon: MessageSquare, color: 'text-admin-success' },
    { title: 'Total Messages', value: analytics?.totalMessages || 0, icon: FileText, color: 'text-admin-warning' },
    { title: 'Generated Images', value: analytics?.totalImages || 0, icon: Image, color: 'text-admin-accent' },
    { title: 'Generated Videos', value: analytics?.totalVideos || 0, icon: Video, color: 'text-admin-error' },
  ];

  const chartConfig = {
    count: {
      label: "Activities",
      color: "var(--admin-accent)",
    },
    tokens: {
      label: "Tokens",
      color: "var(--admin-secondary-text)",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Platform Statistics</h3>
        <ExportButton
          onExportCSV={() => exportOverviewData(analytics, chartData, 'csv')}
          onExportJSON={() => exportOverviewData(analytics, chartData, 'json')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-admin-border/50 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">{stat.title}</CardTitle>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Usage Over Time (Last 30 Days)</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">
            Daily activity and token usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="var(--admin-accent)" strokeWidth={2} dot={false} name="Activities" />
                <Line type="monotone" dataKey="tokens" stroke="var(--admin-secondary-text)" strokeWidth={2} dot={false} name="Tokens" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
