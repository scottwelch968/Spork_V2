import { MessageSquare, Activity, FileText, Boxes, Upload, Bot, LucideIcon, ListTodo, CheckCircle, UserPlus, Trash2, Edit } from "lucide-react";

export interface ActivityIconConfig {
  icon: LucideIcon;
  color: string;
}

export const getActivityIcon = (type: string): ActivityIconConfig => {
  switch (type) {
    case 'chat':
      return { icon: MessageSquare, color: 'text-blue-600' };
    case 'created_space':
      return { icon: Boxes, color: 'text-purple-600' };
    case 'uploaded_file':
      return { icon: Upload, color: 'text-green-600' };
    case 'started_chat':
      return { icon: MessageSquare, color: 'text-blue-600' };
    case 'created_persona':
      return { icon: Bot, color: 'text-orange-600' };
    case 'created_prompt':
      return { icon: FileText, color: 'text-pink-600' };
    case 'task_created':
      return { icon: ListTodo, color: 'text-emerald-600' };
    case 'task_updated':
      return { icon: Edit, color: 'text-amber-600' };
    case 'task_status_changed':
      return { icon: CheckCircle, color: 'text-green-600' };
    case 'task_assigned':
      return { icon: UserPlus, color: 'text-indigo-600' };
    case 'task_deleted':
      return { icon: Trash2, color: 'text-red-600' };
    default:
      return { icon: Activity, color: 'text-gray-600' };
  }
};
