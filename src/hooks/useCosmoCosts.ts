import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

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
  efficiencyScore: number; // 1-5 stars based on cost efficiency
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
  // Summary metrics
  totalCost: number;
  totalSavings: number;
  theoreticalCost: number;
  roi: number; // (savings / theoreticalCost) * 100
  avgCostPerRequest: number;
  totalRequests: number;
  
  // Trends
  costTrends: CostTrendPoint[];
  costChange: number; // percentage change from previous period
  
  // Breakdowns
  savingsBreakdown: SavingsBreakdown;
  modelCosts: ModelCostBreakdown[];
  batchMetrics: BatchMetrics;
  
  // Tokens
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

// Premium model pricing for theoretical cost calculation (per 1M tokens)
const PREMIUM_PRICING = {
  prompt: 2.50, // GPT-4o level
  completion: 10.00,
};

export function useCosmoCosts(timeRange: TimeRange = '30d') {
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));
  const endDate = endOfDay(new Date());

  // Fetch debug logs for cost calculations
  const { data: debugLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['cosmo-costs-logs', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmo_debug_logs')
        .select('id, created_at, selected_model, model_provider, prompt_tokens, completion_tokens, total_tokens, cost, success')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });

  // Fetch batch stats
  const { data: batchData, isLoading: batchLoading } = useQuery({
    queryKey: ['cosmo-costs-batches', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmo_request_batches')
        .select('id, status, api_calls_saved, tokens_saved, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });

  // Fetch model pricing for efficiency calculations
  const { data: modelPricing } = useQuery({
    queryKey: ['ai-models-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('model_id, name, provider, pricing_prompt, pricing_completion')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    staleTime: 300000, // 5 minutes
  });

  // Calculate all metrics
  const costsData: CosmoCostsData = calculateCostsData(
    debugLogs || [],
    batchData || [],
    modelPricing || [],
    daysBack
  );

  return {
    ...costsData,
    isLoading: logsLoading || batchLoading,
    timeRange,
  };
}

function calculateCostsData(
  logs: Array<{
    id: string;
    created_at: string;
    selected_model: string | null;
    model_provider: string | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    total_tokens: number | null;
    cost: number | null;
    success: boolean | null;
  }>,
  batches: Array<{
    id: string;
    status: string;
    api_calls_saved: number | null;
    tokens_saved: number | null;
    created_at: string;
  }>,
  pricing: Array<{
    model_id: string;
    name: string;
    provider: string;
    pricing_prompt: number | null;
    pricing_completion: number | null;
  }>,
  daysBack: number
): CosmoCostsData {
  // Initialize accumulators
  let totalCost = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalRequests = logs.length;

  // Model breakdown map
  const modelMap = new Map<string, {
    requests: number;
    tokens: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    provider: string;
    name: string;
  }>();

  // Daily cost aggregation for trends
  const dailyCosts = new Map<string, {
    actualCost: number;
    requests: number;
    tokens: number;
  }>();

  // Process each log entry
  logs.forEach((log) => {
    const cost = log.cost || 0;
    const promptTokens = log.prompt_tokens || 0;
    const completionTokens = log.completion_tokens || 0;
    const tokens = log.total_tokens || (promptTokens + completionTokens);

    totalCost += cost;
    totalPromptTokens += promptTokens;
    totalCompletionTokens += completionTokens;
    totalTokens += tokens;

    // Model breakdown
    const modelId = log.selected_model || 'unknown';
    const existing = modelMap.get(modelId) || {
      requests: 0,
      tokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      cost: 0,
      provider: log.model_provider || 'unknown',
      name: modelId.split('/').pop() || modelId,
    };
    
    existing.requests++;
    existing.tokens += tokens;
    existing.promptTokens += promptTokens;
    existing.completionTokens += completionTokens;
    existing.cost += cost;
    modelMap.set(modelId, existing);

    // Daily aggregation
    const dateKey = format(new Date(log.created_at), 'yyyy-MM-dd');
    const dayData = dailyCosts.get(dateKey) || { actualCost: 0, requests: 0, tokens: 0 };
    dayData.actualCost += cost;
    dayData.requests++;
    dayData.tokens += tokens;
    dailyCosts.set(dateKey, dayData);
  });

  // Calculate theoretical cost (what it would cost using premium model)
  const theoreticalCost = 
    (totalPromptTokens / 1_000_000) * PREMIUM_PRICING.prompt +
    (totalCompletionTokens / 1_000_000) * PREMIUM_PRICING.completion;

  // Calculate savings
  const routingSavings = Math.max(0, theoreticalCost - totalCost);

  // Batch metrics
  const batchMetrics: BatchMetrics = {
    totalBatched: batches.length,
    apiCallsSaved: batches.reduce((sum, b) => sum + (b.api_calls_saved || 0), 0),
    tokensSaved: batches.reduce((sum, b) => sum + (b.tokens_saved || 0), 0),
    costSaved: 0,
  };
  
  // Estimate batch cost savings (tokens saved * average cost per token)
  const avgCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
  batchMetrics.costSaved = batchMetrics.tokensSaved * avgCostPerToken;

  // Context reuse savings estimate (conservative 5% of total)
  const contextReuseSavings = totalCost * 0.05;

  const totalSavings = routingSavings + batchMetrics.costSaved + contextReuseSavings;
  const roi = theoreticalCost > 0 ? (totalSavings / theoreticalCost) * 100 : 0;

  // Build cost trends
  const costTrends: CostTrendPoint[] = [];
  const sortedDates = Array.from(dailyCosts.keys()).sort();
  
  sortedDates.forEach((date) => {
    const dayData = dailyCosts.get(date)!;
    const theoreticalForDay = (dayData.tokens / 1_000_000) * ((PREMIUM_PRICING.prompt + PREMIUM_PRICING.completion) / 2);
    
    costTrends.push({
      date: format(new Date(date), 'MMM d'),
      actualCost: Number(dayData.actualCost.toFixed(4)),
      theoreticalCost: Number(theoreticalForDay.toFixed(4)),
      savings: Number(Math.max(0, theoreticalForDay - dayData.actualCost).toFixed(4)),
      requests: dayData.requests,
    });
  });

  // Calculate cost change percentage
  let costChange = 0;
  if (costTrends.length >= 2) {
    const midpoint = Math.floor(costTrends.length / 2);
    const firstHalfTotal = costTrends.slice(0, midpoint).reduce((sum, d) => sum + d.actualCost, 0);
    const secondHalfTotal = costTrends.slice(midpoint).reduce((sum, d) => sum + d.actualCost, 0);
    if (firstHalfTotal > 0) {
      costChange = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
    }
  }

  // Build model cost breakdown with efficiency scores
  const modelCosts: ModelCostBreakdown[] = Array.from(modelMap.entries())
    .map(([modelId, data]) => {
      // Find pricing for this model
      const modelPricing = pricing.find((p) => p.model_id === modelId);
      const avgCostPerRequest = data.requests > 0 ? data.cost / data.requests : 0;
      
      // Efficiency score: compare to premium pricing
      // 5 stars = 90%+ cheaper, 1 star = same or more expensive
      const modelCostPerToken = data.tokens > 0 ? data.cost / data.tokens : 0;
      const premiumCostPerToken = (PREMIUM_PRICING.prompt + PREMIUM_PRICING.completion) / 2 / 1_000_000;
      const savingsPercent = premiumCostPerToken > 0 
        ? ((premiumCostPerToken - modelCostPerToken) / premiumCostPerToken) * 100 
        : 0;
      
      let efficiencyScore = 1;
      if (savingsPercent >= 90) efficiencyScore = 5;
      else if (savingsPercent >= 70) efficiencyScore = 4;
      else if (savingsPercent >= 50) efficiencyScore = 3;
      else if (savingsPercent >= 25) efficiencyScore = 2;

      return {
        modelId,
        modelName: modelPricing?.name || data.name,
        provider: modelPricing?.provider || data.provider,
        requests: data.requests,
        tokens: data.tokens,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        cost: Number(data.cost.toFixed(6)),
        avgCostPerRequest: Number(avgCostPerRequest.toFixed(6)),
        efficiencyScore,
      };
    })
    .sort((a, b) => b.cost - a.cost); // Sort by cost descending

  return {
    totalCost: Number(totalCost.toFixed(6)),
    totalSavings: Number(totalSavings.toFixed(6)),
    theoreticalCost: Number(theoreticalCost.toFixed(6)),
    roi: Number(roi.toFixed(1)),
    avgCostPerRequest: totalRequests > 0 ? Number((totalCost / totalRequests).toFixed(6)) : 0,
    totalRequests,
    costTrends,
    costChange: Number(costChange.toFixed(1)),
    savingsBreakdown: {
      batching: Number(batchMetrics.costSaved.toFixed(6)),
      routing: Number(routingSavings.toFixed(6)),
      contextReuse: Number(contextReuseSavings.toFixed(6)),
      total: Number(totalSavings.toFixed(6)),
    },
    modelCosts,
    batchMetrics,
    totalTokens,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
  };
}
