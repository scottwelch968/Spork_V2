import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface GeneralSettingsCardProps {
  space: any;
  onUpdate: (updates: any) => void;
}

export function GeneralSettingsCard({ space, onUpdate }: GeneralSettingsCardProps) {
  const [name, setName] = useState(space.name || '');
  const [description, setDescription] = useState(space.description || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({
      name: name.trim(),
      description: description.trim() || null,
    });
    setHasChanges(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">General Settings</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Space Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleChange();
            }}
            placeholder="Enter space name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              handleChange();
            }}
            placeholder="Describe this space..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || !name.trim()}>
          Save Changes
        </Button>
      </div>
    </Card>
  );
}
