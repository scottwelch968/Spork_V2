import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '@/admin/ui';
import { supabase } from '@/integrations/supabase/client';

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="border border-admin-border/50 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Trial Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trialUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Approaching Limits */}
      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Users Approaching Limits</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Users who have used more than 80% of their quota</CardDescription>
        </CardHeader>
        <CardContent>
          {approachingLimits.length === 0 ? (
            <p className="text-sm text-admin-text-muted">No users approaching limits</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">User</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Email</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Tier</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approachingLimits.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.userName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.tierName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={user.usagePercent >= 90
                          ? 'bg-admin-error/10 text-admin-error border-admin-error/20 text-[10px] font-bold uppercase tracking-wider'
                          : 'bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20 text-[10px] font-bold uppercase tracking-wider'}
                      >
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
      <Card className="border border-admin-border/50 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider">Suspended Accounts</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted opacity-70">Accounts that have been suspended due to quota violations</CardDescription>
        </CardHeader>
        <CardContent>
          {suspendedAccounts.length === 0 ? (
            <p className="text-sm text-admin-text-muted">No suspended accounts</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">User</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Email</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Suspended Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspendedAccounts.map((account) => (
                  <TableRow key={account.userId}>
                    <TableCell className="font-medium">{account.userName}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.suspendedAt}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-admin-error/10 text-admin-error border-admin-error/20 text-[10px] font-bold uppercase tracking-wider">
                        {account.reason}
                      </Badge>
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
