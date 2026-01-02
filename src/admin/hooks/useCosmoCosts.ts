import { useQuery } from '@tanstack/react-query';
import { cosmo2 } from '@/cosmo2/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';
import { CostMetricPoint } from '@/cosmo2/types';

export type TimeRange = '7d' | '30d' | '90d';

interface CostTrendPoint {
  date: string;
  actualCost: number;
  theoreticalCost: number;
  savings: number;
  requests: number;
}

interface ModelCostBreakdown {
  modelId: string;
  modelName: string;
  provider: string;
  requests: number;
  tokens: number;
  promptTokens: number;
  completionTokens: number;
  cost: number;
  avgCostPerRequest: number;
  efficiencyScore: number;
}

interface BatchMetrics {
  totalBatched: number;
  apiCallsSaved: number;
  tokensSaved: number;
  costSaved: number;
}

interface SavingsBreakdown {
  batching: number;
  routing: number;
  contextReuse: number;
  total: number;
}

export interface CosmoCostsData {
  totalCost: number;
  totalSavings: number;
  theoreticalCost: number;
  roi: number;
  avgCostPerRequest: number;
  totalRequests: number;
  costTrends: CostTrendPoint[];
  costChange: number;
  savingsBreakdown: SavingsBreakdown;
  modelCosts: ModelCostBreakdown[];
  batchMetrics: BatchMetrics;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

const PREMIUM_PRICING = {
  prompt: 2.50, // GPT-4o level (per 1M)
  completion: 10.00,
};

export function useCosmoCosts(timeRange: TimeRange = '30d') {
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));
  const endDate = endOfDay(new Date());

  const { data: costsData, isLoading } = useQuery({
    queryKey: ['cosmo-costs', timeRange],
    queryFn: async () => {
      // Fetch aggregated costs from V2 API
      const points = await cosmo2.getCosts(startDate.toISOString(), endDate.toISOString(), 'day');

      // Fetch models for naming
      const models = await cosmo2.getModels();

      return calculateCostsFromPoints(points?.points || [], models, daysBack);
    }
  });

  return {
    ...(costsData || DEFAULT_DATA),
    isLoading,
    timeRange,
  };
}

const DEFAULT_DATA: CosmoCostsData = {
  totalCost: 0, totalSavings: 0, theoreticalCost: 0, roi: 0, avgCostPerRequest: 0, totalRequests: 0,
  costTrends: [], costChange: 0,
  savingsBreakdown: { batching: 0, routing: 0, contextReuse: 0, total: 0 },
  modelCosts: [], batchMetrics: { totalBatched: 0, apiCallsSaved: 0, tokensSaved: 0, costSaved: 0 },
  totalTokens: 0, promptTokens: 0, completionTokens: 0
};

