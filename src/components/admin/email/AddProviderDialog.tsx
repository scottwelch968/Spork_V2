import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigSchemaBuilder, ConfigField } from './ConfigSchemaBuilder';

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (provider: any) => Promise<void>;
}

const commonProviders = {
  resend: {
    name: 'Resend',
    sdk_package: 'npm:resend@2.0.0',
    config_schema: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', required: true },
      { key: 'from_name', label: 'From Name', type: 'text', required: false },
    ],
  },
  sendgrid: {
    name: 'SendGrid',
    sdk_package: 'npm:@sendgrid/mail',
    config_schema: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', required: true },
    ],
  },
  mailgun: {
    name: 'Mailgun',
    sdk_package: 'npm:mailgun.js',
    config_schema: [
      { key: 'api_key', label: 'API Key', type: 'password', required: true },
      { key: 'domain', label: 'Domain', type: 'text', required: true },
      { key: 'from_email', label: 'From Email', type: 'email', required: true },
    ],
  },
};

export const AddProviderDialog = ({ open, onOpenChange, onAdd }: AddProviderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [providerData, setProviderData] = useState({
    name: '',
    provider_type: 'custom',
    description: '',
    logo_url: '',
    documentation_url: '',
    sdk_package: '',
    api_endpoint: '',
  });
  const [configSchema, setConfigSchema] = useState<ConfigField[]>([]);

  const loadTemplate = (template: keyof typeof commonProviders) => {
    const provider = commonProviders[template];
    setProviderData({
      ...providerData,
      name: provider.name,
      provider_type: template,
      sdk_package: provider.sdk_package,
    });
    setConfigSchema(provider.config_schema as ConfigField[]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onAdd({
        ...providerData,
        config_schema: configSchema,
      });
      onOpenChange(false);
      // Reset form
      setProviderData({
        name: '',
        provider_type: 'custom',
        description: '',
        logo_url: '',
        documentation_url: '',
        sdk_package: '',
        api_endpoint: '',
      });
      setConfigSchema([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Email Provider</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('resend')}
            >
              Load Resend Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('sendgrid')}
            >
              Load SendGrid Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('mailgun')}
            >
              Load Mailgun Template
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Provider Name</Label>
              <Input
                id="name"
                value={providerData.name}
                onChange={(e) => setProviderData({ ...providerData, name: e.target.value })}
                placeholder="My Email Provider"
              />
            </div>

            <div>
              <Label htmlFor="provider_type">Provider Type</Label>
              <Select
                value={providerData.provider_type}
                onValueChange={(value) => setProviderData({ ...providerData, provider_type: value })}
              >
                <SelectTrigger id="provider_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="mailtrap">Mailtrap</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="notificationapi">NotificationAPI</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={providerData.description}
              onChange={(e) => setProviderData({ ...providerData, description: e.target.value })}
              placeholder="Describe this email provider..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sdk_package">SDK Package (optional)</Label>
              <Input
                id="sdk_package"
                value={providerData.sdk_package}
                onChange={(e) => setProviderData({ ...providerData, sdk_package: e.target.value })}
                placeholder="npm:package@version"
              />
            </div>

            <div>
              <Label htmlFor="api_endpoint">API Endpoint (for custom)</Label>
              <Input
                id="api_endpoint"
                value={providerData.api_endpoint}
                onChange={(e) => setProviderData({ ...providerData, api_endpoint: e.target.value })}
                placeholder="https://api.example.com/send"
              />
            </div>
          </div>

          <ConfigSchemaBuilder
            fields={configSchema}
            onChange={setConfigSchema}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !providerData.name}>
            {loading ? 'Adding...' : 'Add Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};