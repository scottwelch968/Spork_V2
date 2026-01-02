import { useSpace } from "@/hooks/useSpace";
import { useNavigate } from "react-router-dom";
import { Activity, Boxes, Trash2, ArrowUpRight } from "lucide-react";
import { getActivityIcon } from "@/utils/activityUtils";
import { formatUserName } from "@/utils/workspaceActivityFormat";
import { getModelDisplayName } from "@/utils/modelDisplayName";
import { formatDistanceToNow } from "date-fns";
import rocketImage from "@/assets/dashboard-rocket.png";
import { useDashboardData } from "@/hooks/useDashboardData";

// Welcome Banner Component
const WelcomeBanner = ({ firstName }: { firstName: string }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 p-5 md:p-6 w-full shadow-md border-2" style={{ borderColor: '#5E53D4' }}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
        <h1 className="text-3xl md:text-4xl font-bold heading-light mb-2">
          Welcome back, {firstName || 'there'}!
        </h1>

        <span className="text-blue-100 text-base font-medium ml-1">Spork, your Ai powered workspace</span>
        </div>
        
        <div className="hidden lg:block flex-shrink-0 ml-6">
          <img 
            src={rocketImage} 
            alt="Launch your ideas" 
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};


// Simple Space Card Component
const SimpleSpaceCard = ({ space, onClick }: any) => {
  return (
    <div 
      onClick={onClick} 
      className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
        <Boxes className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{space.name}</p>
        <p className="text-xs text-gray-500">
          {space.last_activity_at 
            ? `Active ${formatDistanceToNow(new Date(space.last_activity_at), { addSuffix: true })}`
            : 'No recent activity'}
        </p>
      </div>
    </div>
  );
};


// Unified Activity Row Component
const UnifiedActivityRow = ({ item, onClick, onDelete }: { item: any; onClick: () => void; onDelete: () => void }) => {
  const { icon: Icon, color } = getActivityIcon(item.type);
  
  return (
    <div 
      onClick={onClick}
      className="group flex items-center gap-4 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
    >
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white border border-gray-300 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Title & Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
        <p className="text-xs text-gray-500 truncate">{item.description}</p>
      </div>
      
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
      </button>
      
      {/* Time */}
      <div className="text-xs text-gray-500 flex-shrink-0">
        {item.time}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { spaces, isLoading: spacesLoading } = useSpace();
  const { profile, recentActivity, recentChats, deleteChat, invalidateActivity } = useDashboardData();

  // Delete activity handler
  const handleDeleteActivity = (itemId: string) => {
    const [type, ...idParts] = itemId.split('-');
    const id = idParts.join('-');
    
    if (type === 'chat') {
      deleteChat(id);
    } else if (type === 'activity') {
      invalidateActivity();
    }
  };

  // Top 10 Spaces by last activity
  const topSpaces = spaces?.sort((a, b) => {
    const dateA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const dateB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 10) || [];

  // Combine and format activity items
  const unifiedActivity = [
    // Add chats
    ...recentChats.map((chat) => ({
      id: `chat-${chat.id}`,
      type: 'chat',
      title: chat.title || 'New Chat',
      description: `Model: ${getModelDisplayName(chat.model)}`,
      time: formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true }),
      timestamp: new Date(chat.updated_at).getTime(),
      onClick: () => navigate(`/chat?id=${chat.id}`)
    })),
    // Add activity from unified activity_log
    ...recentActivity.map((activity) => {
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
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
      {/* Hero Welcome Banner - standalone card */}
      <WelcomeBanner firstName={profile?.first_name || ''} />

      {/* Two Column Grid - standalone */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.86fr_1fr] gap-6">
        {/* Left Column - Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button 
              onClick={() => navigate('/activity')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="View all activity"
            >
              <ArrowUpRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <div>Activity</div>
            <div>Time</div>
          </div>
          
          {/* Activity Rows - 5 items visible with scroll */}
          <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto">
            {unifiedActivity.length > 0 ? (
              unifiedActivity.map((item) => (
                <UnifiedActivityRow 
                  key={item.id} 
                  item={item} 
                  onClick={item.onClick}
                  onDelete={() => handleDeleteActivity(item.id)}
                />
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start a chat or create a space to see activity here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Active Spaces */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Spaces</h2>
            <button 
              onClick={() => navigate('/workspace')}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="View all spaces"
            >
              <ArrowUpRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
            {spacesLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))
            ) : topSpaces.length > 0 ? (
              topSpaces.map(space => (
                <SimpleSpaceCard 
                  key={space.id} 
                  space={space} 
                  onClick={() => navigate(`/workspace/${space.id}`)} 
                />
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                <Boxes className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No spaces yet</p>
                <p className="text-sm">Create your first space to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
