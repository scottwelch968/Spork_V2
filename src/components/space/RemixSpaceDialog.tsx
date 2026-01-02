import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Lock, Copy, Sparkles } from 'lucide-react';
import { useCurrentSubscription } from '@/hooks/useCurrentSubscription';
import { useSpace } from '@/hooks/useSpace';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RemixSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  space: {
    id: string;
    name: string;
    description: string | null;
    ai_model: string | null;
    ai_instructions: string | null;
    compliance_rule: string | null;
    color_code: string | null;
    file_quota_mb: number | null;
  };
}

interface ContentCounts {
  files: number;
  chats: number;
  tasks: number;
  knowledgeBase: number;
}

export function RemixSpaceDialog({ open, onOpenChange, space }: RemixSpaceDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isTeamOrHigher, isLoading: subscriptionLoading } = useCurrentSubscription();
  const { remixSpace, isRemixingSpace } = useSpace();

  const [name, setName] = useState(`Copy of ${space.name}`);
  const [copyFiles, setCopyFiles] = useState(false);
  const [copyChats, setCopyChats] = useState(false);
  const [copyTasks, setCopyTasks] = useState(false);
  const [copyKnowledgeBase, setCopyKnowledgeBase] = useState(false);
  const [counts, setCounts] = useState<ContentCounts>({ files: 0, chats: 0, tasks: 0, knowledgeBase: 0 });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(`Copy of ${space.name}`);
      setCopyFiles(false);
      setCopyChats(false);
      setCopyTasks(false);
      setCopyKnowledgeBase(false);
      fetchCounts();
    }
  }, [open, space.name]);

  const fetchCounts = async () => {
    const [filesResult, chatsResult, tasksResult, kbResult] = await Promise.all([
      supabase.from('workspace_files' as any).select('id', { count: 'exact', head: true }).eq('workspace_id', space.id),
      supabase.from('space_chats').select('id', { count: 'exact', head: true }).eq('space_id', space.id),
      supabase.from('space_tasks').select('id', { count: 'exact', head: true }).eq('space_id', space.id),
      supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).eq('workspace_id', space.id),
    ]);

    setCounts({
      files: filesResult.count || 0,
      chats: chatsResult.count || 0,
      tasks: tasksResult.count || 0,
      knowledgeBase: kbResult.count || 0,
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the new space',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newSpace = await remixSpace({
        sourceSpaceId: space.id,
        name: name.trim(),
        copyFiles,
        copyChats,
        copyTasks,
        copyKnowledgeBase,
      });

      onOpenChange(false);
      navigate(`/workspace/${newSpace.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remix space',
        variant: 'destructive',
      });
    }
  };

  if (subscriptionLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Remix Space
          </DialogTitle>
          <DialogDescription>
            Create a new independent copy of this space with your selected content.
          </DialogDescription>
        </DialogHeader>

        {!isTeamOrHigher ? (
          <div className="py-6">
            <div className="flex flex-col items-center text-center gap-4 p-6 bg-muted/50 rounded-lg">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold mb-1">Teams Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Remix is available for Team and Enterprise subscriptions. 
                  Upgrade your plan to create copies of spaces with all their content.
                </p>
              </div>
              <Button onClick={() => navigate('/billing')}>
                Upgrade to Team
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6 py-4">
              {/* New Space Name */}
              <div className="space-y-2">
                <Label htmlFor="space-name">New Space Name</Label>
                <Input
                  id="space-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name for the new space"
                />
              </div>

              {/* Always Included Section */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Always included</Label>
                <div className="space-y-2 pl-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox checked disabled />
                    <span>Settings & AI Configuration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox checked disabled />
                    <span>Personas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox checked disabled />
                    <span>Prompts</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Optional Content */}
              <div className="space-y-3">
                <Label className="text-sm text-muted-foreground">Optional content to include</Label>
                <div className="space-y-3 pl-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="copy-files"
                        checked={copyFiles}
                        onCheckedChange={(checked) => setCopyFiles(checked === true)}
                      />
                      <label htmlFor="copy-files" className="text-sm cursor-pointer">
                        Files
                      </label>
                    </div>
                    <Badge variant="secondary">{counts.files}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="copy-chats"
                        checked={copyChats}
                        onCheckedChange={(checked) => setCopyChats(checked === true)}
                      />
                      <label htmlFor="copy-chats" className="text-sm cursor-pointer">
                        Chats
                      </label>
                    </div>
                    <Badge variant="secondary">{counts.chats}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="copy-tasks"
                        checked={copyTasks}
                        onCheckedChange={(checked) => setCopyTasks(checked === true)}
                      />
                      <label htmlFor="copy-tasks" className="text-sm cursor-pointer">
                        Tasks
                      </label>
                    </div>
                    <Badge variant="secondary">{counts.tasks}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="copy-kb"
                        checked={copyKnowledgeBase}
                        onCheckedChange={(checked) => setCopyKnowledgeBase(checked === true)}
                      />
                      <label htmlFor="copy-kb" className="text-sm cursor-pointer">
                        Knowledge Base
                      </label>
                    </div>
                    <Badge variant="secondary">{counts.knowledgeBase}</Badge>
                  </div>
                </div>
              </div>

              {/* Note about members */}
              <p className="text-xs text-muted-foreground">
                Note: Members will not be copied. The new space will start with only you as the owner.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isRemixingSpace || !name.trim()}>
                {isRemixingSpace ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Create Remix
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
