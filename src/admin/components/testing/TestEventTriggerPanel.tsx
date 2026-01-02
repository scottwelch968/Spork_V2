import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/admin/ui';
import { useEmailTesting } from '@/hooks/useEmailTesting.tsx';
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
        color: 'text-admin-success',
        bgColor: 'bg-admin-success/10',
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
        color: 'text-admin-info',
        bgColor: 'bg-admin-info/10',
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
        color: 'text-admin-success',
        bgColor: 'bg-admin-success/10',
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
        color: 'text-admin-info',
        bgColor: 'bg-admin-info/10',
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
        color: 'text-admin-error',
        bgColor: 'bg-admin-error/10',
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
        color: 'text-admin-warning',
        bgColor: 'bg-admin-warning/10',
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
            <Card className="bg-admin-card border-admin-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-admin-text font-roboto-slab">
                        <Mail className="h-5 w-5 text-admin-info" />
                        Test System Events
                    </CardTitle>
                    <CardDescription className="text-admin-text-muted">
                        Manually trigger email events to test your email templates and rules
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventConfigs.map((event) => (
                            <button
                                key={event.id}
                                onClick={() => handleOpenDialog(event)}
                                className="flex items-start gap-4 p-4 rounded-xl border border-admin-border bg-admin-bg-muted/50 hover:bg-admin-accent/5 transition-all duration-300 text-left group"
                            >
                                <div className={`p-3 rounded-lg ${event.bgColor} group-hover:scale-110 transition-transform`}>
                                    <event.icon className={`h-5 w-5 ${event.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-admin-text text-sm">{event.name}</h3>
                                    <p className="text-xs text-admin-text-muted mt-1 leading-relaxed">{event.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="bg-admin-card border-admin-border text-admin-text max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-roboto-slab">
                            {selectedEvent && (
                                <>
                                    <div className={`p-2 rounded-lg ${selectedEvent.bgColor}`}>
                                        <selectedEvent.icon className={`h-4 w-4 ${selectedEvent.color}`} />
                                    </div>
                                    <span>Test {selectedEvent.name}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="text-admin-text-muted">
                            Fill in the test data below and trigger the event to test your email flow
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedEvent?.fields.map((field) => (
                            <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key} className="text-xs font-semibold uppercase tracking-wider text-admin-text-muted">
                                    {field.label}
                                    {field.required && <span className="text-admin-error ml-1">*</span>}
                                </Label>
                                <Input
                                    id={field.key}
                                    placeholder={field.placeholder}
                                    value={formData[field.key] || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                                    }
                                    className="bg-admin-bg-muted border-admin-border text-admin-text"
                                />
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="bg-admin-bg-muted/30 -mx-6 -mb-6 p-6 mt-2 border-t border-admin-border">
                        <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="text-admin-text-muted hover:text-admin-text">
                            Cancel
                        </Button>
                        <Button onClick={handleTrigger} disabled={loading} className="bg-admin-info hover:bg-admin-info/90 text-white gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="h-4 w-4" />
                            )}
                            Trigger Event
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
