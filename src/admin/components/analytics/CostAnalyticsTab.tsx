import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@/admin/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ExportButton } from './ExportButton';
import { exportCostAnalyticsData } from '@/utils/exportAnalytics';
import { CostForecastCard } from './CostForecastCard';

interface CostAnalyticsTabProps {
  data: any;
}

export const CostAnalyticsTab = ({ data }: CostAnalyticsTabProps) => {
  const areaChartConfig = {
    cost: {
      label: "Cost",
      color: "var(--admin-accent)",
    },
  };

  const barChartConfig = {
    cost: {
      label: "Cost ($)",
      color: "var(--admin-accent)",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Cost Breakdown</h3>
        <ExportButton
          onExportCSV={() => exportCostAnalyticsData(data, 'csv')}
          onExportJSON={() => exportCostAnalyticsData(data, 'json')}
          disabled={!data?.modelData?.length}
        />
      </div>

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Cost Over Time</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Daily cost trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeData || []}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--admin-accent)"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Cost by Model</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Total cost per model</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.modelData?.slice(0, 10) || []}>
                <XAxis dataKey="name" stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--admin-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cost" fill="var(--admin-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {data.timeData && data.timeData.length > 0 && (
        <CostForecastCard
          historicalData={data.timeData.map((d: any) => ({
            date: d.date,
            cost: d.cost || 0,
          }))}
        />
      )}

      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Detailed Cost Breakdown</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Cost analysis by model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Model</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Category</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Requests</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Tokens</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Total Cost</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest">Avg Cost/Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.modelData?.slice(0, 10).map((model: any) => (
                <TableRow key={model.model_id}>
                  <TableCell className="font-medium font-mono text-xs">{model.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20">
                      {model.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{model.requests.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{model.tokens.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${model.cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">
                    ${(model.cost / model.requests).toFixed(6)}
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
