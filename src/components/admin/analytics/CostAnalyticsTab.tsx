import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModelCategoryBadge } from '@/components/admin/models/ModelCategoryBadge';
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
      color: "hsl(var(--primary))",
    },
  };

  const barChartConfig = {
    cost: {
      label: "Cost ($)",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Cost Breakdown</h3>
        <ExportButton
          onExportCSV={() => exportCostAnalyticsData(data, 'csv')}
          onExportJSON={() => exportCostAnalyticsData(data, 'json')}
          disabled={!data?.modelData?.length}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Cost Over Time</CardTitle>
          <CardDescription>Daily cost trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeData || []}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost by Model</CardTitle>
          <CardDescription>Total cost per model</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.modelData?.slice(0, 10) || []}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Cost Forecast */}
      {data.timeData && data.timeData.length > 0 && (
        <CostForecastCard 
          historicalData={data.timeData.map((d: any) => ({
            date: d.date,
            cost: d.cost || 0,
          }))}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
          <CardDescription>Cost analysis by model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Avg Cost/Request</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.modelData?.slice(0, 10).map((model: any) => (
                <TableRow key={model.model_id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>
                    <ModelCategoryBadge category={model.category} />
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
