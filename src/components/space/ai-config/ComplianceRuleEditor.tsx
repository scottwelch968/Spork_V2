import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ComplianceRuleEditorProps {
  complianceRule: string;
  onSave: (rule: string) => void;
}

export function ComplianceRuleEditor({ complianceRule, onSave }: ComplianceRuleEditorProps) {
  const [value, setValue] = useState(complianceRule);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setHasChanges(e.target.value !== complianceRule);
  };

  const handleSave = () => {
    onSave(value);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Compliance rules define data handling and content restrictions for this space. These rules are enforced in all AI interactions.
        </AlertDescription>
      </Alert>
      
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Enter compliance requirements (e.g., HIPAA, GDPR, no PII storage)..."
        className="min-h-[120px]"
      />
      <Button onClick={handleSave} disabled={!hasChanges}>
        Save Compliance Rule
      </Button>
    </div>
  );
}
