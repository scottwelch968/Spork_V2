import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TimePeriod = 'daily' | 'weekly' | 'monthly';

interface TimePeriodSelectorProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

export const TimePeriodSelector = ({ value, onChange }: TimePeriodSelectorProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TimePeriod)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="daily">Last 7 Days</SelectItem>
        <SelectItem value="weekly">Last 30 Days</SelectItem>
        <SelectItem value="monthly">Last 90 Days</SelectItem>
      </SelectContent>
    </Select>
  );
};
