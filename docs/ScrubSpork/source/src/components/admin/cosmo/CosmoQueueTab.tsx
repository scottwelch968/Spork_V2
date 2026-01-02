import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  Play, 
  ListOrdered, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Zap,
  X,
  ArrowUp,
  ArrowDown,
  Layers,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useCosmoQueue } from '@/hooks/useCosmoQueue';
import { useCosmoBatches } from '@/hooks/useCosmoBatches';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'hsl(var(--destructive))',
  high: 'hsl(var(--chart-1))',
  normal: 'hsl(var(--chart-2))',
  low: 'hsl(var(--chart-3))',
};

const STATUS_BADGES: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  processing: { variant: 'default', icon: <Zap className="h-3 w-3" /> },
  completed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
  failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { variant: 'secondary', icon: <X className="h-3 w-3" /> },
  expired: { variant: 'secondary', icon: <AlertTriangle className="h-3 w-3" /> },
};

export function CosmoQueueTab() {
  const { 
    queueItems, 
    stats, 
    timeSeries, 
    isLoading, 
    isConnected, 
    refetch,
    cancelRequest,
    reprioritize,
    triggerProcessor,
    isProcessing,
  } = useCosmoQueue();
  
  const { stats: batchStats, recentBatches, isLoading: batchLoading } = useCosmoBatches();

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredItems = statusFilter === 'all' 
    ? queueItems 
    : queueItems.filter(item => item.status === statusFilter);

  const priorityData = [
    { name: 'Critical', value: stats.pending.critical, color: PRIORITY_COLORS.critical },
    { name: 'High', value: stats.pending.high, color: PRIORITY_COLORS.high },
    { name: 'Normal', value: stats.pending.normal, color: PRIORITY_COLORS.normal },
    { name: 'Low', value: stats.pending.low, color: PRIORITY_COLORS.low },
  ].filter(d => d.value > 0);

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Real-time connected' : 'Reconnecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={() => triggerProcessor()}
            disabled={isProcessing || stats.pending.total === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Processing</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.processing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed24h}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Failed (24h)</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.failed24h}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg Wait</span>
            </div>
            <p className="text-2xl font-bold mt-1">{formatMs(stats.avgWaitTimeMs)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Throughput/min</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.throughputPerMinute}</p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Request Batching
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Layers className="h-3 w-3" />
                <span className="text-xs">Active Batches</span>
              </div>
              <p className="text-xl font-bold">{batchStats.activeBatches}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Avg Batch Size</span>
              </div>
              <p className="text-xl font-bold">{batchStats.avgBatchSize}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Zap className="h-3 w-3" />
                <span className="text-xs">API Calls Saved</span>
              </div>
              <p className="text-xl font-bold text-green-600">{batchStats.apiCallsSaved24h}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">Tokens Saved</span>
              </div>
              <p className="text-xl font-bold text-green-600">{batchStats.tokensSaved24h.toLocaleString()}</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <CheckCircle className="h-3 w-3" />
                <span className="text-xs">Success Rate</span>
              </div>
              <p className="text-xl font-bold">{batchStats.successRate}%</p>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <ListOrdered className="h-3 w-3" />
                <span className="text-xs">Total Batched (24h)</span>
              </div>
              <p className="text-xl font-bold">{batchStats.totalBatched24h}</p>
            </div>
          </div>
          
          {recentBatches.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Recent Batches</p>
              <div className="flex flex-wrap gap-2">
                {recentBatches.slice(0, 10).map((batch) => (
                  <Badge 
                    key={batch.id}
                    variant={batch.status === 'completed' ? 'outline' : batch.status === 'failed' ? 'destructive' : 'secondary'}
                    className="gap-1"
                  >
                    {batch.request_ids.length} requests
                    {batch.status === 'completed' && (
                      <span className="text-green-600">• saved {batch.api_calls_saved} calls</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No pending requests
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Queue Activity (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} name="Completed" />
                <Area type="monotone" dataKey="failed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Failed" />
                <Area type="monotone" dataKey="pending" stackId="2" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.6} name="Pending" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Queue Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Queue Items</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Wait Time</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No queue items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.slice(0, 50).map((item) => {
                    const waitTime = item.started_at 
                      ? new Date(item.started_at).getTime() - new Date(item.created_at).getTime()
                      : Date.now() - new Date(item.created_at).getTime();
                    const statusConfig = STATUS_BADGES[item.status] || STATUS_BADGES.pending;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="gap-1"
                            style={{ borderColor: PRIORITY_COLORS[item.priority] }}
                          >
                            <span 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}
                            />
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.request_type}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            {statusConfig.icon}
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-sm">{formatMs(waitTime)}</TableCell>
                        <TableCell className="text-sm">
                          {item.retry_count}/{item.max_retries}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => reprioritize({ id: item.id, priority: 'high' })}
                                  title="Increase priority"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => reprioritize({ id: item.id, priority: 'low' })}
                                  title="Decrease priority"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => cancelRequest(item.id)}
                                  title="Cancel"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {item.status === 'processing' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => cancelRequest(item.id)}
                                title="Cancel"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredItems.length > 50 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Showing 50 of {filteredItems.length} items
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
