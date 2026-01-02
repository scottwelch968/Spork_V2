import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui';
import { Button } from '@/admin/ui';
import { Badge } from '@/admin/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui';
import { ScrollArea } from '@/admin/ui';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Wifi,
  WifiOff,
  TrendingUp,
  Zap,
  MessageSquare,
  Wand2,
  Image,
  FileText
} from 'lucide-react';
import { useCosmoHealth } from '@/hooks/useCosmoHealth';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const OPERATION_COLORS: Record<string, string> = {
  chat: 'hsl(var(--chart-1))',
  enhance_prompt: 'hsl(var(--chart-2))',
  image_generation: 'hsl(var(--chart-3))',
  knowledge_query: 'hsl(var(--chart-4))',
};

const OPERATION_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageSquare className="h-4 w-4" />,
  enhance_prompt: <Wand2 className="h-4 w-4" />,
  image_generation: <Image className="h-4 w-4" />,
  knowledge_query: <FileText className="h-4 w-4" />,
};

export const CosmoHealthTab = () => {
  const [timeRange, setTimeRange] = useState(24);
  const { metrics, isLoading, isConnected, lastUpdated, refetch, exportMetrics } = useCosmoHealth(timeRange);

  const pieData = Object.entries(metrics.requestsByType).map(([name, value]) => ({
    name,
    value,
    fill: OPERATION_COLORS[name] || 'hsl(var(--muted))',
  }));

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge 
            variant={isConnected ? 'default' : 'destructive'} 
            className="gap-1.5"
          >
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1 hour</SelectItem>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="72">Last 3 days</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportMetrics('csv')}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportMetrics('json')}>
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</p>
                <p className="text-xs text-muted-foreground">p95: {metrics.responseTimeP95.toFixed(0)}ms</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className={`text-2xl font-bold ${metrics.errorRate > 5 ? 'text-destructive' : metrics.errorRate > 1 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {metrics.errorRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{metrics.errorCount} errors</p>
              </div>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${metrics.errorRate > 5 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${metrics.errorRate > 5 ? 'text-destructive' : 'text-green-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fallback Rate</p>
                <p className="text-2xl font-bold">{metrics.fallbackRate.toFixed(1)}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {Object.entries(metrics.requestsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: OPERATION_COLORS[type] || 'hsl(var(--muted))' }}
                      />
                      <span className="text-sm capitalize flex items-center gap-1.5">
                        {OPERATION_ICONS[type]}
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({metrics.totalRequests > 0 ? ((count / metrics.totalRequests) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response Time Percentiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'p50', value: metrics.responseTimeP50, fill: 'hsl(var(--chart-1))' },
                  { name: 'p95', value: metrics.responseTimeP95, fill: 'hsl(var(--chart-2))' },
                  { name: 'p99', value: metrics.responseTimeP99, fill: 'hsl(var(--chart-3))' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)}ms`, 'Response Time']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Request Volume Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  className="text-xs"
                  tickFormatter={(v) => format(new Date(v), 'HH:mm')}
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(v) => format(new Date(v), 'MMM d, HH:mm')}
                />
                <Legend />
                <Area type="monotone" dataKey="chat" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="enhance_prompt" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="image_generation" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="knowledge_query" stackId="1" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Model Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.modelUsage.map((model) => (
                  <TableRow key={model.model}>
                    <TableCell className="font-medium truncate max-w-48">{model.model}</TableCell>
                    <TableCell className="text-right">{model.requests.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{model.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${model.cost.toFixed(4)}</TableCell>
                    <TableCell className="text-right">{model.avgResponseTime.toFixed(0)}ms</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={model.errorRate > 5 ? 'destructive' : model.errorRate > 1 ? 'secondary' : 'outline'}>
                        {model.errorRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {metrics.modelUsage.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No model usage data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {metrics.recentErrors.length > 0 ? (
              <div className="space-y-2">
                {metrics.recentErrors.map((error) => (
                  <div key={error.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {error.operationType}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-48">
                          {error.model}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(error.timestamp), 'MMM d, HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-sm text-destructive truncate">{error.errorMessage}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No recent errors
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