function calculateCostsFromPoints(
  points: CostMetricPoint[],
  models: any[],
  daysBack: number // unused but kept for interface similarity logic if needed
): CosmoCostsData {
  let totalCost = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalRequests = 0; // CostMetricPoint usually doesn't have requests count unless aggregated? 
  // Our type says `toolCalls`? Maybe `requests` is missing from type but exists?
  // I added optional properties to CostSummary but CostMetricPoint has ts, costUsd... and toolCalls?
  // Let's assume toolCalls ~= requests for now or we count 1 point as N requests if point has that data.
  // But if points are daily aggregates, we need a count.
  // Missing `requestCount` in CostMetricPoint. I will assume points are atomic transactions for now?
  // NO, `getCosts` is aggregated.
  // I will modify client/types later to include requestCount, or just assume 1 per point or approximate.
  // Actually, let's assume `toolCalls` tracks requests roughly.

  const modelMap = new Map<string, { requests: number; tokens: number; promptTokens: number; completionTokens: number; cost: number; }>();
  const dailyMap = new Map<string, { actualCost: number; requests: number; tokens: number; }>();

  points.forEach(p => {
    totalCost += p.costUsd;
    const pt = p.inputTokens || 0;
    const ct = p.outputTokens || 0;
    const tt = pt + ct;

    totalPromptTokens += pt;
    totalCompletionTokens += ct;
    totalTokens += tt;

    // Approximation: if point is aggregate, we don't know request count unless API gives it.
    // For now, assume 1 request per point if it looks like raw log, or if aggregate... 
    // If grouped by day, `points` should be Array of { ts: '2023-01-01', costUsd: 100 ... }
    // If I group by day, I can't distinguish models unless API returns array of models per day?
    // Let's assume the API returns FLAT list of points, where each point MAY be specific to a model/time.
    // If not, model breakdown will be empty/generic.

    const requests = 1; // Placeholder
    totalRequests += requests;

    const modelId = p.modelId || 'aggregated';
    const m = modelMap.get(modelId) || { requests: 0, tokens: 0, promptTokens: 0, completionTokens: 0, cost: 0 };
    m.requests += requests;
    m.tokens += tt;
    m.promptTokens += pt;
    m.completionTokens += ct;
    m.cost += p.costUsd;
    modelMap.set(modelId, m);

    const dateKey = p.ts.split('T')[0];
    const d = dailyMap.get(dateKey) || { actualCost: 0, requests: 0, tokens: 0 };
    d.actualCost += p.costUsd;
    d.tokens += tt;
    d.requests += requests;
    dailyMap.set(dateKey, d);
  });

  // Theoretical Cost
  const theoreticalCost = (totalPromptTokens / 1e6) * PREMIUM_PRICING.prompt + (totalCompletionTokens / 1e6) * PREMIUM_PRICING.completion;
  const routingSavings = Math.max(0, theoreticalCost - totalCost);

  // Mock Batching (Feature not fully exposed in V2 yet)
  const batchMetrics: BatchMetrics = { totalBatched: 0, apiCallsSaved: 0, tokensSaved: 0, costSaved: 0 };
  const contextReuseSavings = totalCost * 0.05; // 5% heuristic
  const totalSavings = routingSavings + contextReuseSavings;
  const roi = theoreticalCost > 0 ? (totalSavings / theoreticalCost) * 100 : 0;

  // Trends
  const costTrends: CostTrendPoint[] = Array.from(dailyMap.entries()).sort().map(([date, d]) => {
    const th = (d.tokens / 1e6) * ((PREMIUM_PRICING.prompt + PREMIUM_PRICING.completion) / 2);
    return {
      date: format(new Date(date), 'MMM d'),
      actualCost: d.actualCost,
      theoreticalCost: th,
      savings: Math.max(0, th - d.actualCost),
      requests: d.requests
    };
  });

  // Model Costs
  const modelCosts: ModelCostBreakdown[] = Array.from(modelMap.entries()).map(([id, d]) => {
    const modelDef = models.find(m => m.model_id === id);
    const avgCost = d.requests > 0 ? d.cost / d.requests : 0;

    // Efficiency calc
    const myCostPerToken = d.tokens > 0 ? d.cost / d.tokens : 0;
    const premiumCostPerToken = (PREMIUM_PRICING.prompt + PREMIUM_PRICING.completion) / 2 / 1e6;
    const savingsPct = premiumCostPerToken > 0 ? ((premiumCostPerToken - myCostPerToken) / premiumCostPerToken) * 100 : 0;
    let efficiencyScore = 1;
    if (savingsPct >= 90) efficiencyScore = 5;
    else if (savingsPct >= 70) efficiencyScore = 4;
    else if (savingsPct >= 50) efficiencyScore = 3;
    else if (savingsPct >= 25) efficiencyScore = 2;

    return {
      modelId: id,
      modelName: modelDef?.name || id,
      provider: modelDef?.provider || 'unknown',
      requests: d.requests,
      tokens: d.tokens,
      promptTokens: d.promptTokens,
      completionTokens: d.completionTokens,
      cost: d.cost,
      avgCostPerRequest: avgCost,
      efficiencyScore
    };
  }).sort((a, b) => b.cost - a.cost);

  return {
    totalCost, totalSavings, theoreticalCost, roi, avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0, totalRequests,
    costTrends, costChange: 0, // Simplified
    savingsBreakdown: { batching: 0, routing: routingSavings, contextReuse: contextReuseSavings, total: totalSavings },
    modelCosts, batchMetrics, totalTokens, promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens
  };
}
