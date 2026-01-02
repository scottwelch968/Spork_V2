import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PersonaDialog } from './PersonaDialog';
import { Sparkles, Trash2, Edit2, Plus, Bot } from 'lucide-react';
import { toast } from 'sonner';
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

interface Persona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  is_default: boolean;
}

export function PersonaManager() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadPersonas();
    }
  }, [user?.id]);

  const loadPersonas = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error loading personas:', error);
      toast.error('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPersona(null);
    setDialogOpen(true);
  };

  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!personaToDelete) return;

    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaToDelete);

      if (error) throw error;
      
      toast.success('Persona deleted');
      loadPersonas();
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast.error('Failed to delete persona');
    } finally {
      setDeleteDialogOpen(false);
      setPersonaToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setPersonaToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading personas...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Personas</CardTitle>
              <CardDescription>
                Create custom AI personas with different personalities and expertise
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Persona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {personas.map((persona) => (
              <Card key={persona.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Bot className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{persona.name}</h3>
                          {persona.is_default && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        {persona.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {persona.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {persona.system_prompt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(persona)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!persona.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(persona.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {personas.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No personas yet. Create your first persona to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <PersonaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        persona={editingPersona}
        onSuccess={loadPersonas}
      />

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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
