import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Search, Activity as ActivityIcon, ChevronLeft, ChevronRight, MessageSquare, Boxes, Sparkles, LayoutList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActivityIcon } from "@/utils/activityUtils";
import { formatUserName } from "@/utils/workspaceActivityFormat";
import { getModelDisplayName } from "@/utils/modelDisplayName";
import { useActivityLog } from "@/hooks/useActivityLog";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  onClick: () => void;
}

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  const { icon: Icon, color } = getActivityIcon(item.type);
  
  return (
    <div 
      onClick={item.onClick}
      className="flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
        <p className="text-xs text-gray-500 truncate">{item.description}</p>
      </div>
      
      <div className="text-xs text-gray-500 flex-shrink-0">
        {item.time}
      </div>
    </div>
  );
};

const Activity = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'chats' | 'workspace' | 'prompts'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { activityLog, allChats, isLoading } = useActivityLog();

  // Combine and format all activity
  const allActivity: ActivityItem[] = useMemo(() => {
    const combined = [
      ...allChats.map((chat) => ({
        id: `chat-${chat.id}`,
        type: 'chat',
        title: chat.title || 'New Chat',
        description: `Model: ${getModelDisplayName(chat.model)}`,
        time: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
        timestamp: new Date(chat.updated_at).getTime(),
        onClick: () => navigate(`/chat?id=${chat.id}`)
      })),
      ...activityLog.map((activity) => {
        const workspaceName = activity.workspace?.name || 'App';
        const userName = formatUserName(activity.profiles);
        const resourceName = activity.resource_name || activity.resource_type;
        
        // Format activity-centric title and description
        const title = activity.workspace_id 
          ? `${activity.app_section}: ${workspaceName}` 
          : `${activity.app_section}`;
        const description = `${activity.action} ${activity.resource_type}${resourceName ? `: ${resourceName}` : ''} • By: ${userName}`;
        
        return {
          id: `activity-${activity.id}`,
          type: activity.action,
          title,
          description,
          time: formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }),
          timestamp: new Date(activity.created_at).getTime(),
          onClick: () => {
            const workspaceId = activity.workspace_id;
            
            if (activity.action === 'created' && activity.resource_type === 'space' && workspaceId) {
              navigate(`/workspace/${workspaceId}`);
            } else if (activity.resource_type === 'file') {
              navigate('/files');
            } else if (activity.resource_type === 'chat' && activity.resource_id) {
              navigate(`/chat?id=${activity.resource_id}`);
            } else if (activity.resource_type === 'task' && workspaceId) {
              navigate(`/workspace/${workspaceId}?tab=tasks`);
            } else if (workspaceId) {
              navigate(`/workspace/${workspaceId}`);
            }
          }
        };
      })
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    return combined;
  }, [allChats, activityLog, navigate]);

  // Filter by type and search
  const filteredActivity = useMemo(() => {
    let filtered = allActivity;
    
    // Apply type filter
    if (activeFilter === 'chats') {
      filtered = filtered.filter(item => item.type === 'chat' || item.type === 'started_chat');
    } else if (activeFilter === 'workspace') {
      filtered = filtered.filter(item => 
        ['created_space', 'uploaded_file', 'started_chat'].includes(item.type)
      );
    } else if (activeFilter === 'prompts') {
      filtered = filtered.filter(item => 
        ['created_prompt', 'created_persona', 'deleted_prompt', 'deleted_persona'].includes(item.type)
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => item.title.toLowerCase().includes(query) || 
                item.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allActivity, activeFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);
  const paginatedActivity = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActivity.slice(start, start + itemsPerPage);
  }, [filteredActivity, currentPage, itemsPerPage]);

  // Reset page when search or filter changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'chats' | 'workspace' | 'prompts') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-roboto-slab font-semibold">All Activity</h1>
        <span className="text-sm text-gray-500">
          {filteredActivity.length} total items
        </span>
      </div>

      {/* Filter Buttons and Search */}
      <div className="flex items-center justify-between">
        {/* Filter Buttons - Left aligned, oval */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'all' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('all')}
          >
            <LayoutList className="w-4 h-4 mr-2" />
            All
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
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'workspace' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('workspace')}
          >
            <Boxes className="w-4 h-4 mr-2" />
            Spaces Activity
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            className={`rounded-full border border-border hover:bg-accent px-4 ${activeFilter === 'prompts' ? 'bg-accent' : 'bg-transparent'}`}
            onClick={() => handleFilterChange('prompts')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Prompt / Persona
          </Button>
        </div>
        
        {/* Smaller Search Input */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search activity..." 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
      </div>

      {/* Activity Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
          <div>Activity</div>
          <div>Time</div>
        </div>

        {/* Activity Rows */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 px-4">
                <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-100 animate-pulse rounded w-16" />
              </div>
            ))
          ) : paginatedActivity.length > 0 ? (
            paginatedActivity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))
          ) : (
            <div className="py-12 text-center text-gray-500">
              <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{searchQuery ? 'No matching activity found' : 'No activity yet'}</p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Start a chat or create a space to see activity here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredActivity.length > 0 && (
        <div className="flex items-center justify-between">
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">per page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
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
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
