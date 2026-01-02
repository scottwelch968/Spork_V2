import { useEffect, useState } from 'react';
import { useAdmin } from '@/admin/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card } from '@/admin/ui';
import {
  TimePeriodSelector,
  OverviewTab,
  ModelUsageTab,
  TokenAnalyticsTab,
  CostAnalyticsTab,
  LiveAnalyticsTab,
  ConnectionStatus,
  UsageOverviewTab,
  UserCostsTab,
  type TimePeriod
} from '@/admin/components/analytics';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

const AdminAnalytics = () => {
  const {
    getAnalytics,
    getModelUsageAnalytics,
    getTokenAnalytics,
    getCostAnalytics,
    getUserCostAnalytics
  } = useAdmin();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const [modelUsageData, setModelUsageData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [costData, setCostData] = useState<any>(null);
  const [userCostData, setUserCostData] = useState<any>(null);

  // Real-time analytics hook
  const realtimeData = useRealtimeAnalytics(() => {
    // Auto-refresh data when new logs arrive
    loadPeriodData();
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadPeriodData();
  }, [period]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    const data = await getAnalytics();
    setAnalytics(data);
    setIsLoading(false);
  };

  const loadPeriodData = async () => {
    const [modelUsage, tokens, costs, userCosts] = await Promise.all([
      getModelUsageAnalytics(period),
      getTokenAnalytics(period),
      getCostAnalytics(period),
      getUserCostAnalytics(period),
    ]);
    setModelUsageData(modelUsage);
    setTokenData(tokens);
    setCostData(costs);
    setUserCostData(userCosts);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-accent"></div>
      </div>
    );
  }

  // Prepare chart data for overview
  const chartData = analytics?.recentUsage?.reduce((acc: any[], log: any) => {
    const date = new Date(log.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);

    if (existing) {
      existing.count += 1;
      existing.tokens += log.tokens_used || 0;
    } else {
      acc.push({
        date,
        count: 1,
        tokens: log.tokens_used || 0,
      });
    }

    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-admin-info-muted flex items-center justify-center">
          <Activity className="h-5 w-5 text-admin-info" />
        </div>
        <div>
          <h1 className="text-2xl font-roboto-slab font-bold text-admin-text">Analytics Center</h1>
          <p className="text-sm text-admin-text-muted">Real-time insights and usage metrics</p>
        </div>
      </div>

      <Tabs defaultValue="live" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-admin-bg-muted">
            <TabsTrigger value="live" className="data-[state=active]:bg-admin-bg text-admin-text">Live</TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-admin-bg text-admin-text">Overview</TabsTrigger>
            <TabsTrigger value="model-usage" className="data-[state=active]:bg-admin-bg text-admin-text">Model Usage</TabsTrigger>
            <TabsTrigger value="tokens" className="data-[state=active]:bg-admin-bg text-admin-text">Tokens</TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-admin-bg text-admin-text">Costs</TabsTrigger>
            <TabsTrigger value="user-costs" className="data-[state=active]:bg-admin-bg text-admin-text">User Costs</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-admin-bg text-admin-text">Usage</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            <ConnectionStatus
              status={realtimeData.connectionStatus}
              onReconnect={realtimeData.reconnect}
            />
            {realtimeData.lastUpdated && (
              <span className="text-xs text-admin-text-muted">
                Updated {formatDistanceToNow(realtimeData.lastUpdated, { addSuffix: true })}
              </span>
            )}
            <div className="flex items-center gap-2">
              {['model-usage', 'tokens', 'costs'].map(tab => (
                <div key={tab} className="hidden data-[state=active]:block" data-state={tab}>
                  <TimePeriodSelector value={period} onChange={setPeriod} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <TabsContent value="live" className="space-y-6">
          <LiveAnalyticsTab data={realtimeData} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <OverviewTab analytics={analytics} chartData={chartData} />
        </TabsContent>

        <TabsContent value="model-usage" className="space-y-6">
          <div className="flex justify-end mb-4">
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>
          {modelUsageData && <ModelUsageTab data={modelUsageData} />}
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <div className="flex justify-end mb-4">
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>
          {tokenData && <TokenAnalyticsTab data={tokenData} />}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="flex justify-end mb-4">
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>
          {costData && <CostAnalyticsTab data={costData} />}
        </TabsContent>

        <TabsContent value="user-costs" className="space-y-6">
          <div className="flex justify-end mb-4">
            <TimePeriodSelector value={period} onChange={setPeriod} />
          </div>
          {userCostData && <UserCostsTab data={userCostData} />}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageOverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
