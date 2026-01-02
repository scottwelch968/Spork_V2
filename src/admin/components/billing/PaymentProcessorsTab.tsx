import { useState } from 'react';
import { usePaymentProcessors } from '@/hooks/usePaymentProcessors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/admin/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Plus, Edit, Trash2, Copy, Star } from 'lucide-react';
import { toast } from 'sonner';

export const PaymentProcessorsTab = () => {
  const { processors, isLoading, createProcessor, updateProcessor, deleteProcessor, setDefaultProcessor } = usePaymentProcessors();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProcessor, setEditingProcessor] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    processor_type: 'stripe' as 'stripe' | 'paypal',
    is_active: false,
    is_default: false,
    config: {},
    supports_subscriptions: true,
    supports_one_time_payments: true,
    supports_webhooks: true,
    webhook_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = editingProcessor
      ? await updateProcessor(editingProcessor.id, formData)
      : await createProcessor(formData);

    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      processor_type: 'stripe',
      is_active: false,
      is_default: false,
      config: {},
      supports_subscriptions: true,
      supports_one_time_payments: true,
      supports_webhooks: true,
      webhook_url: '',
    });
    setEditingProcessor(null);
  };

  const handleEdit = (processor: any) => {
    setEditingProcessor(processor);
    setFormData({
      name: processor.name,
      processor_type: processor.processor_type,
      is_active: processor.is_active,
      is_default: processor.is_default,
      config: processor.config || {},
      supports_subscriptions: processor.supports_subscriptions,
      supports_one_time_payments: processor.supports_one_time_payments,
      supports_webhooks: processor.supports_webhooks,
      webhook_url: processor.webhook_url || '',
    });
    setIsDialogOpen(true);
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  if (isLoading) {
    return <div>Loading payment processors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Processors</h3>
          <p className="text-sm text-admin-text-muted">Configure payment provider integrations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Processor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProcessor ? 'Edit' : 'Add'} Payment Processor</DialogTitle>
              <DialogDescription>Configure payment processor settings</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Processor Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processor_type">Processor Type</Label>
                <Select value={formData.processor_type} onValueChange={(value: 'stripe' | 'paypal') => setFormData({ ...formData, processor_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL</Label>
                <Input
                  id="webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://your-app.com/webhooks/payment"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label htmlFor="is_default">Default Processor</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="supports_subscriptions"
                    checked={formData.supports_subscriptions}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_subscriptions: checked })}
                  />
                  <Label htmlFor="supports_subscriptions">Supports Subscriptions</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="supports_one_time_payments"
                    checked={formData.supports_one_time_payments}
                    onCheckedChange={(checked) => setFormData({ ...formData, supports_one_time_payments: checked })}
                  />
                  <Label htmlFor="supports_one_time_payments">Supports One-Time Payments</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingProcessor ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {processors.map((processor) => (
          <Card key={processor.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{processor.name}</CardTitle>
                  {processor.is_default && (
                    <Badge variant="default">
                      <Star className="mr-1 h-3 w-3" />
                      Default
                    </Badge>
                  )}
                  <Badge variant={processor.is_active ? 'default' : 'secondary'}>
                    {processor.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{processor.processor_type}</Badge>
                </div>
                <div className="flex space-x-2">
                  {!processor.is_default && processor.is_active && (
                    <Button size="sm" variant="outline" onClick={() => setDefaultProcessor(processor.id)}>
                      Set as Default
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(processor)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteProcessor(processor.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-admin-text-muted">Subscriptions:</span>
                  <Badge variant={processor.supports_subscriptions ? 'default' : 'secondary'}>
                    {processor.supports_subscriptions ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-admin-text-muted">One-Time Payments:</span>
                  <Badge variant={processor.supports_one_time_payments ? 'default' : 'secondary'}>
                    {processor.supports_one_time_payments ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
                {processor.webhook_url && (
                  <div className="flex items-center gap-2">
                    <span className="text-admin-text-muted">Webhook URL:</span>
                    <code className="text-xs bg-admin-bg-muted px-2 py-1 rounded">{processor.webhook_url}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyWebhookUrl(processor.webhook_url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
