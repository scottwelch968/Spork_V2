import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UserSettings } from '@/hooks/useUserSettings';
import { toast } from '@/hooks/use-toast';

interface ChatPreferencesSectionProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export function ChatPreferencesSection({ settings, onUpdateSettings }: ChatPreferencesSectionProps) {
  const [personalContext, setPersonalContext] = useState(settings.personal_context || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({ personal_context: personalContext });
      toast({
        title: 'Saved',
        description: 'Your personal context has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save personal context.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = personalContext !== (settings.personal_context || '');

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Personal Context</CardTitle>
        <CardDescription>
          Provide context about yourself that will be included in your chat conversations to personalize AI responses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="personal_context" className="mb-2 block">
              About You
            </Label>
            <Textarea
              id="personal_context"
              placeholder="Tell the AI about yourself - your role, preferences, communication style, or any other context that helps personalize responses..."
              value={personalContext}
              onChange={(e) => setPersonalContext(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Context'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
