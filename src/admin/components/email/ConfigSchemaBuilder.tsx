import { useState } from 'react';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/admin/ui/select';
import { Card, CardContent } from '@/admin/ui/card';
import { Plus, X } from 'lucide-react';

export interface ConfigField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ConfigSchemaBuilderProps {
  fields: ConfigField[];
  onChange: (fields: ConfigField[]) => void;
}

export const ConfigSchemaBuilder = ({ fields, onChange }: ConfigSchemaBuilderProps) => {
  const [currentField, setCurrentField] = useState<ConfigField>({
    key: '',
    label: '',
    type: 'text',
    required: false,
  });

  const addField = () => {
    if (!currentField.key || !currentField.label) return;
    
    onChange([...fields, currentField]);
    setCurrentField({ key: '', label: '', type: 'text', required: false });
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">Configuration Fields</h4>
        
        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <Card key={index}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{field.key}</span>
                      <span className="text-sm text-admin-text-muted">({field.type})</span>
                      {field.required && (
                        <span className="text-xs bg-admin-error/10 text-admin-error px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-admin-text-muted">{field.label}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-medium">Add Field</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="field-key">Field Key</Label>
            <Input
              id="field-key"
              placeholder="api_key"
              value={currentField.key}
              onChange={(e) => setCurrentField({ ...currentField, key: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="field-label">Field Label</Label>
            <Input
              id="field-label"
              placeholder="API Key"
              value={currentField.label}
              onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="field-type">Field Type</Label>
            <Select
              value={currentField.type}
              onValueChange={(value) => setCurrentField({ ...currentField, type: value })}
            >
              <SelectTrigger id="field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="password">Password</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="select">Select</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentField.required}
                onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Required</span>
            </label>
          </div>
        </div>
        
        <Button onClick={addField} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  );
};
