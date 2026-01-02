import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmailTesting } from '@/hooks/useEmailTesting';
import { useAuth } from '@/hooks/useAuth';
import { 
  UserPlus, 
  KeyRound, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  Bell,
  Mail,
  Loader2
} from 'lucide-react';

interface EventConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  fields: { key: string; label: string; placeholder: string; required?: boolean }[];
}

const eventConfigs: EventConfig[] = [
  {
    id: 'user_signup',
    name: 'Welcome Email',
    description: 'Test new user welcome email',
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    fields: [
      { key: 'user_email', label: 'User Email', placeholder: 'test@example.com', required: true },
      { key: 'user_name', label: 'User Name', placeholder: 'John Doe' },
    ],
  },
  {
    id: 'password_reset_request',
    name: 'Password Reset',
    description: 'Test password reset email',
    icon: KeyRound,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    fields: [
      { key: 'user_email', label: 'User Email', placeholder: 'test@example.com', required: true },
      { key: 'reset_link', label: 'Reset Link', placeholder: 'https://app.spork.ai/reset/token123' },
    ],
  },
  {
    id: 'payment_successful',
    name: 'Payment Receipt',
    description: 'Test payment confirmation email',
    icon: CreditCard,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    fields: [
      { key: 'user_email', label: 'User Email', placeholder: 'test@example.com', required: true },
      { key: 'amount', label: 'Amount', placeholder: '$19.99' },
      { key: 'plan_name', label: 'Plan Name', placeholder: 'Pro Monthly' },
    ],
  },
  {
    id: 'workspace_invitation',
    name: 'Workspace Invitation',
    description: 'Test workspace invite email',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    fields: [
      { key: 'invitee_email', label: 'Invitee Email', placeholder: 'invitee@example.com', required: true },
      { key: 'inviter_name', label: 'Inviter Name', placeholder: 'John Doe' },
      { key: 'workspace_name', label: 'Workspace Name', placeholder: 'My Team Workspace' },
      { key: 'invite_link', label: 'Invite Link', placeholder: 'https://app.spork.ai/invite/abc123' },
    ],
  },
  {
    id: 'system_error',
    name: 'System Alert',
    description: 'Test admin error notification',
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    fields: [
      { key: 'error_message', label: 'Error Message', placeholder: 'Database connection failed' },
      { key: 'error_code', label: 'Error Code', placeholder: 'ERR_DB_001' },
    ],
  },
  {
    id: 'quota_warning',
    name: 'Quota Warning',
    description: 'Test usage limit notification',
    icon: Bell,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    fields: [
      { key: 'user_email', label: 'User Email', placeholder: 'test@example.com', required: true },
      { key: 'quota_type', label: 'Quota Type', placeholder: 'API Calls' },
      { key: 'usage_percent', label: 'Usage Percent', placeholder: '80' },
    ],
  },
];

export function TestEventTriggerPanel() {
  const { triggerTestEvent, loading } = useEmailTesting();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleOpenDialog = (event: EventConfig) => {
    setSelectedEvent(event);
    // Pre-fill with default values
    const defaults: Record<string, string> = {};
    event.fields.forEach((field) => {
      if (field.key === 'user_email' || field.key === 'invitee_email') {
        defaults[field.key] = user?.email || '';
      }
    });
    setFormData(defaults);
  };

  const handleTrigger = async () => {
    if (!selectedEvent) return;

    await triggerTestEvent({
      event_type: selectedEvent.id,
      user_id: user?.id,
      data: formData,
    });

    setSelectedEvent(null);
    setFormData({});
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test System Events
          </CardTitle>
          <CardDescription>
            Manually trigger email events to test your email templates and rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventConfigs.map((event) => (
              <button
                key={event.id}
                onClick={() => handleOpenDialog(event)}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-left"
              >
                <div className={`p-3 rounded-lg ${event.bgColor}`}>
                  <event.icon className={`h-5 w-5 ${event.color}`} />
                </div>
                <div>
                  <h3 className="font-medium">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <>
                  <selectedEvent.icon className={`h-5 w-5 ${selectedEvent.color}`} />
                  Test {selectedEvent.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Fill in the test data below and trigger the event to test your email flow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedEvent?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Cancel
            </Button>
            <Button onClick={handleTrigger} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Trigger Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
