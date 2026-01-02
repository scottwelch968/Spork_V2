import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@/admin/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ExportButton } from './ExportButton';
import { exportModelUsageData } from '@/utils/exportAnalytics';

interface ModelUsageTabProps {
  data: any;
}

const COLORS = [
  'var(--admin-accent)',
  'var(--admin-info)',
  'var(--admin-success)',
  'var(--admin-warning)',
  'var(--admin-secondary-text)',
];

export const ModelUsageTab = ({ data }: ModelUsageTabProps) => {
  const chartConfig = {
    requests: {
      label: "Requests",
      color: "var(--admin-accent)",
    },
  };

  const categoryConfig = data.categoryData?.reduce((acc: any, item: any, index: number) => {
    acc[item.category] = {
      label: item.category,
      color: COLORS[index % COLORS.length],
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Model Usage Statistics</h3>
        <ExportButton
          onExportCSV={() => exportModelUsageData(data, 'csv')}
          onExportJSON={() => exportModelUsageData(data, 'json')}
          disabled={!data?.modelData?.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Usage by Model</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Request count per model</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.modelData?.slice(0, 10) || []}>
                  <XAxis dataKey="name" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="requests" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Usage by Category</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Distribution across model categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="var(--admin-accent)"
                    dataKey="value"
                  >
                    {data.categoryData?.map((entry: any, index: number) => (
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
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Top Models by Usage</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Most frequently used models</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Model</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Category</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Requests</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Tokens</TableHead>
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
                  <TableCell className="text-right">{model.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{model.tokens.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
