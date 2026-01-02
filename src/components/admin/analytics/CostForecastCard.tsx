import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { forecastCosts, ForecastResult } from '@/utils/costForecasting';
import { useState, useMemo } from 'react';

interface CostForecastCardProps {
  historicalData: Array<{ date: string; cost: number }>;
}

export const CostForecastCard = ({ historicalData }: CostForecastCardProps) => {
  const [forecastDays, setForecastDays] = useState<number>(30);

  const forecast: ForecastResult = useMemo(() => {
    return forecastCosts(historicalData, forecastDays);
  }, [historicalData, forecastDays]);

  const chartConfig = {
    cost: {
      label: "Actual Cost",
      color: "hsl(var(--primary))",
    },
    forecasted: {
      label: "Forecasted Cost",
      color: "hsl(var(--chart-2))",
    },
  };

  const TrendIcon = forecast.trend === 'increasing' 
    ? TrendingUp 
    : forecast.trend === 'decreasing' 
    ? TrendingDown 
    : Minus;

  const trendColor = forecast.trend === 'increasing' 
    ? 'text-orange-500' 
    : forecast.trend === 'decreasing' 
    ? 'text-green-500' 
    : 'text-muted-foreground';

  const confidenceColor = forecast.confidence === 'high'
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : forecast.confidence === 'medium'
    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    : 'bg-red-500/10 text-red-500 border-red-500/20';

  // Split data into historical and forecasted
  const chartData = forecast.predictedCosts.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actualCost: point.isForecasted ? null : point.cost,
    forecastedCost: point.isForecasted ? point.cost : null,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cost Forecast</CardTitle>
            <CardDescription>Predicted costs based on historical trends</CardDescription>
          </div>
          <Select value={forecastDays.toString()} onValueChange={(val) => setForecastDays(Number(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Forecast Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Predicted Total</p>
            <p className="text-2xl font-bold">${forecast.totalPredictedCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Next {forecastDays} days</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Daily Average</p>
            <p className="text-2xl font-bold">${forecast.dailyAverageCost.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`text-sm font-medium ${trendColor}`}>
                {forecast.trendPercentage.toFixed(1)}% {forecast.trend}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Confidence Level</p>
            <Badge className={confidenceColor} variant="outline">
              {forecast.confidence.toUpperCase()}
            </Badge>
            {forecast.confidence === 'low' && (
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Limited historical data. Forecast may be less accurate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Forecast Chart */}
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: any) => [`$${Number(value).toFixed(4)}`, '']}
              />
              <ReferenceLine 
                x={chartData.findIndex(d => d.forecastedCost !== null) - 1} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3"
                label={{ value: 'Forecast Start', position: 'top', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Area 
                type="monotone" 
                dataKey="actualCost" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorActual)"
                connectNulls={false}
              />
              <Area 
                type="monotone" 
                dataKey="forecastedCost" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorForecast)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
