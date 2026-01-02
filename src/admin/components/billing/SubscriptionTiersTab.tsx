import { useState } from 'react';
import { useSubscriptionTiers } from '@/hooks/useSubscriptionTiers';
import { useModels } from '@/hooks/useModels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/admin/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/admin/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const SubscriptionTiersTab = () => {
  const { tiers, isLoading, createTier, updateTier, deleteTier } = useSubscriptionTiers();
  const { models } = useModels();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    tier_type: 'paid' as 'trial' | 'paid',
    monthly_token_input_quota: '',
    monthly_token_output_quota: '',
    daily_token_input_limit: '',
    daily_token_output_limit: '',
    monthly_image_quota: '',
    monthly_video_quota: '',
    monthly_document_parsing_quota: '',
    daily_image_limit: '',
    daily_video_limit: '',
    monthly_file_storage_quota_mb: '',
    trial_duration_days: '',
    trial_usage_based: false,
    allowed_models: [] as string[],
    monthly_price: '',
    credit_price_per_unit: '',
    is_active: true,
    display_order: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tierData = {
      ...formData,
      monthly_token_input_quota: formData.monthly_token_input_quota ? parseInt(formData.monthly_token_input_quota) : null,
      monthly_token_output_quota: formData.monthly_token_output_quota ? parseInt(formData.monthly_token_output_quota) : null,
      daily_token_input_limit: formData.daily_token_input_limit ? parseInt(formData.daily_token_input_limit) : null,
      daily_token_output_limit: formData.daily_token_output_limit ? parseInt(formData.daily_token_output_limit) : null,
      monthly_image_quota: formData.monthly_image_quota ? parseInt(formData.monthly_image_quota) : null,
      monthly_video_quota: formData.monthly_video_quota ? parseInt(formData.monthly_video_quota) : null,
      monthly_document_parsing_quota: formData.monthly_document_parsing_quota ? parseInt(formData.monthly_document_parsing_quota) : null,
      daily_image_limit: formData.daily_image_limit ? parseInt(formData.daily_image_limit) : null,
      daily_video_limit: formData.daily_video_limit ? parseInt(formData.daily_video_limit) : null,
      monthly_file_storage_quota_mb: formData.monthly_file_storage_quota_mb ? parseInt(formData.monthly_file_storage_quota_mb) : null,
      trial_duration_days: formData.trial_duration_days ? parseInt(formData.trial_duration_days) : null,
      monthly_price: formData.monthly_price ? parseFloat(formData.monthly_price) : null,
      credit_price_per_unit: formData.credit_price_per_unit ? parseFloat(formData.credit_price_per_unit) : null,
    };

    const success = editingTier
      ? await updateTier(editingTier.id, tierData)
      : await createTier(tierData);

    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tier_type: 'paid',
      monthly_token_input_quota: '',
      monthly_token_output_quota: '',
      daily_token_input_limit: '',
      daily_token_output_limit: '',
      monthly_image_quota: '',
      monthly_video_quota: '',
      monthly_document_parsing_quota: '',
      daily_image_limit: '',
      daily_video_limit: '',
      monthly_file_storage_quota_mb: '',
      trial_duration_days: '',
      trial_usage_based: false,
      allowed_models: [],
      monthly_price: '',
      credit_price_per_unit: '',
      is_active: true,
      display_order: 0,
    });
    setEditingTier(null);
  };

  const handleEdit = (tier: any) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      tier_type: tier.tier_type,
      monthly_token_input_quota: tier.monthly_token_input_quota?.toString() || '',
      monthly_token_output_quota: tier.monthly_token_output_quota?.toString() || '',
      daily_token_input_limit: tier.daily_token_input_limit?.toString() || '',
      daily_token_output_limit: tier.daily_token_output_limit?.toString() || '',
      monthly_image_quota: tier.monthly_image_quota?.toString() || '',
      monthly_video_quota: tier.monthly_video_quota?.toString() || '',
      monthly_document_parsing_quota: tier.monthly_document_parsing_quota?.toString() || '',
      daily_image_limit: tier.daily_image_limit?.toString() || '',
      daily_video_limit: tier.daily_video_limit?.toString() || '',
      monthly_file_storage_quota_mb: tier.monthly_file_storage_quota_mb?.toString() || '',
      trial_duration_days: tier.trial_duration_days?.toString() || '',
      trial_usage_based: tier.trial_usage_based,
      allowed_models: tier.allowed_models || [],
      monthly_price: tier.monthly_price?.toString() || '',
      credit_price_per_unit: tier.credit_price_per_unit?.toString() || '',
      is_active: tier.is_active,
      display_order: tier.display_order,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading subscription tiers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Subscription Tiers</h3>
          <p className="text-sm text-admin-text-muted">Manage subscription plans and quotas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTier ? 'Edit' : 'Create'} Subscription Tier</DialogTitle>
              <DialogDescription>Configure tier quotas, pricing, and settings</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tier Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier_type">Tier Type</Label>
                  <Select value={formData.tier_type} onValueChange={(value: 'trial' | 'paid') => setFormData({ ...formData, tier_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_token_input_quota">Monthly Input Tokens</Label>
                  <Input
                    id="monthly_token_input_quota"
                    type="number"
                    value={formData.monthly_token_input_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_token_input_quota: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_token_output_quota">Monthly Output Tokens</Label>
                  <Input
                    id="monthly_token_output_quota"
                    type="number"
                    value={formData.monthly_token_output_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_token_output_quota: e.target.value })}
                    placeholder="Unlimited if empty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_image_quota">Monthly Images</Label>
                  <Input
                    id="monthly_image_quota"
                    type="number"
                    value={formData.monthly_image_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_image_quota: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_video_quota">Monthly Videos</Label>
                  <Input
                    id="monthly_video_quota"
                    type="number"
                    value={formData.monthly_video_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_video_quota: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_document_parsing_quota">Monthly Docs</Label>
                  <Input
                    id="monthly_document_parsing_quota"
                    type="number"
                    value={formData.monthly_document_parsing_quota}
                    onChange={(e) => setFormData({ ...formData, monthly_document_parsing_quota: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_file_storage_quota_mb">File Storage Quota (MB)</Label>
                <Input
                  id="monthly_file_storage_quota_mb"
                  type="number"
                  value={formData.monthly_file_storage_quota_mb}
                  onChange={(e) => setFormData({ ...formData, monthly_file_storage_quota_mb: e.target.value })}
                  placeholder="Unlimited if empty"
                />
              </div>

              {formData.tier_type === 'trial' && (
                <div className="space-y-2">
                  <Label htmlFor="trial_duration_days">Trial Duration (days)</Label>
                  <Input
                    id="trial_duration_days"
                    type="number"
                    value={formData.trial_duration_days}
                    onChange={(e) => setFormData({ ...formData, trial_duration_days: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_price">Monthly Price ($)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    step="0.01"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingTier ? 'Update' : 'Create'} Tier</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tokens (In/Out)</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Videos</TableHead>
                <TableHead>Storage (MB)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>${tier.monthly_price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {tier.monthly_token_input_quota || '∞'} / {tier.monthly_token_output_quota || '∞'}
                  </TableCell>
                  <TableCell>{tier.monthly_image_quota || '∞'}</TableCell>
                  <TableCell>{tier.monthly_video_quota || '∞'}</TableCell>
                  <TableCell>{tier.monthly_file_storage_quota_mb || '∞'}</TableCell>
                  <TableCell>
                    <Badge variant={tier.is_active ? 'default' : 'secondary'}>
                      {tier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(tier)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteTier(tier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
