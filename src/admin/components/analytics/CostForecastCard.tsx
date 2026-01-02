import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/admin/ui';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
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
      color: "var(--admin-accent)",
    },
    forecasted: {
      label: "Forecasted Cost",
      color: "var(--admin-secondary-text)",
    },
  };

  const TrendIcon = forecast.trend === 'increasing'
    ? TrendingUp
    : forecast.trend === 'decreasing'
      ? TrendingDown
      : Minus;

  const trendColor = forecast.trend === 'increasing'
    ? 'text-admin-warning'
    : forecast.trend === 'decreasing'
      ? 'text-admin-success'
      : 'text-admin-text-muted';

  const confidenceColor = forecast.confidence === 'high'
    ? 'bg-admin-success/10 text-admin-success border-admin-success/20'
    : forecast.confidence === 'medium'
      ? 'bg-admin-warning/10 text-admin-warning border-admin-warning/20'
      : 'bg-admin-error/10 text-admin-error border-admin-error/20';

  const chartData = forecast.predictedCosts.map(point => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actualCost: point.isForecasted ? null : point.cost,
    forecastedCost: point.isForecasted ? point.cost : null,
  }));

  return (
    <Card className="border border-admin-border/50 rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Cost Forecast</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">
              Predicted costs based on historical trends
            </CardDescription>
          </div>
          <Select value={forecastDays.toString()} onValueChange={(val) => setForecastDays(Number(val))}>
            <SelectTrigger className="w-28">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-admin-muted-text">Predicted Total</p>
            <p className="text-xl font-bold text-admin-text">${forecast.totalPredictedCost.toFixed(2)}</p>
            <p className="text-[10px] text-admin-muted-text">Next {forecastDays} days</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-admin-muted-text">Daily Average</p>
            <p className="text-xl font-bold text-admin-text">${forecast.dailyAverageCost.toFixed(2)}</p>
            <div className="flex items-center gap-2">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {forecast.trendPercentage.toFixed(1)}% {forecast.trend}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-admin-muted-text">Confidence Level</p>
            <Badge className={confidenceColor} variant="outline">
              {forecast.confidence.toUpperCase()}
            </Badge>
            {forecast.confidence === 'low' && (
              <div className="flex items-start gap-2 mt-2">
                <AlertCircle className="h-4 w-4 text-admin-warning mt-0.5" />
                <p className="text-[10px] text-admin-text-muted">
                  Limited historical data. Forecast may be less accurate.
                </p>
              </div>
            )}
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--admin-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--admin-accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--admin-secondary-text)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--admin-secondary-text)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="hsl(var(--admin-text-muted))"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--admin-text-muted))"
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any) => [`$${Number(value).toFixed(4)}`, '']}
              />
              <ReferenceLine
                x={chartData.findIndex(d => d.forecastedCost !== null) - 1}
                stroke="var(--admin-text-muted)"
                strokeDasharray="3 3"
                label={{ value: 'Forecast Start', position: 'top', fill: 'var(--admin-text-muted)', fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="actualCost"
                stroke="var(--admin-accent)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActual)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecastedCost"
                stroke="var(--admin-secondary-text)"
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
