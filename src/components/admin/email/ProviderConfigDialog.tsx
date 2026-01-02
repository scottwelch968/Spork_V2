import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailProvider } from '@/hooks/useEmailProviders';
import { Loader2 } from 'lucide-react';

interface ProviderConfigDialogProps {
  provider: EmailProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, config: any) => Promise<void>;
  onTest: (id: string) => Promise<void>;
}

export const ProviderConfigDialog = ({
  provider,
  open,
  onOpenChange,
  onSave,
  onTest,
}: ProviderConfigDialogProps) => {
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (provider) {
      setConfigValues(provider.config_values || {});
    }
  }, [provider]);

  if (!provider) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(provider.id, { config_values: configValues });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await onTest(provider.id);
    } finally {
      setTesting(false);
    }
  };

  const renderField = (field: any) => {
    const value = configValues[field.key] || '';

    switch (field.type) {
      case 'password':
        return (
          <Input
            type="password"
            value={value}
            onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
            placeholder={field.label}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
            placeholder={field.label}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => setConfigValues({ ...configValues, [field.key]: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
            placeholder={field.label}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {provider.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {provider.config_schema.map((field: any) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || loading}
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
          <Button onClick={handleSave} disabled={loading || testing}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};