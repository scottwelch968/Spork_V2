import { useSubscriptionTiers } from '@/hooks/useSubscriptionTiers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { Badge } from '@/admin/ui/badge';

export const StorageQuotasTab = () => {
  const { tiers, isLoading } = useSubscriptionTiers();

  const formatStorage = (mb: number | null) => {
    if (!mb) return 'Unlimited';
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  if (isLoading) {
    return <div>Loading storage quotas...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Quotas by Tier</CardTitle>
          <CardDescription>
            File storage limits for each subscription tier. Configure these in the Billing section.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Storage Quota</TableHead>
                <TableHead>Monthly Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell className="font-medium">{tier.name}</TableCell>
                  <TableCell>
                    <Badge variant={tier.tier_type === 'trial' ? 'secondary' : 'default'}>
                      {tier.tier_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatStorage(tier.monthly_file_storage_quota_mb)}
                  </TableCell>
                  <TableCell>${tier.monthly_price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About File Storage Quotas</CardTitle>
          <CardDescription>
            How file storage quotas work in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-admin-text-muted">
          <p>
            • Each subscription tier has a monthly file storage quota measured in megabytes (MB)
          </p>
          <p>
            • Users are limited by their tier's quota when uploading files to the Files section
          </p>
          <p>
            • "Unlimited" means no storage restrictions for that tier
          </p>
          <p>
            • To modify storage quotas, go to Admin → Billing → Subscription Tiers
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
