import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@/admin/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ExportButton } from './ExportButton';
import { exportTokenAnalyticsData } from '@/utils/exportAnalytics';

interface TokenAnalyticsTabProps {
  data: any;
}

const COLORS = [
  'var(--admin-accent)',
  'var(--admin-info)',
  'var(--admin-success)',
  'var(--admin-warning)',
  'var(--admin-secondary-text)',
];

export const TokenAnalyticsTab = ({ data }: TokenAnalyticsTabProps) => {
  const lineChartConfig = {
    tokens: {
      label: "Tokens",
      color: "var(--admin-accent)",
    },
  };

  const barChartConfig = {
    tokens: {
      label: "Tokens",
      color: "var(--admin-accent)",
    },
  };

  const pieConfig = data.modelData?.reduce((acc: any, item: any, index: number) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Token Analytics</h3>
        <ExportButton
          onExportCSV={() => exportTokenAnalyticsData(data, 'csv')}
          onExportJSON={() => exportTokenAnalyticsData(data, 'json')}
          disabled={!data?.modelData?.length}
        />
      </div>

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Token Consumption Over Time</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Daily token usage trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeData || []}>
                <XAxis dataKey="date" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="tokens" stroke="var(--admin-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Tokens by Model</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Token consumption per model</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.modelData?.slice(0, 10) || []}>
                  <XAxis dataKey="name" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="tokens" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Token Distribution</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Token usage by model</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pieConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.modelData?.slice(0, 5) || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="var(--admin-accent)"
                    dataKey="tokens"
                  >
                    {data.modelData?.slice(0, 5).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Token Breakdown by Model</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Detailed token consumption data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Model</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Category</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Total Tokens</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Requests</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Avg Tokens/Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.modelData?.slice(0, 10).map((model: any) => (
                <TableRow key={model.model_id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20">
                      {model.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{model.tokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{model.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {(model.tokens / model.requests).toFixed(0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
