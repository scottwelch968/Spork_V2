import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { EmailRule } from '@/hooks/useEmailRules';
import { EmailTemplate } from '@/hooks/useEmailTemplates';
import { EmailEventType } from '@/hooks/useEmailEventTypes';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save } from 'lucide-react';

interface RuleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: EmailRule | null;
  eventTypes: EmailEventType[];
  templates: EmailTemplate[];
  onSave: (data: Partial<EmailRule>) => Promise<void>;
}

export const RuleConfigDialog = ({ 
  open, 
  onOpenChange, 
  rule, 
  eventTypes, 
  templates, 
  onSave 
}: RuleConfigDialogProps) => {
  const [formData, setFormData] = useState<Partial<EmailRule>>({
    name: '',
    event_type: '',
    template_id: '',
    recipient_type: 'user',
    status: 'active',
    priority: 100,
    send_immediately: true,
    delay_minutes: 0,
    conditions: [],
    recipient_emails: [],
    cc_emails: [],
    bcc_emails: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData(rule);
    } else {
      setFormData({
        name: '',
        event_type: '',
        template_id: '',
        recipient_type: 'user',
        status: 'active',
        priority: 100,
        send_immediately: true,
        delay_minutes: 0,
        conditions: [],
        recipient_emails: [],
        cc_emails: [],
        bcc_emails: [],
      });
    }
  }, [rule, open]);

  const selectedEventType = eventTypes.find(et => et.event_type === formData.event_type);

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        { field: '', operator: 'equals', value: '', logic: 'AND' },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: (prev.conditions || []).filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: (prev.conditions || []).map((cond, i) =>
        i === index ? { ...cond, [field]: value } : cond
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'Create Email Rule'}</DialogTitle>
          <DialogDescription>
            Configure automated email sending based on system events
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="event" className="space-y-4">
          <TabsList>
            <TabsTrigger value="event">Event & Template</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          <TabsContent value="event" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Welcome New Users"
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">Lower numbers = higher priority</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe when this rule should trigger"
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select 
                value={formData.event_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((event) => (
                    <SelectItem key={event.event_type} value={event.event_type}>
                      {event.display_name}
                      {event.is_critical && <Badge variant="destructive" className="ml-2">Critical</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEventType && (
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">{selectedEventType.description}</p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-muted-foreground">Available variables:</span>
                    {selectedEventType.available_variables.map((v) => (
                      <Badge key={v} variant="outline">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select 
                value={formData.template_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.status === 'active').map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="recipients" className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <Select 
                value={formData.recipient_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, recipient_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Event Trigger)</SelectItem>
                  <SelectItem value="admin">Admin Users</SelectItem>
                  <SelectItem value="custom">Custom Email Addresses</SelectItem>
                  <SelectItem value="both">User & Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.recipient_type === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Recipients</Label>
                <Input
                  value={(formData.recipient_emails || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recipient_emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CC (Optional)</Label>
                <Input
                  value={(formData.cc_emails || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    cc_emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="cc@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>BCC (Optional)</Label>
                <Input
                  value={(formData.bcc_emails || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    bcc_emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  placeholder="bcc@example.com"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Conditional Logic (Optional)</Label>
              <Button size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            {(formData.conditions || []).map((condition, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Field</Label>
                  <Input
                    value={condition.field}
                    onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    placeholder="severity"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Operator</Label>
                  <Select 
                    value={condition.operator} 
                    onValueChange={(value) => updateCondition(index, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="not_equals">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="not_contains">Not Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="exists">Exists</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="critical"
                  />
                </div>

                <div className="w-24 space-y-2">
                  <Label>Logic</Label>
                  <Select 
                    value={condition.logic} 
                    onValueChange={(value) => updateCondition(index, 'logic', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeCondition(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {(!formData.conditions || formData.conditions.length === 0) && (
              <p className="text-sm text-muted-foreground">No conditions added. Rule will trigger for all events of this type.</p>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Send Immediately</Label>
                <p className="text-sm text-muted-foreground">Send email as soon as event triggers</p>
              </div>
              <Switch
                checked={formData.send_immediately}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, send_immediately: checked }))}
              />
            </div>

            {!formData.send_immediately && (
              <div className="space-y-2">
                <Label>Delay (Minutes)</Label>
                <Input
                  type="number"
                  value={formData.delay_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, delay_minutes: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Sends Per User Per Day (Optional)</Label>
                <Input
                  type="number"
                  value={formData.max_sends_per_user_per_day || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_sends_per_user_per_day: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Sends Per User Per Week (Optional)</Label>
                <Input
                  type="number"
                  value={formData.max_sends_per_user_per_week || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    max_sends_per_user_per_week: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deduplication Window (Minutes, Optional)</Label>
              <Input
                type="number"
                value={formData.deduplicate_window_minutes || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  deduplicate_window_minutes: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="No deduplication"
              />
              <p className="text-xs text-muted-foreground">
                Prevent sending duplicate emails within this time window
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Rule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
