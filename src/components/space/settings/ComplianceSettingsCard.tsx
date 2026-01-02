import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ComplianceSettingsCardProps {
  complianceRule: string | null;
  onUpdate: (updates: any) => void;
}

export function ComplianceSettingsCard({ complianceRule, onUpdate }: ComplianceSettingsCardProps) {
  const [value, setValue] = useState(complianceRule || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setHasChanges(e.target.value !== (complianceRule || ''));
  };

  const handleSave = () => {
    onUpdate({ compliance_rule: value.trim() || null });
    setHasChanges(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance Settings</h3>
      
      <Alert className="mb-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Owner only: Define compliance requirements and data handling restrictions for this space.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="compliance">Compliance Rule</Label>
          <Textarea
            id="compliance"
            value={value}
            onChange={handleChange}
            placeholder="e.g., HIPAA compliant, no PII storage, GDPR restrictions..."
            className="min-h-[120px]"
          />
        </div>

        <Button onClick={handleSave} disabled={!hasChanges}>
          Save Compliance Rule
        </Button>
      </div>
    </Card>
  );
}
