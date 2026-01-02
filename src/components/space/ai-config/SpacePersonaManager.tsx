import { useState } from 'react';
import { useSpacePersonas } from '@/hooks/useSpacePersonas';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Star, Bot } from 'lucide-react';
import { SpacePersonaDialog } from './SpacePersonaDialog';
import { Badge } from '@/components/ui/badge';
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

interface SpacePersonaManagerProps {
  spaceId: string;
}

export function SpacePersonaManager({ spaceId }: SpacePersonaManagerProps) {
  const { personas, isLoading, createPersona, updatePersona, deletePersona, setDefaultPersona } = useSpacePersonas(spaceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingPersona(null);
    setDialogOpen(true);
  };

  const handleEdit = (persona: any) => {
    setEditingPersona(persona);
    setDialogOpen(true);
  };

  const handleSave = (data: any) => {
    if (editingPersona) {
      updatePersona({ personaId: editingPersona.id, updates: data });
    } else {
      createPersona(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (personaId: string) => {
    setPersonaToDelete(personaId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (personaToDelete) {
      deletePersona(personaToDelete);
      setDeleteDialogOpen(false);
      setPersonaToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading personas...</div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Persona
      </Button>

      <div className="space-y-2">
        {personas.map((persona) => (
          <div
            key={persona.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Bot className="h-6 w-6 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{persona.name}</p>
                  {persona.is_default && (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                {persona.description && (
                  <p className="text-sm text-muted-foreground">{persona.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!persona.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefaultPersona(persona.id)}
                >
                  Set Default
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(persona)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {!persona.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(persona.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dialogOpen && (
        <SpacePersonaDialog
          persona={editingPersona}
          onClose={() => setDialogOpen(false)}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this persona? This action cannot be undone.
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
