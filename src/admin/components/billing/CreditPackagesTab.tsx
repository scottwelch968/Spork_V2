import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Textarea } from '@/admin/ui/textarea';
import { Label } from '@/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Badge } from '@/admin/ui/badge';
import { Switch } from '@/admin/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/admin/ui/dialog';
import { useCreditPackages, type CreditPackage } from '@/hooks/useCreditPackages';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

export const CreditPackagesTab = () => {
  const { packages, isLoading, createPackage, updatePackage, deletePackage } = useCreditPackages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credit_type: 'tokens',
    credits_amount: 0,
    price_usd: 0,
    bonus_credits: 0,
    is_active: true,
    display_order: 0,
  });

  const handleOpenDialog = (pkg?: CreditPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || '',
        credit_type: pkg.credit_type,
        credits_amount: pkg.credits_amount,
        price_usd: pkg.price_usd,
        bonus_credits: pkg.bonus_credits || 0,
        is_active: pkg.is_active,
        display_order: pkg.display_order || 0,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        credit_type: 'tokens',
        credits_amount: 0,
        price_usd: 0,
        bonus_credits: 0,
        is_active: true,
        display_order: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.credit_type || formData.credits_amount <= 0 || formData.price_usd <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const success = editingPackage
      ? await updatePackage(editingPackage.id, formData)
      : await createPackage(formData);

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this credit package?')) {
      await deletePackage(id);
    }
  };

  const getCreditTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      tokens: 'Tokens',
      images: 'Images',
      videos: 'Videos',
      universal: 'Universal',
    };
    return labels[type] || type;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Credit Packages</h2>
          <p className="text-admin-text-muted">Manage purchasable credit packages for users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Credit Package' : 'Create Credit Package'}</DialogTitle>
              <DialogDescription>
                {editingPackage ? 'Update the credit package details below' : 'Create a new credit package for users to purchase'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Starter Pack"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_type">Credit Type *</Label>
                  <Select
                    value={formData.credit_type}
                    onValueChange={(value) => setFormData({ ...formData, credit_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tokens">Tokens</SelectItem>
                      <SelectItem value="images">Images</SelectItem>
                      <SelectItem value="videos">Videos</SelectItem>
                      <SelectItem value="universal">Universal (All Types)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this package"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="credits_amount">Credits Amount *</Label>
                  <Input
                    id="credits_amount"
                    type="number"
                    min="0"
                    value={formData.credits_amount}
                    onChange={(e) => setFormData({ ...formData, credits_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus_credits">Bonus Credits</Label>
                  <Input
                    id="bonus_credits"
                    type="number"
                    min="0"
                    value={formData.bonus_credits}
                    onChange={(e) => setFormData({ ...formData, bonus_credits: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_usd">Price (USD) *</Label>
                  <Input
                    id="price_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_usd}
                    onChange={(e) => setFormData({ ...formData, price_usd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingPackage ? 'Update' : 'Create'} Package
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-admin-accent" />
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                </div>
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {pkg.description && (
                <CardDescription className="mt-2">{pkg.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-admin-text-muted">Type:</span>
                  <Badge variant="outline">{getCreditTypeLabel(pkg.credit_type)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-admin-text-muted">Credits:</span>
                  <span className="font-semibold">
                    {pkg.credits_amount.toLocaleString()}
                    {pkg.bonus_credits ? ` +${pkg.bonus_credits}` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-admin-text-muted">Price:</span>
                  <span className="font-semibold text-lg">${pkg.price_usd.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenDialog(pkg)}
                >
                  <Pencil className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-admin-error hover:bg-admin-error hover:text-destructive-foreground"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-admin-text-muted" />
            <p className="text-admin-text-muted">No credit packages yet</p>
            <p className="text-sm text-admin-text-muted mt-1">
              Click "Add Package" to create your first credit package
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
