import { useState } from 'react';
import { useSpacePrompts } from '@/hooks/useSpacePrompts';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { SpacePromptDialog } from './SpacePromptDialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SpacePromptManagerProps {
  spaceId: string;
}

export function SpacePromptManager({ spaceId }: SpacePromptManagerProps) {
  const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt } = useSpacePrompts(spaceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = () => {
    setEditingPrompt(null);
    setDialogOpen(true);
  };

  const handleEdit = (prompt: any) => {
    setEditingPrompt(prompt);
    setDialogOpen(true);
  };

  const handleSave = (data: any) => {
    if (editingPrompt) {
      updatePrompt({ promptId: editingPrompt.id, updates: data });
    } else {
      createPrompt(data);
    }
    setDialogOpen(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard' });
  };

  const handleDeleteClick = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete);
      setDeleteDialogOpen(false);
      setPromptToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading prompts...</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Prompt
      </Button>

      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">{prompt.title}</p>
                {prompt.is_default && (
                  <Badge variant="outline" className="text-xs">Default</Badge>
                )}
                {prompt.category && (
                  <Badge variant="secondary">{prompt.category}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                {prompt.content}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(prompt.content)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(prompt)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {!prompt.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(prompt.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dialogOpen && (
        <SpacePromptDialog
          prompt={editingPrompt}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
