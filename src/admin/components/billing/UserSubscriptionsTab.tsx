import { useState } from 'react';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { Card, CardContent } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Badge } from '@/admin/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Ban, CheckCircle, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

export const UserSubscriptionsTab = () => {
  const { subscriptions, isLoading, updateSubscriptionStatus, cancelSubscription } = useUserSubscriptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getDisplayName = (profile: { first_name: string; last_name: string; email: string }) => {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    return name || 'N/A';
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const displayName = getDisplayName(sub.profiles);
    const matchesSearch = 
      sub.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subscription_tiers.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      suspended: 'secondary',
      cancelled: 'destructive',
      expired: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTrialBadge = (subscription: any) => {
    if (!subscription.is_trial) return null;
    
    const isExpired = subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
    return (
      <Badge variant={isExpired ? 'destructive' : 'secondary'}>
        Trial {isExpired ? 'Expired' : `until ${format(new Date(subscription.trial_ends_at), 'MMM d')}`}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Loading subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">User Subscriptions</h3>
        <p className="text-sm text-admin-text-muted">View and manage user subscription status</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-text-muted" />
          <Input
            placeholder="Search by user email, name, or tier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trial</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Processor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getDisplayName(sub.profiles)}</div>
                      <div className="text-sm text-admin-text-muted">{sub.profiles.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.subscription_tiers.name}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>{getTrialBadge(sub)}</TableCell>
                  <TableCell>
                    {sub.current_period_start && sub.current_period_end ? (
                      <div className="text-sm">
                        {format(new Date(sub.current_period_start), 'MMM d')} - {format(new Date(sub.current_period_end), 'MMM d')}
                      </div>
                    ) : (
                      <span className="text-admin-text-muted">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.payment_processor ? (
                      <Badge variant="outline">{sub.payment_processor}</Badge>
                    ) : (
                      <span className="text-admin-text-muted">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateSubscriptionStatus(sub.id, 'suspended')}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {sub.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(sub.status === 'active' || sub.status === 'suspended') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelSubscription(sub.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
