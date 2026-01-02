import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface OverviewStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  trialUsers: number;
}

interface ApproachingLimit {
  userId: string;
  userName: string;
  email: string;
  usagePercent: number;
  tierName: string;
}

interface SuspendedAccount {
  userId: string;
  userName: string;
  email: string;
  suspendedAt: string;
  reason: string;
}

export function UsageOverviewTab() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    trialUsers: 0,
  });
  const [approachingLimits, setApproachingLimits] = useState<ApproachingLimit[]>([]);
  const [suspendedAccounts, setSuspendedAccounts] = useState<SuspendedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { data: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_tiers(*)')
        .eq('status', 'active');

      // Calculate monthly revenue
      const monthlyRevenue = activeSubscriptions?.reduce((sum, sub) => {
        return sum + (sub.subscription_tiers?.monthly_price || 0);
      }, 0) || 0;

      // Get trial users
      const { count: trialUsers } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_trial', true)
        .eq('status', 'active');

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
        monthlyRevenue,
        trialUsers: trialUsers || 0,
      });

      // Get users approaching limits (>80% usage)
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select(`
          *,
          profiles!inner(first_name, last_name, email),
          user_subscriptions!inner(
            subscription_tiers(name)
          )
        `);

      const approachingLimitsData = usageData
        ?.map(usage => {
          const usagePercent = Math.round(
            ((usage.tokens_input_used || 0) / (usage.tokens_input_quota || 1)) * 100
          );
          const profile = usage.profiles as any;
          const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
          return {
            userId: usage.user_id,
            userName: displayName,
            email: profile?.email || '',
            usagePercent,
            tierName: usage.user_subscriptions?.subscription_tiers?.name || 'Unknown',
          };
        })
        .filter(user => user.usagePercent >= 80) || [];

      setApproachingLimits(approachingLimitsData);

      // Get suspended accounts
      const { data: suspendedData } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .eq('status', 'suspended');

      const suspendedAccountsData = suspendedData?.map(sub => {
        const profile = sub.profiles as any;
        const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
        return {
          userId: sub.user_id,
          userName: displayName,
          email: profile?.email || '',
          suspendedAt: new Date(sub.updated_at || '').toLocaleDateString(),
          reason: 'Quota exceeded',
        };
      }) || [];

      setSuspendedAccounts(suspendedAccountsData);
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Approaching Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Users Approaching Limits</CardTitle>
          <CardDescription>Users who have used more than 80% of their quota</CardDescription>
        </CardHeader>
        <CardContent>
          {approachingLimits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users approaching limits</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approachingLimits.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.tierName}</TableCell>
                    <TableCell>
                      <Badge variant={user.usagePercent >= 90 ? 'destructive' : 'secondary'}>
                        {user.usagePercent}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Suspended Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Suspended Accounts</CardTitle>
          <CardDescription>Accounts that have been suspended due to quota violations</CardDescription>
        </CardHeader>
        <CardContent>
          {suspendedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suspended accounts</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Suspended Date</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspendedAccounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.userName}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.suspendedAt}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{account.reason}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}