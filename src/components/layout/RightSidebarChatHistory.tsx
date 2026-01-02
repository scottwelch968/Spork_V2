import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useChatContext } from '@/contexts/ChatContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
  model: string | null;
  user_id?: string;
}

export function RightSidebarChatHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentWorkspaceId } = useChatContext();

  // Get current chat ID based on context
  const getCurrentChatId = () => {
    const params = new URLSearchParams(location.search);
    if (currentWorkspaceId) {
      return params.get('chatId');
    }
    return params.get('id');
  };
  
  const currentChatId = getCurrentChatId();

  // Context-aware chat query
  const { data: chats = [], isLoading } = useQuery({
    queryKey: currentWorkspaceId 
      ? ['space-chats', currentWorkspaceId] 
      : ['user-chats', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      if (currentWorkspaceId) {
        // WORKSPACE CHATS: Query by space_id - ALL members see same chats
        const { data, error } = await supabase
          .from('space_chats')
          .select('id, title, updated_at, model, user_id')
          .eq('space_id', currentWorkspaceId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Chat[];
      } else {
        // PERSONAL CHATS: Query by user_id
        const { data, error } = await supabase
          .from('chats')
          .select('id, title, updated_at, model')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []) as Chat[];
      }
    },
    enabled: !!user?.id,
  });

  // Context-aware delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const table = currentWorkspaceId ? 'space_chats' : 'chats';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', chatId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: currentWorkspaceId 
          ? ['space-chats', currentWorkspaceId] 
          : ['user-chats', user?.id] 
      });
      toast({ title: 'Chat deleted' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to delete chat', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const groupChatsByDate = (chats: Chat[]) => {
    const now = new Date();
    const today: Chat[] = [];
    const yesterday: Chat[] = [];
    const older: Chat[] = [];

    chats.forEach(chat => {
      const chatDate = new Date(chat.updated_at);
      const diffInDays = Math.floor((now.getTime() - chatDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        today.push(chat);
      } else if (diffInDays === 1) {
        yesterday.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupChatsByDate(chats);

  // Context-aware navigation
  const handleChatClick = (chatId: string) => {
    console.log('[ChatHistory] Navigating to chat:', chatId, 'workspace:', currentWorkspaceId);
    if (currentWorkspaceId) {
      navigate(`/workspace/${currentWorkspaceId}?tab=chats&chatId=${chatId}`);
    } else {
      navigate(`/chat?id=${chatId}`, { replace: false });
    }
  };

  // Delete chat immediately without confirmation
  const handleDelete = async (chatId: string) => {
    try {
      const messagesTable = currentWorkspaceId ? 'space_chat_messages' : 'messages';
      
      // Fetch messages to check for temp images to clean up
      const { data: messages } = await supabase
        .from(messagesTable)
        .select('content')
        .eq('chat_id', chatId)
        .like('content', '[IMAGE:%');

      const imageMessages = messages?.filter(m => 
        m.content.startsWith('[IMAGE:') && !m.content.includes('[IMAGE:EXPIRED]')
      ) || [];
      
      // Extract temp image URLs to delete from storage
      const imageUrls = imageMessages
        .map(m => {
          const urlEnd = m.content.indexOf(']');
          return m.content.slice(7, urlEnd);
        })
        .filter(url => url.includes('/temp-ai-images/'));

      // Delete temp images from storage if any (ignore errors)
      if (imageUrls.length > 0) {
        const paths = imageUrls.map(url => {
          const parts = url.split('/user-files/');
          return parts[1];
        }).filter(Boolean);

        if (paths.length > 0) {
          await supabase.storage.from('user-files').remove(paths).catch(() => {});
        }
      }

      // Delete the chat immediately
      deleteMutation.mutate(chatId);
    } catch (error) {
      console.error('Error during delete:', error);
      // Still try to delete the chat even if image cleanup failed
      deleteMutation.mutate(chatId);
    }
  };

  const handleRename = (chatId: string) => {
    // TODO: Implement rename functionality
    toast({ title: 'Rename coming soon' });
  };

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const isActive = chat.id === currentChatId;

    return (
      <div
        className={`group ui-list-item ${isActive ? 'ui-list-item-active' : ''}`}
        onClick={() => handleChatClick(chat.id)}
      >
        <div className="ui-list-item-content">
          <p className="ui-list-item-title">{chat.title}</p>
          <p className="ui-list-item-meta">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
          </p>
        </div>
        <div className="ui-list-item-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-muted-fg" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleRename(chat.id);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-danger focus:text-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const ChatGroup = ({ title, chats }: { title: string; chats: Chat[] }) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-muted-fg mb-2 px-3 uppercase tracking-wide">
          {title}
        </h4>
        <div className="ui-list">
          {chats.map(chat => (
            <ChatItem key={chat.id} chat={chat} />
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-fg">Loading chats...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3">
        {chats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-fg">
              No chat history yet
            </p>
            <p className="text-xs text-muted-fg mt-2">
              Start a conversation to see it here
            </p>
          </div>
        ) : (
          <>
            <ChatGroup title="Today" chats={today} />
            <ChatGroup title="Yesterday" chats={yesterday} />
            <ChatGroup title="Older" chats={older} />
          </>
        )}
      </div>
    </ScrollArea>
  );
}
