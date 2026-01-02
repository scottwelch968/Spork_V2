import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SpaceSettingsProps {
  space: {
    id: string;
    name: string;
    subscription_tier: string;
  };
}

export function SpaceSettings({ space }: SpaceSettingsProps) {
  const [name, setName] = useState(space.name);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', space.id);

      if (error) throw error;

      toast({
        title: 'Space updated',
        description: 'Space name has been updated',
      });

      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    } catch (error: any) {
      toast({
        title: 'Failed to update space',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold font-roboto-slab">Space Settings</h2>
        <p className="text-muted-foreground">Manage your space configuration</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="space-name">Space Name</Label>
          <div className="flex gap-2">
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Space"
            />
            <Button onClick={handleUpdateName} disabled={loading || name === space.name}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subscription Tier</Label>
          <div>
            <Badge variant="outline" className="capitalize">
              {space.subscription_tier}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-destructive">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">
              Irreversible actions that will affect your space
            </p>
          </div>
          <Button variant="destructive" disabled>
            Delete Space
          </Button>
        </div>
      </Card>
    </div>
  );
}
