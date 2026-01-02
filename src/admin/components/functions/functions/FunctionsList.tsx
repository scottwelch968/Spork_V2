/**
 * Functions List - Displays and manages chat functions with CRUD
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Button, Switch, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, ScrollArea } from '@/admin/ui';
import {
  useChatFunctions,
  useCreateChatFunction,
  useUpdateChatFunction,
  useDeleteChatFunction,
} from '@/hooks/useChatFunctionsAdmin';
import { Code, Eye, Loader2, Lock, Zap, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { FunctionForm, type FunctionFormData } from './FunctionForm';
import type { ChatFunction } from '@/lib/chatFunctions/registry';

const categoryColors: Record<string, string> = {
  core: 'bg-admin-info/10 text-admin-info border-admin-info/20',
  external: 'bg-admin-accent/10 text-admin-accent border-admin-accent/20',
  persistence: 'bg-admin-success/10 text-admin-success border-admin-success/20',
  feature: 'bg-admin-warning/10 text-admin-warning border-admin-warning/20',
};

export function FunctionsList() {
  const { data: functions, isLoading } = useChatFunctions();
  const createFunction = useCreateChatFunction();
  const updateFunction = useUpdateChatFunction();
  const deleteFunction = useDeleteChatFunction();

  const [selectedFunction, setSelectedFunction] = useState<ChatFunction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<ChatFunction | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [functionToDelete, setFunctionToDelete] = useState<ChatFunction | null>(null);

  const handleToggle = (func: ChatFunction) => {
    if (func.is_core) return;
    updateFunction.mutate({
      id: func.id,
      updates: { is_enabled: !func.is_enabled },
    });
  };

  const handleCreate = () => {
    setEditingFunction(undefined);
    setFormOpen(true);
  };

  const handleEdit = (func: ChatFunction) => {
    setEditingFunction(func);
    setFormOpen(true);
  };

  const handleDelete = (func: ChatFunction) => {
    if (func.is_core) return;
    setFunctionToDelete(func);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (functionToDelete) {
      deleteFunction.mutate(functionToDelete.id);
      setDeleteConfirmOpen(false);
      setFunctionToDelete(null);
    }
  };

  const handleFormSubmit = (data: FunctionFormData) => {
    if (editingFunction) {
      updateFunction.mutate(
        {
          id: editingFunction.id,
          updates: {
            name: data.name,
            description: data.description,
            category: data.category,
            code_path: data.code_path,
            events_emitted: data.events_emitted,
            depends_on: data.depends_on,
            tags: data.tags,
            input_schema: data.input_schema,
            output_schema: data.output_schema,
            is_enabled: data.is_enabled,
            display_order: data.display_order,
          },
        },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createFunction.mutate(
        {
          function_key: data.function_key,
          name: data.name,
          description: data.description,
          category: data.category,
          code_path: data.code_path,
          events_emitted: data.events_emitted,
          depends_on: data.depends_on,
          tags: data.tags,
          input_schema: data.input_schema,
          output_schema: data.output_schema,
          is_core: data.is_core,
          is_enabled: data.is_enabled,
          display_order: data.display_order,
        },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold font-roboto-slab uppercase tracking-wider flex items-center gap-2">
              <Code className="h-4 w-4" />
              Registered Functions
            </CardTitle>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Create Function
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Function</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Events</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {functions?.map((func) => (
                <TableRow key={func.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {func.is_core && (
                        <Lock className="h-3 w-3 text-admin-text-muted" />
                      )}
                      <div>
                        <div className="font-medium text-sm">{func.name}</div>
                        <code className="text-xs text-admin-text-muted font-mono">
                          {func.function_key}
                        </code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold uppercase tracking-wider", categoryColors[func.category] || 'bg-admin-bg-muted')}
                    >
                      {func.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(func.tags || []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[9px] font-bold uppercase tracking-wider bg-admin-accent/5 border-admin-accent/20 text-admin-accent"
                        >
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {(func.tags || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{func.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {func.events_emitted.slice(0, 2).map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-[9px] font-bold uppercase tracking-wider bg-admin-secondary/10 text-admin-secondary-text border-admin-secondary/20 font-mono"
                        >
                          <Zap className="h-2 w-2 mr-1" />
                          {event}
                        </Badge>
                      ))}
                      {func.events_emitted.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{func.events_emitted.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={func.is_enabled}
                      onCheckedChange={() => handleToggle(func)}
                      disabled={func.is_core || updateFunction.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedFunction(func)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-sm font-bold font-roboto-slab uppercase tracking-wider">
                              <Code className="h-4 w-4 text-admin-accent" />
                              {selectedFunction?.name}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedFunction && (
                            <FunctionDetails func={selectedFunction} />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(func)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(func)}
                        disabled={func.is_core}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <FunctionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        func={editingFunction}
        existingFunctions={functions || []}
        onSubmit={handleFormSubmit}
        isSubmitting={createFunction.isPending || updateFunction.isPending}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Function</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{functionToDelete?.name}"? This action cannot be undone.
              {functionToDelete && functionToDelete.depends_on.length > 0 && (
                <span className="block mt-2 text-admin-error">
                  Warning: This function has dependencies. Deleting it may break other functions.
                </span>
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

function FunctionDetails({ func }: { func: ChatFunction }) {
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-6 pr-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Description</h4>
          <p className="text-sm text-admin-text-muted">{func.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Category</h4>
            <Badge variant="outline" className={categoryColors[func.category]}>
              {func.category}
            </Badge>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Code Path</h4>
            <code className="text-xs bg-admin-bg-muted px-2 py-1 rounded font-mono block">
              {func.code_path || 'Not specified'}
            </code>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Tags</h4>
          <div className="flex flex-wrap gap-1">
            {(func.tags || []).length > 0 ? (
              func.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs bg-admin-accent/10">
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-admin-text-muted">No tags</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Events Emitted</h4>
          <div className="flex flex-wrap gap-1">
            {func.events_emitted.map((event) => (
              <Badge key={event} variant="secondary" className="font-mono text-xs">
                <Zap className="h-2.5 w-2.5 mr-1" />
                {event}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Input Schema</h4>
          <pre className="text-xs bg-admin-bg-muted p-3 rounded-md overflow-x-auto font-mono">
            {JSON.stringify(func.input_schema, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Output Schema</h4>
          <pre className="text-xs bg-admin-bg-muted p-3 rounded-md overflow-x-auto font-mono">
            {JSON.stringify(func.output_schema, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Dependencies</h4>
            {func.depends_on.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {func.depends_on.map((dep) => (
                  <code
                    key={dep}
                    className="text-xs bg-admin-bg-muted px-1.5 py-0.5 rounded font-mono"
                  >
                    {dep}
                  </code>
                ))}
              </div>
            ) : (
              <span className="text-xs text-admin-text-muted">No dependencies</span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Flags</h4>
            <div className="flex gap-2">
              {func.is_core && (
                <Badge variant="default" className="bg-admin-info">
                  <Lock className="h-3 w-3 mr-1" />
                  Core
                </Badge>
              )}
              <Badge variant={func.is_enabled ? 'default' : 'secondary'}>
                {func.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
