import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  Zap,
  Activity,
  Loader2,
  Star,
  Layers,
  Route,
  Database,
  Download
} from 'lucide-react';
import { useCosmoCosts, TimeRange } from '@/hooks/useCosmoCosts';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts';

export function CosmoCostsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const costs = useCosmoCosts(timeRange);

  if (costs.isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    if (value < 0.01) return `$${value.toFixed(4)}`;
    if (value < 1) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < score ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} 
      />
    ));
  };

  // Calculate savings breakdown percentages
  const totalSavingsBreakdown = costs.savingsBreakdown.total || 1;
  const batchingPercent = (costs.savingsBreakdown.batching / totalSavingsBreakdown) * 100;
  const routingPercent = (costs.savingsBreakdown.routing / totalSavingsBreakdown) * 100;
  const contextPercent = (costs.savingsBreakdown.contextReuse / totalSavingsBreakdown) * 100;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cost Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track API costs, savings, and optimization ROI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.totalCost)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {costs.costChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">+{costs.costChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{costs.costChange}%</span>
                </>
              )}
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(costs.totalSavings)}</div>
            <p className="text-xs text-muted-foreground">
              vs premium model pricing
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{costs.roi}%</div>
            <p className="text-xs text-muted-foreground">
              Cost reduction achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costs.avgCostPerRequest)}</div>
            <p className="text-xs text-muted-foreground">
              {costs.totalRequests.toLocaleString()} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cost Trends</CardTitle>
            <CardDescription>Actual vs theoretical cost over time (shaded area = savings)</CardDescription>
          </CardHeader>
          <CardContent>
            {costs.costTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costs.costTrends}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="theoreticalCost" 
                    name="Theoretical"
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actualCost" 
                    name="Actual Cost"
                    stroke="hsl(var(--primary))" 
                    fill="url(#savingsGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No cost data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Savings Breakdown</CardTitle>
            <CardDescription>Where your savings come from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-blue-500" />
                    <span>Smart Routing</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.savingsBreakdown.routing)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${Math.min(100, routingPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {routingPercent.toFixed(0)}% of savings
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-500" />
                    <span>Request Batching</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.savingsBreakdown.batching)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all" 
                    style={{ width: `${Math.min(100, batchingPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {batchingPercent.toFixed(0)}% of savings
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span>Context Reuse</span>
                  </div>
                  <span className="font-medium">{formatCurrency(costs.savingsBreakdown.contextReuse)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ width: `${Math.min(100, contextPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {contextPercent.toFixed(0)}% of savings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Impact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batch Impact</CardTitle>
            <CardDescription>Request batching efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">{costs.batchMetrics.totalBatched}</p>
                <p className="text-xs text-muted-foreground">Batches Processed</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">{costs.batchMetrics.apiCallsSaved}</p>
                <p className="text-xs text-muted-foreground">API Calls Saved</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{formatTokens(costs.batchMetrics.tokensSaved)}</p>
                <p className="text-xs text-muted-foreground">Tokens Saved</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(costs.batchMetrics.costSaved)}</p>
                <p className="text-xs text-muted-foreground">Cost Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Cost Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Cost Breakdown</CardTitle>
          <CardDescription>Cost and efficiency by model</CardDescription>
        </CardHeader>
        <CardContent>
          {costs.modelCosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Model</th>
                    <th className="text-right py-3 px-2 font-medium">Requests</th>
                    <th className="text-right py-3 px-2 font-medium">Tokens</th>
                    <th className="text-right py-3 px-2 font-medium">Cost</th>
                    <th className="text-right py-3 px-2 font-medium">Avg/Request</th>
                    <th className="text-center py-3 px-2 font-medium">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.modelCosts.slice(0, 10).map((model) => (
                    <tr key={model.modelId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium">{model.modelName}</p>
                          <p className="text-xs text-muted-foreground">{model.provider}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">{model.requests.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">{formatTokens(model.tokens)}</td>
                      <td className="text-right py-3 px-2 font-medium">{formatCurrency(model.cost)}</td>
                      <td className="text-right py-3 px-2">{formatCurrency(model.avgCostPerRequest)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {renderStars(model.efficiencyScore)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No model usage data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Token Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTokens(costs.totalTokens)}</p>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTokens(costs.promptTokens)}</p>
                <p className="text-xs text-muted-foreground">Prompt Tokens</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTokens(costs.completionTokens)}</p>
                <p className="text-xs text-muted-foreground">Completion Tokens</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
