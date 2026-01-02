import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpaceChats } from '@/hooks/useSpaceChats';
import { useFiles } from '@/hooks/useFiles';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useSpaceManagement, SpaceActivity } from '@/hooks/useSpaceManagement';
import { useSpaceTasks } from '@/hooks/useSpaceTasks';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  FileText, 
  Image, 
  File, 
  Activity,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  UserMinus,
  UserCog,
  Upload,
  Sparkles,
  BookOpen,
  Trash2,
  FolderPlus,
  FolderMinus,
  Edit,
  Star,
  CheckSquare,
  CheckCircle,
  ListTodo,
  Settings,
  Archive,
  ArchiveRestore,
  Bot,
  Shield,
  Rocket,
  Search,
  LayoutList
} from 'lucide-react';
import { ActivityAction } from '@/utils/logActivity';

// Legacy action type for backwards compatibility with existing activity data
type LegacySpaceActivityAction =
  | 'created_space' | 'settings_updated' | 'space_archived' | 'space_unarchived'
  | 'started_chat' | 'chat_updated' | 'chat_deleted'
  | 'uploaded_file' | 'file_deleted' | 'file_moved' | 'file_renamed'
  | 'folder_created' | 'folder_deleted' | 'folder_renamed'
  | 'task_created' | 'task_updated' | 'task_deleted' | 'task_status_changed' | 'task_assigned'
  | 'member_invited' | 'member_joined' | 'member_removed' | 'member_left' | 'member_role_changed'
  | 'created_persona' | 'persona_updated' | 'persona_deleted' | 'default_persona_changed'
  | 'created_prompt' | 'prompt_updated' | 'prompt_deleted'
  | 'ai_model_changed' | 'ai_instructions_updated' | 'compliance_rule_updated';

// Icon mapping for all activity types (supports both legacy and new action formats)
const ACTION_ICONS: Record<string, React.ElementType> = {
  // New activity-centric actions
  created: Rocket,
  updated: Edit,
  deleted: Trash2,
  archived: Archive,
  unarchived: ArchiveRestore,
  sent: MessageSquare,
  generated: Sparkles,
  installed: FolderPlus,
  uninstalled: FolderMinus,
  used: CheckCircle,
  invited: UserPlus,
  joined: UserPlus,
  removed: UserMinus,
  left: UserMinus,
  uploaded: Upload,
  downloaded: File,
  moved: File,
  renamed: Edit,
  // Legacy actions (backwards compatibility)
  created_space: Rocket,
  settings_updated: Settings,
  space_archived: Archive,
  space_unarchived: ArchiveRestore,
  started_chat: MessageSquare,
  chat_updated: Edit,
  chat_deleted: Trash2,
  uploaded_file: Upload,
  file_deleted: Trash2,
  file_moved: File,
  file_renamed: Edit,
  folder_created: FolderPlus,
  folder_deleted: FolderMinus,
  folder_renamed: Edit,
  task_created: ListTodo,
  task_updated: Edit,
  task_deleted: Trash2,
  task_status_changed: CheckCircle,
  task_assigned: UserPlus,
  member_invited: UserPlus,
  member_joined: UserPlus,
  member_removed: UserMinus,
  member_left: UserMinus,
  member_role_changed: UserCog,
  created_persona: Sparkles,
  persona_updated: Edit,
  persona_deleted: Trash2,
  default_persona_changed: Star,
  created_prompt: BookOpen,
  prompt_updated: Edit,
  prompt_deleted: Trash2,
  ai_model_changed: Bot,
  ai_instructions_updated: FileText,
  compliance_rule_updated: Shield,
};

