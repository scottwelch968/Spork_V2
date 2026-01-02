import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface AIInstructionsEditorProps {
  instructions: string;
  onSave: (instructions: string) => void;
}

export function AIInstructionsEditor({ instructions, onSave }: AIInstructionsEditorProps) {
  const [value, setValue] = useState(instructions);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    setHasChanges(e.target.value !== instructions);
  };

  const handleSave = () => {
    onSave(value);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder="Enter AI instructions for this space..."
        className="min-h-[150px]"
      />
      <Button onClick={handleSave} disabled={!hasChanges}>
        Save Instructions
      </Button>
    </div>
  );
}
