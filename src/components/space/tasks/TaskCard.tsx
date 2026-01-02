import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import type { SpaceTask } from '@/hooks/useSpaceTasks';

interface TaskCardProps {
  task: SpaceTask;
  isOwner: boolean;
  onUpdateStatus: (status: 'todo' | 'in_progress' | 'done') => void;
  onDelete: () => void;
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

export function TaskCard({ task, isOwner, onUpdateStatus, onDelete }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <Badge className={priorityColors[task.priority]} variant="secondary">
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={task.assignee.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {(task.assignee.first_name || task.assignee.email)?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[120px]">
              {[task.assignee.first_name, task.assignee.last_name].filter(Boolean).join(' ') || task.assignee.email}
            </span>
          </div>
        )}
        {!task.assignee && (
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <User className="h-4 w-4" />
            <span>Unassigned</span>
          </div>
        )}
        {task.due_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Select value={task.status} onValueChange={(v) => onUpdateStatus(v as 'todo' | 'in_progress' | 'done')}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">{statusLabels.todo}</SelectItem>
            <SelectItem value="in_progress">{statusLabels.in_progress}</SelectItem>
            <SelectItem value="done">{statusLabels.done}</SelectItem>
          </SelectContent>
        </Select>

        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