// Human-readable labels for activity types
const ACTION_LABELS: Record<string, string> = {
  // New activity-centric actions
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  archived: 'Archived',
  unarchived: 'Unarchived',
  sent: 'Sent',
  generated: 'Generated',
  installed: 'Installed',
  uninstalled: 'Uninstalled',
  used: 'Used',
  invited: 'Invited',
  joined: 'Joined',
  removed: 'Removed',
  left: 'Left',
  uploaded: 'Uploaded',
  downloaded: 'Downloaded',
  moved: 'Moved',
  renamed: 'Renamed',
  // Legacy actions
  created_space: 'Created space',
  settings_updated: 'Updated settings',
  space_archived: 'Archived space',
  space_unarchived: 'Unarchived space',
  started_chat: 'Started chat',
  chat_updated: 'Updated chat',
  chat_deleted: 'Deleted chat',
  uploaded_file: 'Uploaded file',
  file_deleted: 'Deleted file',
  file_moved: 'Moved file',
  file_renamed: 'Renamed file',
  folder_created: 'Created folder',
  folder_deleted: 'Deleted folder',
  folder_renamed: 'Renamed folder',
  task_created: 'Created task',
  task_updated: 'Updated task',
  task_deleted: 'Deleted task',
  task_status_changed: 'Changed task status',
  task_assigned: 'Assigned task',
  member_invited: 'Invited member',
  member_joined: 'Member joined',
  member_removed: 'Removed member',
  member_left: 'Member left',
  member_role_changed: 'Changed member role',
  created_persona: 'Created persona',
  persona_updated: 'Updated persona',
  persona_deleted: 'Deleted persona',
  default_persona_changed: 'Changed default persona',
  created_prompt: 'Created prompt',
  prompt_updated: 'Updated prompt',
  prompt_deleted: 'Deleted prompt',
  ai_model_changed: 'Changed AI model',
  ai_instructions_updated: 'Updated AI instructions',
  compliance_rule_updated: 'Updated compliance rule',
};

interface RecentActivityPanelProps {
  spaceId: string;
}

type FilterType = 'activity' | 'chats' | 'tasks' | 'files';

