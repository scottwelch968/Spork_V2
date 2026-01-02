import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    { title: 'Total Users', value: analytics?.totalUsers || 0, icon: Users, color: 'text-blue-500' },
    { title: 'Total Workspaces', value: analytics?.totalWorkspaces || 0, icon: Folder, color: 'text-purple-500' },
    { title: 'Total Chats', value: analytics?.totalChats || 0, icon: MessageSquare, color: 'text-green-500' },
    { title: 'Total Messages', value: analytics?.totalMessages || 0, icon: FileText, color: 'text-orange-500' },
    { title: 'Generated Images', value: analytics?.totalImages || 0, icon: Image, color: 'text-pink-500' },
    { title: 'Generated Videos', value: analytics?.totalVideos || 0, icon: Video, color: 'text-red-500' },
  ];

  const chartConfig = {
    count: {
      label: "Activities",
      color: "hsl(var(--primary))",
    },
    tokens: {
      label: "Tokens",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Platform Statistics</h3>
        <ExportButton
          onExportCSV={() => exportOverviewData(analytics, chartData, 'csv')}
          onExportJSON={() => exportOverviewData(analytics, chartData, 'json')}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time (Last 30 Days)</CardTitle>
          <CardDescription>Daily activity and token usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="Activities" />
                <Line type="monotone" dataKey="tokens" stroke="hsl(var(--secondary))" strokeWidth={2} name="Tokens" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
