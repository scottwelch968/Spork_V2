import { useState } from 'react';
import { useAdminSpaces } from '@/hooks/useAdminSpaces';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function SpaceAnalyticsTab() {
  const { analytics, spaces } = useAdminSpaces();
  const [timePeriod, setTimePeriod] = useState('30');

  if (!analytics) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  // Calculate spaces created over time
  const getSpacesOverTime = () => {
    const days = parseInt(timePeriod);
    const dateMap = new Map<string, number>();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'MMM dd');
      dateMap.set(date, 0);
    }

    analytics.spacesOverTime
      .filter(s => {
        const createdDate = parseISO(s.created_at);
        const cutoffDate = subDays(new Date(), days);
        return createdDate >= cutoffDate;
      })
      .forEach(space => {
        const date = format(parseISO(space.created_at), 'MMM dd');
        if (dateMap.has(date)) {
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        }
      });

    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      spaces: count,
    }));
  };

  // Top spaces by token usage
  const topSpacesByTokens = spaces
    ?.sort((a, b) => b.tokenUsage30d - a.tokenUsage30d)
    .slice(0, 10)
    .map(s => ({
      name: s.name.substring(0, 20),
      tokens: s.tokenUsage30d,
    })) || [];

  // Top spaces by storage
  const topSpacesByStorage = spaces
    ?.sort((a, b) => b.storageUsedMB - a.storageUsedMB)
    .slice(0, 10)
    .map(s => ({
      name: s.name.substring(0, 20),
      storage: s.storageUsedMB,
    })) || [];

  // Spaces by status
  const spacesByStatus = [
    { name: 'Active', value: analytics.activeSpaces },
    { name: 'Suspended', value: analytics.suspendedSpaces },
    { name: 'Archived', value: analytics.archivedSpaces },
  ];

  const handleExport = () => {
    const data = {
      summary: analytics,
      spaces: spaces,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spaces-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Spaces</div>
          <div className="text-2xl font-bold mt-2">{analytics.totalSpaces}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Active Spaces</div>
          <div className="text-2xl font-bold mt-2 text-green-600">{analytics.activeSpaces}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Storage</div>
          <div className="text-2xl font-bold mt-2">{analytics.totalStorageGB.toFixed(2)} GB</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Tokens</div>
          <div className="text-2xl font-bold mt-2">{(analytics.totalTokens / 1000000).toFixed(2)}M</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Chats</div>
          <div className="text-2xl font-bold mt-2">{analytics.totalChats}</div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Members</div>
          <div className="text-2xl font-bold mt-2">{analytics.totalMembers}</div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spaces Created Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getSpacesOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="spaces" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spaces by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spacesByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {spacesByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Spaces by Token Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSpacesByTokens} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="tokens" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Spaces by Storage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSpacesByStorage} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="storage" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
