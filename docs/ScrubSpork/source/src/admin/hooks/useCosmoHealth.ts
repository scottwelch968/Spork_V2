import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CosmoHealthMetrics {
  totalRequests: number;
  requestsByType: Record<string, number>;
  avgResponseTime: number;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  errorCount: number;
  fallbackRate: number;
  modelUsage: ModelUsageStats[];
  errorsByType: Record<string, number>;
  errorsByModel: Record<string, number>;
  recentErrors: RecentError[];
  hourlyData: HourlyData[];
}

export interface ModelUsageStats {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface RecentError {
  id: string;
  timestamp: string;
  operationType: string;
  model: string;
  errorMessage: string;
}

export interface HourlyData {
  hour: string;
  chat: number;
  enhance_prompt: number;
  image_generation: number;
  knowledge_query: number;
  total: number;
}

export const useCosmoHealth = (timeRangeHours: number = 24) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: rawLogs, isLoading, refetch } = useQuery({
    queryKey: ['cosmo-health-logs', timeRangeHours],
    queryFn: async () => {
      const since = new Date();
      since.setHours(since.getHours() - timeRangeHours);
      
      const { data, error } = await supabase
        .from('cosmo_debug_logs')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('cosmo-health-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cosmo_debug_logs'
      }, () => {
        setLastUpdated(new Date());
        refetch();
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const metrics = useMemo<CosmoHealthMetrics>(() => {
    if (!rawLogs || rawLogs.length === 0) {
      return {
        totalRequests: 0,
        requestsByType: {},
        avgResponseTime: 0,
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        errorRate: 0,
        errorCount: 0,
        fallbackRate: 0,
        modelUsage: [],
        errorsByType: {},
        errorsByModel: {},
        recentErrors: [],
        hourlyData: [],
      };
    }

    // Request counts by type
    const requestsByType: Record<string, number> = {};
    rawLogs.forEach(log => {
      const type = log.operation_type || 'unknown';
      requestsByType[type] = (requestsByType[type] || 0) + 1;
    });

    // Response times
    const responseTimes = rawLogs
      .filter(log => log.response_time_ms != null)
      .map(log => log.response_time_ms as number)
      .sort((a, b) => a - b);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;
    
    const getPercentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    // Error metrics
    const errors = rawLogs.filter(log => !log.success);
    const errorCount = errors.length;
    const errorRate = rawLogs.length > 0 ? (errorCount / rawLogs.length) * 100 : 0;

    // Errors by type
    const errorsByType: Record<string, number> = {};
    errors.forEach(log => {
      const type = log.operation_type || 'unknown';
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

    // Errors by model
    const errorsByModel: Record<string, number> = {};
    errors.forEach(log => {
      const model = log.selected_model || 'unknown';
      errorsByModel[model] = (errorsByModel[model] || 0) + 1;
    });

    // Fallback rate
    const fallbackCount = rawLogs.filter(log => log.fallback_used).length;
    const fallbackRate = rawLogs.length > 0 ? (fallbackCount / rawLogs.length) * 100 : 0;

    // Model usage stats
    const modelStats: Record<string, { requests: number; tokens: number; cost: number; responseTimes: number[]; errors: number }> = {};
    rawLogs.forEach(log => {
      const model = log.selected_model || 'unknown';
      if (!modelStats[model]) {
        modelStats[model] = { requests: 0, tokens: 0, cost: 0, responseTimes: [], errors: 0 };
      }
      modelStats[model].requests++;
      modelStats[model].tokens += log.total_tokens || 0;
      modelStats[model].cost += log.cost || 0;
      if (log.response_time_ms) {
        modelStats[model].responseTimes.push(log.response_time_ms);
      }
      if (!log.success) {
        modelStats[model].errors++;
      }
    });

    const modelUsage: ModelUsageStats[] = Object.entries(modelStats)
      .map(([model, stats]) => ({
        model,
        requests: stats.requests,
        tokens: stats.tokens,
        cost: stats.cost,
        avgResponseTime: stats.responseTimes.length > 0
          ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
          : 0,
        errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
      }))
      .sort((a, b) => b.requests - a.requests);

    // Recent errors
    const recentErrors: RecentError[] = errors.slice(0, 10).map(log => ({
      id: log.id,
      timestamp: log.created_at || '',
      operationType: log.operation_type || 'unknown',
      model: log.selected_model || 'unknown',
      errorMessage: log.error_message || 'Unknown error',
    }));

    // Hourly data
    const hourlyBuckets: Record<string, HourlyData> = {};
    const now = new Date();
    for (let i = 0; i < timeRangeHours; i++) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i, 0, 0, 0);
      const key = hour.toISOString().slice(0, 13);
      hourlyBuckets[key] = {
        hour: key,
        chat: 0,
        enhance_prompt: 0,
        image_generation: 0,
        knowledge_query: 0,
        total: 0,
      };
    }

    rawLogs.forEach(log => {
      const hour = log.created_at?.slice(0, 13);
      if (hour && hourlyBuckets[hour]) {
        const type = log.operation_type as keyof HourlyData;
        if (type && type !== 'hour' && type !== 'total') {
          hourlyBuckets[hour][type]++;
        }
        hourlyBuckets[hour].total++;
      }
    });

    const hourlyData = Object.values(hourlyBuckets)
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      totalRequests: rawLogs.length,
      requestsByType,
      avgResponseTime,
      responseTimeP50: getPercentile(responseTimes, 50),
      responseTimeP95: getPercentile(responseTimes, 95),
      responseTimeP99: getPercentile(responseTimes, 99),
      errorRate,
      errorCount,
      fallbackRate,
      modelUsage,
      errorsByType,
      errorsByModel,
      recentErrors,
      hourlyData,
    };
  }, [rawLogs]);

  const exportMetrics = useCallback((format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmo-health-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = [
        ['Metric', 'Value'],
        ['Total Requests', metrics.totalRequests.toString()],
        ['Avg Response Time (ms)', metrics.avgResponseTime.toFixed(2)],
        ['P50 Response Time (ms)', metrics.responseTimeP50.toFixed(2)],
        ['P95 Response Time (ms)', metrics.responseTimeP95.toFixed(2)],
        ['P99 Response Time (ms)', metrics.responseTimeP99.toFixed(2)],
        ['Error Rate (%)', metrics.errorRate.toFixed(2)],
        ['Fallback Rate (%)', metrics.fallbackRate.toFixed(2)],
        ...Object.entries(metrics.requestsByType).map(([type, count]) => [`Requests: ${type}`, count.toString()]),
      ];
      const csv = rows.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosmo-health-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [metrics]);

  return {
    metrics,
    isLoading,
    isConnected,
    lastUpdated,
    refetch,
    exportMetrics,
  };
};
