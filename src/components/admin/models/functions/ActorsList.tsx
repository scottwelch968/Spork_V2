/**
 * Actors List - Displays and manages chat actors
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatActors, useChatFunctions, useUpdateChatActor, useCreateChatActor, useDeleteChatActor } from '@/hooks/useChatFunctionsAdmin';
import { Users, Plus, Loader2, Lock, Settings, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { ChatActor } from '@/lib/chatFunctions/registry';

const displayModeColors: Record<string, string> = {
  ui: 'bg-green-500/10 text-green-500 border-green-500/20',
  minimal: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  silent: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function ActorsList() {
  const { data: actors, isLoading: actorsLoading } = useChatActors();
  const { data: functions } = useChatFunctions();
  const updateActor = useUpdateChatActor();
  const createActor = useCreateChatActor();
  const deleteActor = useDeleteChatActor();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState<ChatActor | null>(null);

  const handleToggle = (actor: ChatActor) => {
    if (actor.is_system) return;
    updateActor.mutate({
      id: actor.id,
      updates: { is_enabled: !actor.is_enabled },
    });
  };

  if (actorsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Registered Actors
        </CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Actor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Actor</DialogTitle>
            </DialogHeader>
            <ActorForm
              functions={functions || []}
              onSubmit={(data) => {
                createActor.mutate({
                  ...data,
                  function_sequence: data.function_sequence as unknown as Database['public']['Tables']['chat_actors']['Insert']['function_sequence'],
                  context_defaults: data.context_defaults as unknown as Database['public']['Tables']['chat_actors']['Insert']['context_defaults'],
                });
                setIsCreateOpen(false);
              }}
              isSubmitting={createActor.isPending}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Actor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Display Mode</TableHead>
              <TableHead>Allowed Functions</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actors?.map((actor) => (
              <TableRow key={actor.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {actor.is_system && (
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{actor.name}</div>
                      <code className="text-xs text-muted-foreground font-mono">
                        {actor.actor_type}
                      </code>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {actor.description || 'No description'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={displayModeColors[actor.default_display_mode]}
                  >
                    {actor.default_display_mode}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {actor.allowed_functions.slice(0, 3).map((func) => (
                      <code
                        key={func}
                        className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                      >
                        {func}
                      </code>
                    ))}
                    {actor.allowed_functions.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{actor.allowed_functions.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={actor.is_enabled}
                    onCheckedChange={() => handleToggle(actor)}
                    disabled={actor.is_system || updateActor.isPending}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedActor(actor)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Actor: {selectedActor?.name}</DialogTitle>
                        </DialogHeader>
                        {selectedActor && (
                          <ActorForm
                            actor={selectedActor}
                            functions={functions || []}
                            onSubmit={(data) => {
                              updateActor.mutate({
                                id: selectedActor.id,
                                updates: {
                                  ...data,
                                  function_sequence: data.function_sequence as unknown as Database['public']['Tables']['chat_actors']['Update']['function_sequence'],
                                  context_defaults: data.context_defaults as unknown as Database['public']['Tables']['chat_actors']['Update']['context_defaults'],
                                },
                              });
                            }}
                            isSubmitting={updateActor.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    {!actor.is_system && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Actor: {actor.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this actor. Any functions or containers 
                              referencing this actor may stop working.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteActor.mutate(actor.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteActor.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface FunctionStep {
  function: string;
  required: boolean;
  waitForResult?: boolean;
  stream?: boolean;
  onError?: 'fail' | 'continue' | 'retry';
}

interface ActorFormData {
  actor_type: string;
  name: string;
  description: string;
  default_display_mode: 'ui' | 'minimal' | 'silent';
  allowed_functions: string[];
  function_sequence: FunctionStep[];
  context_defaults: Record<string, unknown>;
}

interface ActorFormProps {
  actor?: ChatActor;
  functions: Array<{ function_key: string; name: string }>;
  onSubmit: (data: ActorFormData) => void;
  isSubmitting: boolean;
}

function ActorForm({ actor, functions, onSubmit, isSubmitting }: ActorFormProps) {
  const [formData, setFormData] = useState<ActorFormData>({
    actor_type: actor?.actor_type || '',
    name: actor?.name || '',
    description: actor?.description || '',
    default_display_mode: actor?.default_display_mode || 'ui',
    allowed_functions: actor?.allowed_functions || [],
    function_sequence: actor?.function_sequence || [],
    context_defaults: actor?.context_defaults || {},
  });
  const [contextDefaultsJson, setContextDefaultsJson] = useState(
    JSON.stringify(actor?.context_defaults || {}, null, 2)
  );

  const handleFunctionToggle = (functionKey: string) => {
    setFormData((prev) => {
      const newAllowed = prev.allowed_functions.includes(functionKey)
        ? prev.allowed_functions.filter((f) => f !== functionKey)
        : [...prev.allowed_functions, functionKey];
      
      // Also update function_sequence if function is being removed
      const newSequence = prev.function_sequence.filter(
        (step) => newAllowed.includes(step.function)
      );
      
      return {
        ...prev,
        allowed_functions: newAllowed,
        function_sequence: newSequence,
      };
    });
  };

  const addToSequence = (functionKey: string) => {
    if (formData.function_sequence.some((s) => s.function === functionKey)) return;
    setFormData((prev) => ({
      ...prev,
      function_sequence: [
        ...prev.function_sequence,
        { function: functionKey, required: true, waitForResult: true },
      ],
    }));
  };

  const removeFromSequence = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      function_sequence: prev.function_sequence.filter((_, i) => i !== index),
    }));
  };

  const updateSequenceStep = (index: number, updates: Partial<FunctionStep>) => {
    setFormData((prev) => ({
      ...prev,
      function_sequence: prev.function_sequence.map((step, i) =>
        i === index ? { ...step, ...updates } : step
      ),
    }));
  };

  const moveSequenceStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.function_sequence.length) return;
    setFormData((prev) => {
      const newSequence = [...prev.function_sequence];
      [newSequence[index], newSequence[newIndex]] = [newSequence[newIndex], newSequence[index]];
      return { ...prev, function_sequence: newSequence };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse context_defaults from JSON string
    try {
      const parsedContextDefaults = JSON.parse(contextDefaultsJson);
      onSubmit({ ...formData, context_defaults: parsedContextDefaults });
    } catch {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="sequence">Function Sequence</TabsTrigger>
          <TabsTrigger value="context">Context Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Actor Type</Label>
              <Input
                value={formData.actor_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, actor_type: e.target.value }))
                }
                placeholder="e.g., custom_agent"
                disabled={!!actor}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Custom Agent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Describe what this actor does..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Display Mode</Label>
            <Select
              value={formData.default_display_mode}
              onValueChange={(value: 'ui' | 'minimal' | 'silent') =>
                setFormData((prev) => ({ ...prev, default_display_mode: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ui">UI (Full interface)</SelectItem>
                <SelectItem value="minimal">Minimal (Toast only)</SelectItem>
                <SelectItem value="silent">Silent (No UI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Allowed Functions</Label>
            <ScrollArea className="h-[120px] border rounded-md p-3">
              <div className="space-y-2">
                {functions.map((func) => (
                  <div key={func.function_key} className="flex items-center gap-2">
                    <Checkbox
                      id={func.function_key}
                      checked={formData.allowed_functions.includes(func.function_key)}
                      onCheckedChange={() => handleFunctionToggle(func.function_key)}
                    />
                    <label
                      htmlFor={func.function_key}
                      className="text-sm cursor-pointer"
                    >
                      {func.name}
                      <span className="text-muted-foreground ml-2 font-mono text-xs">
                        ({func.function_key})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="sequence" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Function Execution Sequence</Label>
            <p className="text-xs text-muted-foreground">
              Define the order in which functions execute for this actor.
            </p>
          </div>

          {formData.function_sequence.length > 0 ? (
            <div className="space-y-2 border rounded-md p-3">
              {formData.function_sequence.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveSequenceStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveSequenceStep(index, 'down')}
                      disabled={index === formData.function_sequence.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <code className="text-sm font-mono">{step.function}</code>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1">
                      <Checkbox
                        checked={step.required}
                        onCheckedChange={(checked) =>
                          updateSequenceStep(index, { required: !!checked })
                        }
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1">
                      <Checkbox
                        checked={step.stream}
                        onCheckedChange={(checked) =>
                          updateSequenceStep(index, { stream: !!checked })
                        }
                      />
                      Stream
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeFromSequence(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm border rounded-md">
              No functions in sequence. Add from allowed functions below.
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Add to Sequence</Label>
            <div className="flex flex-wrap gap-1">
              {formData.allowed_functions
                .filter((f) => !formData.function_sequence.some((s) => s.function === f))
                .map((funcKey) => (
                  <Button
                    key={funcKey}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addToSequence(funcKey)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {funcKey}
                  </Button>
                ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="context" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Context Defaults (JSON)</Label>
            <p className="text-xs text-muted-foreground">
              Default context values applied to all requests from this actor.
            </p>
            <Textarea
              value={contextDefaultsJson}
              onChange={(e) => setContextDefaultsJson(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder={`{
  "displayMode": "ui",
  "persist": true,
  "stream": true
}`}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {actor ? 'Update Actor' : 'Create Actor'}
        </Button>
      </div>
    </form>
  );
}