export function RecentActivityPanel({ spaceId }: RecentActivityPanelProps) {
  const [, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState<SpaceActivity[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('activity');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { chats, isLoading: chatsLoading } = useSpaceChats(spaceId);
  const { files, isLoading: filesLoading } = useFiles(spaceId);
  const { documents, isLoading: docsLoading } = useKnowledgeBase();
  const { tasks, isLoading: tasksLoading } = useSpaceTasks(spaceId);
  const { fetchActivity } = useSpaceManagement(spaceId);

  useEffect(() => {
    const loadActivity = async () => {
      const data = await fetchActivity();
      setActivities(data);
    };
    loadActivity();
  }, [spaceId]);

  const recentChats = useMemo(() => {
    return [...(chats || [])]
      .sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime());
  }, [chats]);

  const recentFiles = useMemo(() => {
    const fileItems = (files || []).map(f => ({
      id: f.id,
      name: f.original_name || f.file_name,
      type: f.file_type,
      size: f.file_size,
      createdAt: f.created_at,
      source: 'file' as const
    }));
    const docItems = (documents || []).map(d => ({
      id: d.id,
      name: d.file_name,
      type: d.file_type,
      size: d.file_size,
      createdAt: d.created_at,
      source: 'knowledge-base' as const
    }));
    return [...fileItems, ...docItems]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
  }, [files, documents]);

  const getActivityIcon = (action: string) => {
    const IconComponent = ACTION_ICONS[action] || Activity;
    return IconComponent;
  };

  const getActivityLabel = (action: string, details: Record<string, any>, resourceType?: string, resourceName?: string) => {
    // Try new format first: action + resourceType + resourceName
    if (resourceType) {
      const label = ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const name = resourceName || details?.name || details?.title;
      return name ? `${label} ${resourceType}: ${name}` : `${label} ${resourceType}`;
    }
    
    // Fall back to legacy format
    const label = ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    
    if (details?.chat_title) return `${label}: ${details.chat_title}`;
    if (details?.file_name) return `${label}: ${details.file_name}`;
    if (details?.folder_name) return `${label}: ${details.folder_name}`;
    if (details?.task_title) return `${label}: ${details.task_title}`;
    if (details?.persona_name) return `${label}: ${details.persona_name}`;
    if (details?.prompt_title) return `${label}: ${details.prompt_title}`;
    if (details?.invited_email) return `${label}: ${details.invited_email}`;
    if (details?.member_email) return `${label}: ${details.member_email}`;
    
    return label;
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return Image;
    if (type?.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleActivityClick = (activity: SpaceActivity) => {
    const details = (activity.details as Record<string, any>) || {};
    const action = activity.action;
    const resourceType = (activity as any).resource_type;
    
    // Handle new activity-centric format
    if (resourceType) {
      switch (resourceType) {
        case 'chat':
        case 'message':
          if (details.chat_id || (activity as any).resource_id) {
            setSearchParams({ tab: 'chats', chatId: details.chat_id || (activity as any).resource_id });
          } else {
            setSearchParams({ tab: 'chats' });
          }
          break;
        case 'file':
        case 'folder':
          setSearchParams({ tab: 'files' });
          break;
        case 'task':
          setSearchParams({ tab: 'tasks' });
          break;
        case 'member':
          setSearchParams({ tab: 'members' });
          break;
        case 'persona':
        case 'prompt':
        case 'settings':
          setSearchParams({ tab: 'ai-config' });
          break;
        case 'space':
          setSearchParams({ tab: 'settings' });
          break;
        default:
          break;
      }
      return;
    }
    
    // Handle legacy action format
    switch (action) {
      case 'started_chat':
      case 'chat_updated':
      case 'chat_deleted':
        if (details.chat_id) {
          setSearchParams({ tab: 'chats', chatId: details.chat_id });
        } else {
          setSearchParams({ tab: 'chats' });
        }
        break;
      case 'uploaded_file':
      case 'file_deleted':
      case 'file_moved':
      case 'file_renamed':
      case 'folder_created':
      case 'folder_deleted':
      case 'folder_renamed':
        setSearchParams({ tab: 'files' });
        break;
      case 'task_created':
      case 'task_updated':
      case 'task_deleted':
      case 'task_status_changed':
      case 'task_assigned':
        setSearchParams({ tab: 'tasks' });
        break;
      case 'member_invited':
      case 'member_joined':
      case 'member_removed':
      case 'member_left':
      case 'member_role_changed':
        setSearchParams({ tab: 'members' });
        break;
      case 'created_persona':
      case 'persona_updated':
      case 'persona_deleted':
      case 'default_persona_changed':
      case 'created_prompt':
      case 'prompt_updated':
      case 'prompt_deleted':
      case 'ai_model_changed':
      case 'ai_instructions_updated':
      case 'compliance_rule_updated':
        setSearchParams({ tab: 'ai-config' });
        break;
      case 'settings_updated':
      case 'space_archived':
      case 'space_unarchived':
        setSearchParams({ tab: 'settings' });
        break;
      default:
        break;
    }
  };

  const handleChatClick = (chatId: string) => {
    setSearchParams({ tab: 'chats', chatId: chatId });
  };

  const handleFileClick = (source: 'file' | 'knowledge-base') => {
    setSearchParams({ tab: source === 'knowledge-base' ? 'knowledge' : 'files' });
  };

  // Filter and search logic for each tab
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (activeFilter === 'activity') {
      return activities.filter(a => {
        const label = getActivityLabel(a.action, a.details || {});
        const userName = [a.profiles?.first_name, a.profiles?.last_name].filter(Boolean).join(' ') || '';
        return label.toLowerCase().includes(query) || userName.toLowerCase().includes(query);
      });
    }
    if (activeFilter === 'chats') {
      return recentChats.filter(c => (c.title || 'Untitled Chat').toLowerCase().includes(query));
    }
    if (activeFilter === 'tasks') {
      return tasks.filter(t => t.title.toLowerCase().includes(query));
    }
    if (activeFilter === 'files') {
      return recentFiles.filter(f => f.name.toLowerCase().includes(query));
    }
    return [];
  }, [activeFilter, activities, recentChats, tasks, recentFiles, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset page when filter or search changes
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const isLoading = activeFilter === 'activity' ? false : 
    activeFilter === 'chats' ? chatsLoading :
    activeFilter === 'tasks' ? tasksLoading :
    filesLoading || docsLoading;

  // Render activity row
  const renderActivityRow = (activity: SpaceActivity) => {
    const Icon = getActivityIcon(activity.action);
    const label = getActivityLabel(activity.action, activity.details || {}, (activity as any).resource_type, (activity as any).resource_name);
    const userName = [activity.profiles?.first_name, activity.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown';
    
    return (
      <div 
        key={activity.id}
        onClick={() => handleActivityClick(activity)}
        className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
          <p className="text-xs text-gray-500 truncate">{userName}</p>
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </div>
      </div>
    );
  };

  // Render chat row
  const renderChatRow = (chat: any) => {
    const memberName = chat.profiles 
      ? `${chat.profiles.first_name || ''} ${chat.profiles.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown';
    
    return (
      <div 
        key={chat.id}
        onClick={() => handleChatClick(chat.id)}
        className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{chat.title || 'Untitled Chat'}</p>
          <p className="text-xs text-gray-500 truncate">{memberName}</p>
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">
          {formatDistanceToNow(new Date(chat.updated_at || chat.created_at || ''), { addSuffix: true })}
        </div>
      </div>
    );
  };

  // Render task row
  const renderTaskRow = (task: any) => {
    const Icon = task.status === 'done' ? CheckCircle : ListTodo;
    const iconColor = task.status === 'done' ? 'text-green-500' : 'text-muted-foreground';
    
    return (
      <div 
        key={task.id}
        onClick={() => setSearchParams({ tab: 'tasks' })}
        className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </p>
          <p className="text-xs text-gray-500 truncate capitalize">{task.status.replace('_', ' ')}</p>
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">
          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
        </div>
      </div>
    );
  };

  // Render file row
  const renderFileRow = (file: any) => {
    const Icon = getFileIcon(file.type);
    
    return (
      <div 
        key={file.id}
        onClick={() => handleFileClick(file.source)}
        className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-xs text-gray-500 truncate">{formatFileSize(file.size)}</p>
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">
          {formatDistanceToNow(new Date(file.createdAt || ''), { addSuffix: true })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 px-4 border-b border-gray-100 last:border-0">
          <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3" />
            <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
          </div>
          <div className="h-3 bg-gray-100 animate-pulse rounded w-16" />
        </div>
      ));
    }

    if (paginatedData.length === 0) {
      const emptyConfig: Record<FilterType, { icon: typeof Activity; message: string }> = {
        activity: { icon: Activity, message: 'No Activity' },
        chats: { icon: MessageSquare, message: 'No Chats' },
        tasks: { icon: ListTodo, message: 'No Tasks' },
        files: { icon: File, message: 'No Files' }
      };
      
      const config = emptyConfig[activeFilter];
      const EmptyIcon = config.icon;
      
      return (
        <div className="flex flex-col items-center justify-center h-full py-16">
          <EmptyIcon className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
          <p className="text-lg font-medium text-gray-900">
            {searchQuery ? 'No matching results found' : config.message}
          </p>
        </div>
      );
    }

    if (activeFilter === 'activity') {
      return (paginatedData as SpaceActivity[]).map(renderActivityRow);
    }
    if (activeFilter === 'chats') {
      return (paginatedData as any[]).map(renderChatRow);
    }
    if (activeFilter === 'tasks') {
      return (paginatedData as any[]).map(renderTaskRow);
    }
    if (activeFilter === 'files') {
      return (paginatedData as any[]).map(renderFileRow);
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header with count */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <span className="text-sm text-gray-500">
          {filteredData.length} total items
        </span>
      </div>

      {/* Filter Buttons and Search */}
      <div className="flex items-center justify-between flex-shrink-0">
        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'activity' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('activity')}
          >
            <LayoutList className="w-4 h-4 mr-2" />
            Activity
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'chats' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('chats')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chats
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'tasks' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('tasks')}
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Tasks
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'files' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('files')}
          >
            <File className="w-4 h-4 mr-2" />
            Files
          </Button>
        </div>
        
        {/* Search Input */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
      </div>

      {/* Activity Table Card - fills remaining space */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 flex-shrink-0">
          <div>{activeFilter === 'activity' ? 'Activity' : activeFilter === 'chats' ? 'Chat' : activeFilter === 'tasks' ? 'Task' : 'File'}</div>
          <div>Time</div>
        </div>

        {/* Content Rows - scrollable */}
        <div className="divide-y divide-gray-100 flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show</span>
            <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
