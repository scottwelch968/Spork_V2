// Cost forecasting utilities using linear regression and moving averages

export interface ForecastResult {
  predictedCosts: Array<{ date: string; cost: number; isForecasted: boolean }>;
  totalPredictedCost: number;
  dailyAverageCost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface HistoricalDataPoint {
  date: string;
  cost: number;
}

/**
 * Calculate linear regression coefficients (slope and intercept)
 */
const linearRegression = (data: number[]): { slope: number; intercept: number } => {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

/**
 * Calculate moving average for smoothing data
 */
const movingAverage = (data: number[], windowSize: number = 7): number[] => {
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(avg);
  }
  
  return result;
};

/**
 * Determine confidence level based on data consistency
 */
const calculateConfidence = (data: number[]): 'high' | 'medium' | 'low' => {
  if (data.length < 7) return 'low';
  if (data.length < 14) return 'medium';

  // Calculate variance
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  // Lower variation = higher confidence
  if (coefficientOfVariation < 30) return 'high';
  if (coefficientOfVariation < 60) return 'medium';
  return 'low';
};

/**
 * Forecast future costs based on historical data
 */
export const forecastCosts = (
  historicalData: HistoricalDataPoint[],
  forecastDays: number = 30
): ForecastResult => {
  // Sort by date
  const sortedData = [...historicalData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Extract cost values
  const costs = sortedData.map(d => d.cost);
  
  if (costs.length === 0) {
    return {
      predictedCosts: [],
      totalPredictedCost: 0,
      dailyAverageCost: 0,
      trend: 'stable',
      trendPercentage: 0,
      confidence: 'low',
    };
  }

  // Calculate smoothed data using moving average
  const smoothedCosts = movingAverage(costs, Math.min(7, costs.length));

  // Calculate linear regression on smoothed data
  const { slope, intercept } = linearRegression(smoothedCosts);

  // Calculate daily average
  const dailyAverageCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  const trendPercentage = (slope / dailyAverageCost) * 100;
  
  if (Math.abs(trendPercentage) < 5) {
    trend = 'stable';
  } else if (slope > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  // Generate forecasted data points
  const lastDate = new Date(sortedData[sortedData.length - 1].date);
  const predictedCosts: Array<{ date: string; cost: number; isForecasted: boolean }> = [];

  // Include last 30 days of historical data
  const historicalDaysToShow = Math.min(30, sortedData.length);
  for (let i = sortedData.length - historicalDaysToShow; i < sortedData.length; i++) {
    predictedCosts.push({
      date: sortedData[i].date,
      cost: sortedData[i].cost,
      isForecasted: false,
    });
  }

  // Generate forecast
  let totalPredictedCost = 0;
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Predict using linear regression
    const predictedValue = slope * (costs.length + i - 1) + intercept;
    
    // Ensure non-negative prediction
    const predictedCost = Math.max(0, predictedValue);
    totalPredictedCost += predictedCost;

    predictedCosts.push({
      date: forecastDate.toISOString().split('T')[0],
      cost: predictedCost,
      isForecasted: true,
    });
  }

  const confidence = calculateConfidence(costs);

  return {
    predictedCosts,
    totalPredictedCost,
    dailyAverageCost,
    trend,
    trendPercentage: Math.abs(trendPercentage),
    confidence,
  };
};

/**
 * Calculate cost breakdown by category for forecasting
 */
export const forecastCostsByModel = (
  historicalData: any[],
  forecastDays: number = 30
): Record<string, ForecastResult> => {
  // Group by model
  const modelGroups: Record<string, HistoricalDataPoint[]> = {};

  historicalData.forEach(item => {
    if (!modelGroups[item.model]) {
      modelGroups[item.model] = [];
    }
    modelGroups[item.model].push({
      date: item.date,
      cost: item.cost,
    });
  });

  // Forecast for each model
  const forecasts: Record<string, ForecastResult> = {};
  Object.entries(modelGroups).forEach(([model, data]) => {
    forecasts[model] = forecastCosts(data, forecastDays);
  });

  return forecasts;
};
