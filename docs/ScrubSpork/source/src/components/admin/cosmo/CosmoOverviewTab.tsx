import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Brain,
  Loader2
} from 'lucide-react';
import { useCosmoAdmin } from '@/hooks/useCosmoAdmin';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { formatDistanceToNow } from 'date-fns';

export function CosmoOverviewTab() {
  const { stats, statsLoading, refetchStats, intents, functionChains } = useCosmoAdmin();
  const { getSetting, updateSetting, isLoading: settingsLoading } = useSystemSettings();

  const routingConfig = getSetting('cosmo_routing_config')?.setting_value as { 
    enabled?: boolean; 
    model_id?: string;
    cost_performance_weight?: number;
  } | null;

  const isEnabled = routingConfig?.enabled ?? true;
  const brainModel = routingConfig?.model_id || 'Not configured';
  const costWeight = routingConfig?.cost_performance_weight ?? 50;

  const handleToggleEnabled = async () => {
    await updateSetting('cosmo_routing_config', {
      ...routingConfig,
      enabled: !isEnabled,
    });
  };

  const getCostTierLabel = (weight: number) => {
    if (weight <= 33) return { label: 'Low Cost', color: 'bg-green-500/10 text-green-600' };
    if (weight <= 66) return { label: 'Balanced', color: 'bg-yellow-500/10 text-yellow-600' };
    return { label: 'Premium', color: 'bg-purple-500/10 text-purple-600' };
  };

  const costTier = getCostTierLabel(costWeight);

  if (settingsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isEnabled ? 'bg-primary/20' : 'bg-muted'}`}>
                <Brain className={`h-7 w-7 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">COSMO Orchestrator</h2>
                  <Badge variant={isEnabled ? 'default' : 'secondary'}>
                    {isEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Brain Model: <span className="font-medium text-foreground">{brainModel}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Cost Tier</p>
                <Badge className={costTier.color}>{costTier.label}</Badge>
              </div>
              <Switch checked={isEnabled} onCheckedChange={handleToggleEnabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests (24h)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total AI routing decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Successful completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgResponseTime.toFixed(0) || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{intents.length}</div>
            <p className="text-xs text-muted-foreground">
              Active intents • {functionChains.length} chains
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Category Distribution</CardTitle>
              <CardDescription>Top categories by request volume</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.topCategories.length ? (
              <div className="space-y-3">
                {stats.topCategories.map((cat, i) => {
                  const maxCount = stats.topCategories[0].count;
                  const percentage = (cat.count / maxCount) * 100;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{cat.category}</span>
                        <span className="text-muted-foreground">{cat.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet. Start using COSMO to see category distribution.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Decisions</CardTitle>
              <CardDescription>Latest routing decisions by COSMO</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats?.recentDecisions.length ? (
              <div className="space-y-3">
                {stats.recentDecisions.map((decision) => (
                  <div 
                    key={decision.id} 
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {decision.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {decision.detected_intent || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {decision.selected_model?.split('/').pop() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(decision.created_at), { addSuffix: true })}
                      </p>
                      {decision.response_time_ms && (
                        <p className="text-xs font-medium">{decision.response_time_ms}ms</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent decisions. COSMO is ready to route.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common COSMO management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Zap className="h-4 w-4" />
              Test Routing
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Brain className="h-4 w-4" />
              Analyze Intent
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
