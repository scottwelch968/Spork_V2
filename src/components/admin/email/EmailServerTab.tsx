import { useState } from 'react';
import { useEmailProviders } from '@/hooks/useEmailProviders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Settings, Trash2, Power, CheckCircle2, Send } from 'lucide-react';
import { AddProviderDialog } from './AddProviderDialog';
import { ProviderConfigDialog } from './ProviderConfigDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const EmailServerTab = () => {
  const {
    providers,
    loading,
    createProvider,
    updateProvider,
    deleteProvider,
    activateProvider,
    testProvider,
  } = useEmailProviders();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [configProvider, setConfigProvider] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailData, setTestEmailData] = useState({
    to: 'scottblackandcompany@gmail.com',
    subject: 'this is a test',
    body: 'Hi Scott it worked'
  });
  const [sendingTest, setSendingTest] = useState(false);

  const handleActivate = async (id: string) => {
    await activateProvider(id);
  };

  const handleDelete = async (id: string) => {
    await deleteProvider(id);
    setDeleteConfirm(null);
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmailData.to,
          subject: testEmailData.subject,
          html: `<p>${testEmailData.body}</p>`,
          text: testEmailData.body,
        },
      });

      if (error) throw error;

      toast.success(`Email sent successfully to ${testEmailData.to}`);
      setTestEmailOpen(false);
    } catch (error: any) {
      toast.error('Failed to send test email', { description: error.message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Providers</CardTitle>
              <CardDescription>
                Manage email service providers for sending emails
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTestEmailOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading providers...</div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No email providers configured yet
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className={provider.is_active ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {provider.provider_type}
                        </CardDescription>
                      </div>
                      {provider.is_active && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {provider.description || 'No description'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfigProvider(provider)}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      {!provider.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(provider.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(provider.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddProviderDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={createProvider}
      />

      <ProviderConfigDialog
        provider={configProvider}
        open={!!configProvider}
        onOpenChange={(open) => !open && setConfigProvider(null)}
        onSave={updateProvider}
        onTest={testProvider}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the email provider
              configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email using the active email provider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-to">To</Label>
              <Input
                id="test-to"
                type="email"
                value={testEmailData.to}
                onChange={(e) => setTestEmailData({ ...testEmailData, to: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-subject">Subject</Label>
              <Input
                id="test-subject"
                value={testEmailData.subject}
                onChange={(e) => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                placeholder="Test email subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-body">Body</Label>
              <Textarea
                id="test-body"
                value={testEmailData.body}
                onChange={(e) => setTestEmailData({ ...testEmailData, body: e.target.value })}
                placeholder="Test email body"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestEmail} disabled={sendingTest}>
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};