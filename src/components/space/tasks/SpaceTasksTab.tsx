import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSpaceTasks } from '@/hooks/useSpaceTasks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, ListTodo, Clock, CheckCircle, LayoutGrid, List, Trash2, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { format } from 'date-fns';
import type { SpaceTask } from '@/hooks/useSpaceTasks';

type SortField = 'due_date' | 'title' | 'priority' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const priorityOrder = { high: 0, medium: 1, low: 2 };
const statusOrder = { todo: 0, in_progress: 1, done: 2 };

interface SpaceTasksTabProps {
  spaceId: string;
  isOwner: boolean;
}

const priorityColors = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export function SpaceTasksTab({
  spaceId,
  isOwner
}: SpaceTasksTabProps) {
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    isCreating
  } = useSpaceTasks(spaceId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('tasks-view-mode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });

  useEffect(() => {
    localStorage.setItem('tasks-view-mode', viewMode);
  }, [viewMode]);

  // Fetch workspace members for task assignment - use profiles_safe to exclude email
  const {
    data: members = []
  } = useQuery({
    queryKey: ['workspace-members', spaceId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('workspace_members').select('user_id, profiles_safe:user_id(id, first_name, last_name)').eq('workspace_id', spaceId);
      if (error) throw error;
      // Map profiles_safe to profiles for consistency
      return (data || []).map((m: any) => ({ ...m, profiles: m.profiles_safe }));
    },
    enabled: !!spaceId
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredTasks = useMemo(() => {
    const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'due_date':
          // Null due dates go to the bottom
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, statusFilter, sortField, sortDirection]);

  const filteredTasks = sortedAndFilteredTasks;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const membersList = members.map((m: any) => ({
    id: m.user_id,
    first_name: m.profiles?.first_name || null,
    last_name: m.profiles?.last_name || null
  }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  const getAssigneeDisplayName = (assignee: SpaceTask['assignee']) => {
    if (!assignee) return '';
    const name = [assignee.first_name, assignee.last_name].filter(Boolean).join(' ');
    return name || assignee.email;
  };

  return <div className="space-y-6">
      <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-transparent p-0 h-auto rounded-none justify-start gap-2">
            <TabsTrigger 
              value="all" 
              className="rounded-full border border-border data-[state=active]:border-border data-[state=active]:bg-muted px-4 py-2 gap-2"
            >
              All
              <CountBadge count={tasks.length} />
            </TabsTrigger>
            <TabsTrigger 
              value="todo" 
              className="rounded-full border border-border data-[state=active]:border-border data-[state=active]:bg-muted px-4 py-2 gap-2"
            >
              <ListTodo className="h-4 w-4" />
              To Do
              <CountBadge count={todoCount} />
            </TabsTrigger>
            <TabsTrigger 
              value="in_progress" 
              className="rounded-full border border-border data-[state=active]:border-border data-[state=active]:bg-muted px-4 py-2 gap-2"
            >
              <Clock className="h-4 w-4" />
              In Progress
              <CountBadge count={inProgressCount} />
            </TabsTrigger>
            <TabsTrigger 
              value="done" 
              className="rounded-full border border-border data-[state=active]:border-border data-[state=active]:bg-muted px-4 py-2 gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Done
              <CountBadge count={doneCount} />
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-full overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={`rounded-none px-3 h-9 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`rounded-none px-3 h-9 ${viewMode === 'list' ? 'bg-muted' : ''}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {isOwner && <Button className="rounded-full" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>}
          </div>
        </div>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks {statusFilter !== 'all' ? `with status "${statusFilter.replace('_', ' ')}"` : 'yet'}</p>
              {isOwner && statusFilter === 'all' && (
                <Button variant="outline" className="rounded-full mt-4" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first task
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  isOwner={isOwner} 
                  onUpdateStatus={status => updateTask({
                    taskId: task.id,
                    updates: { status }
                  })} 
                  onDelete={() => deleteTask(task.id)} 
                />
              ))}
            </div>
          ) : (
            <TaskTable 
              tasks={filteredTasks} 
              isOwner={isOwner} 
              onUpdateStatus={(taskId, status) => updateTask({ taskId, updates: { status } })}
              onDelete={(taskId) => deleteTask(taskId)}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              getAssigneeDisplayName={getAssigneeDisplayName}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateTaskDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreateTask={createTask} members={membersList} isCreating={isCreating} />
    </div>;
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
      {count}
    </span>
  );
}

interface TaskTableProps {
  tasks: SpaceTask[];
  isOwner: boolean;
  onUpdateStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  getAssigneeDisplayName: (assignee: SpaceTask['assignee']) => string;
}

function SortableHeader({ 
  field, 
  currentField, 
  direction, 
  onSort, 
  children 
}: { 
  field: SortField; 
  currentField: SortField; 
  direction: SortDirection; 
  onSort: (field: SortField) => void; 
  children: React.ReactNode;
}) {
  const isActive = field === currentField;
  return (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive ? (
          direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </TableHead>
  );
}

function TaskTable({ tasks, isOwner, onUpdateStatus, onDelete, sortField, sortDirection, onSort, getAssigneeDisplayName }: TaskTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="title" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Task
            </SortableHeader>
            <SortableHeader field="priority" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Priority
            </SortableHeader>
            <TableHead>Assignee</TableHead>
            <SortableHeader field="due_date" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Due Date
            </SortableHeader>
            <SortableHeader field="status" currentField={sortField} direction={sortDirection} onSort={onSort}>
              Status
            </SortableHeader>
            {isOwner && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id}>
              <TableCell>
                <div className="min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">{task.description}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[task.priority]} variant="secondary">
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getAssigneeDisplayName(task.assignee)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[120px] text-sm">
                      {getAssigneeDisplayName(task.assignee)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Unassigned</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {task.due_date ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/60 text-sm">No due date</span>
                )}
              </TableCell>
              <TableCell>
                <Select 
                  value={task.status} 
                  onValueChange={(v) => onUpdateStatus(task.id, v as 'todo' | 'in_progress' | 'done')}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{statusLabels.todo}</SelectItem>
                    <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
                    <SelectItem value="done">{statusLabels.done}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              {isOwner && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}