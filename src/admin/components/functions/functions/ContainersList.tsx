import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Switch, Button, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/admin/ui';
import {
  useChatContainers,
  useChatFunctions,
  useUpdateChatContainer,
  useCreateChatContainer,
  useDeleteChatContainer
} from '@/hooks/useChatFunctionsAdmin';
import { Box, Loader2, Radio, Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { cn } from '@/admin/lib/utils';
import { ContainerForm, type ContainerFormData } from './ContainerForm';
import { toast } from 'sonner';
import type { ChatContainer } from '@/lib/chatFunctions/registry';
import type { Json } from '@/integrations/supabase/types';

export function ContainersList() {
  const { data: containers, isLoading: containersLoading } = useChatContainers();
  const { data: functions } = useChatFunctions();
  const updateContainer = useUpdateChatContainer();
  const createContainer = useCreateChatContainer();
  const deleteContainer = useDeleteChatContainer();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingContainer, setEditingContainer] = useState<ChatContainer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<ChatContainer | null>(null);

  const getFunctionName = (functionKey: string | null) => {
    if (!functionKey) return 'None';
    const func = functions?.find((f) => f.function_key === functionKey);
    return func?.name || functionKey;
  };

  const handleToggle = (container: { id: string; is_enabled: boolean }) => {
    updateContainer.mutate({
      id: container.id,
      updates: { is_enabled: !container.is_enabled },
    });
  };

  const handleCreate = () => {
    setEditingContainer(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = (container: ChatContainer) => {
    setEditingContainer(container);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteClick = (container: ChatContainer) => {
    if (container.is_core) {
      toast.error('Core containers cannot be deleted');
      return;
    }
    if (!container.is_deletable) {
      toast.error('This container is protected and cannot be deleted');
      return;
    }
    setContainerToDelete(container);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (containerToDelete) {
      deleteContainer.mutate(containerToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setContainerToDelete(null);
        },
      });
    }
  };

  const handleFormSubmit = (data: ContainerFormData) => {
    if (formMode === 'create') {
      createContainer.mutate({
        container_key: data.container_key,
        name: data.name,
        description: data.description || null,
        function_key: data.function_key,
        subscribes_to: data.subscribes_to,
        content_type: data.content_type,
        target_actors: data.target_actors,
        display_config: data.display_config as Json,
        style_config: data.style_config as Json,
        format_config: data.format_config as Json,
        is_enabled: data.is_enabled,
        is_core: data.is_core,
        is_deletable: data.is_deletable,
        display_order: data.display_order,
      }, {
        onSuccess: () => setFormOpen(false),
      });
    } else if (editingContainer) {
      updateContainer.mutate({
        id: editingContainer.id,
        updates: {
          name: data.name,
          description: data.description || null,
          function_key: data.function_key,
          subscribes_to: data.subscribes_to,
          content_type: data.content_type,
          target_actors: data.target_actors,
          display_config: data.display_config as Json,
          style_config: data.style_config as Json,
          format_config: data.format_config as Json,
          is_enabled: data.is_enabled,
          is_core: data.is_core,
          is_deletable: data.is_deletable,
          display_order: data.display_order,
        },
      }, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const getContentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: 'bg-admin-info/10 text-admin-info border-admin-info/20',
      image: 'bg-admin-success/10 text-admin-success border-admin-success/20',
      map: 'bg-admin-warning/10 text-admin-warning border-admin-warning/20',
      code: 'bg-admin-accent/10 text-admin-accent border-admin-accent/20',
      table: 'bg-admin-info/10 text-admin-info border-admin-info/20',
      media: 'bg-admin-accent/10 text-admin-accent border-admin-accent/20',
      custom: 'bg-admin-bg-muted text-admin-text-muted border-admin-border/50',
    };
    return colors[type] || colors.custom;
  };

  if (containersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider flex items-center gap-2">
            <Box className="h-4 w-4" />
            UI Containers
          </CardTitle>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Container</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Actors</TableHead>
                <TableHead className="w-[120px]">Function</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers?.map((container) => (
                <TableRow key={container.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {container.is_core && (
                        <span title="Core container">
                          <Shield className="h-3.5 w-3.5 text-admin-warning" />
                        </span>
                      )}
                      {!container.is_deletable && !container.is_core && (
                        <span title="Protected">
                          <Lock className="h-3.5 w-3.5 text-admin-text-muted" />
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-sm">{container.name}</div>
                        <code className="text-xs text-admin-text-muted font-mono">
                          {container.container_key}
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px] font-bold uppercase tracking-wider", getContentTypeBadge(container.content_type))}>
                      {container.content_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {container.subscribes_to.slice(0, 2).map((event) => (
                        <Badge
                          key={event}
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-wider border-admin-accent/20 text-admin-accent bg-admin-accent/5 font-mono"
                        >
                          <Radio className="h-2.5 w-2.5 mr-1" />
                          {event}
                        </Badge>
                      ))}
                      {container.subscribes_to.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{container.subscribes_to.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {container.target_actors.length === 0 ? (
                      <span className="text-xs text-admin-text-muted">All</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {container.target_actors.slice(0, 2).map((actor) => (
                          <Badge key={actor} variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20">
                            {actor}
                          </Badge>
                        ))}
                        {container.target_actors.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{container.target_actors.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-admin-bg-muted px-1.5 py-0.5 rounded font-mono">
                      {getFunctionName(container.function_key)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={container.is_enabled}
                      onCheckedChange={() => handleToggle(container)}
                      disabled={updateContainer.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(container)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-admin-error"
                        onClick={() => handleDeleteClick(container)}
                        disabled={container.is_core || !container.is_deletable}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContainerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={editingContainer ? {
          container_key: editingContainer.container_key,
          name: editingContainer.name,
          description: editingContainer.description || '',
          function_key: editingContainer.function_key,
          subscribes_to: editingContainer.subscribes_to,
          content_type: editingContainer.content_type,
          target_actors: editingContainer.target_actors,
          display_config: editingContainer.display_config as Record<string, unknown>,
          style_config: editingContainer.style_config as Record<string, unknown>,
          format_config: editingContainer.format_config as Record<string, unknown>,
          is_enabled: editingContainer.is_enabled,
          is_core: editingContainer.is_core,
          is_deletable: editingContainer.is_deletable,
          display_order: editingContainer.display_order,
        } : undefined}
        onSubmit={handleFormSubmit}
        isLoading={createContainer.isPending || updateContainer.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Container</AlertDialogTitle>
            <AlertDialogDescription>
              {containerToDelete?.function_key && functions?.find(f => f.function_key === containerToDelete.function_key)?.is_enabled ? (
                <span className="text-admin-warning">
                  Warning: This container is used by an active function "{getFunctionName(containerToDelete.function_key)}".
                  Deleting it may break the UI for that function.
                </span>
              ) : (
                <>Are you sure you want to delete "{containerToDelete?.name}"? This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-admin-error text-white font-bold uppercase tracking-wider text-[10px] hover:bg-admin-error/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
