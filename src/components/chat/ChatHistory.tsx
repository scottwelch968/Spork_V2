import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSpace } from '@/hooks/useSpace';
import { useFolders } from '@/hooks/useFolders';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Trash2, FolderPlus, Loader2 } from 'lucide-react';
import { FolderDialog } from '@/components/folders/FolderDialog';
import { FolderItem } from '@/components/folders/FolderItem';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatHistoryProps {
  isCollapsed?: boolean;
}

export const ChatHistory = ({ isCollapsed = false }: ChatHistoryProps) => {
  const navigate = useNavigate();
  const { id: currentChatId } = useParams();
  const { currentSpace } = useSpace();
  const {
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    addChatToFolder,
    removeChatFromFolder,
  } = useFolders();

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatFolders, setChatFolders] = useState<Record<string, string>>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (currentSpace) {
      fetchChats();
      fetchChatFolders();
    }
  }, [currentSpace]);

  const fetchChats = async () => {
    if (!currentSpace) return;

    const { data, error } = await supabase
      .from('chats')
      .select('id, title, updated_at')
      .eq('workspace_id', currentSpace.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

    setChats(data || []);
  };

  const fetchChatFolders = async () => {
    const { data } = await supabase.from('chat_folders').select('chat_id, folder_id');
    if (data) {
      const mapping: Record<string, string> = {};
      data.forEach((item) => {
        mapping[item.chat_id] = item.folder_id;
      });
      setChatFolders(mapping);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent rapid clicking - guard against multiple simultaneous deletes
    if (isDeleting) return;
    setIsDeleting(chatId);
    
    try {
      const { error } = await supabase.from('chats').delete().eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        toast.error('Failed to delete chat');
        return;
      }

      toast.success('Chat deleted');
      
      // If deleting the currently viewed chat, navigate away FIRST before refreshing list
      if (currentChatId === chatId) {
        navigate('/chat', { replace: true });
      }
      
      // Then refresh the list
      await fetchChats();
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderDialogOpen(true);
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = async (name: string, color: string) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, name, color);
    } else {
      await createFolder(name, color);
    }
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (confirm('Are you sure you want to delete this folder? Chats will not be deleted.')) {
      await deleteFolder(folderId);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const chatId = active.id.toString().replace('chat-', '');
    const overId = over.id.toString();

    if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');
      await addChatToFolder(chatId, folderId);
      await fetchChatFolders();
    } else if (overId === 'unfiled') {
      await removeChatFromFolder(chatId);
      await fetchChatFolders();
    }
  };

  const unfiledChats = chats.filter((chat) => !chatFolders[chat.id]);

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `chat-${chat.id}`,
      data: { type: 'chat', chatId: chat.id },
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => !isDragging && navigate(`/chat/${chat.id}`)}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
          currentChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="text-sm truncate flex-1">{chat.title}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleDeleteChat(chat.id, e)}
              disabled={isDeleting === chat.id}
            >
              {isDeleting === chat.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="space-y-2">
        {chats.slice(0, 5).map((chat) => (
          <div
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
            className={`p-2 rounded-md cursor-pointer transition-colors ${
              currentChatId === chat.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-muted-foreground">FOLDERS</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCreateFolder}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1">
            {folders.map((folder) => {
              const folderChats = chats.filter((chat) => chatFolders[chat.id] === folder.id);
              return (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  chatCount={folderChats.length}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onEdit={() => handleEditFolder(folder)}
                  onDelete={() => handleDeleteFolder(folder.id)}
                >
                  {folderChats.map((chat) => (
                    <ChatItem key={chat.id} chat={chat} />
                  ))}
                </FolderItem>
              );
            })}
          </div>
        </ScrollArea>

        {unfiledChats.length > 0 && (
          <>
            <div className="px-2 pt-2">
              <span className="text-xs font-medium text-muted-foreground">RECENT CHATS</span>
            </div>
            <div className="space-y-1">
              {unfiledChats.map((chat) => (
                <ChatItem key={chat.id} chat={chat} />
              ))}
            </div>
          </>
        )}
      </div>

      <FolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        onSave={handleSaveFolder}
        folder={editingFolder}
      />

      <DragOverlay>
        {activeId ? (
          <div className="bg-card border-2 border-primary rounded-md p-2 shadow-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Moving chat...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
