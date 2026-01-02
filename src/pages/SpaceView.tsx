import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSpace } from '@/hooks/useSpace';
import { useAuth } from '@/contexts/AuthContext';
import { MembersTab } from '@/components/space/MembersTab';
import { UnifiedChatInterface } from '@/components/chat/UnifiedChatInterface';
import { SpaceSettingsTab } from '@/components/space/settings/SpaceSettingsTab';
import { SpaceOverviewTab } from '@/components/space/overview/SpaceOverviewTab';
import { Card } from '@/components/ui/card';
import { MessageSquare, Users, Settings, BookOpen, LayoutDashboard, ListTodo, FolderOpen } from 'lucide-react';
import { SpaceKnowledgeBaseTab } from '@/components/space/knowledge/SpaceKnowledgeBaseTab';
import { SpaceTasksTab } from '@/components/space/tasks';
import { SpaceFilesTab } from '@/components/space/files/SpaceFilesTab';
import { useChatContext } from '@/contexts/ChatContext';

export default function SpaceView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { spaces, isLoading: spaceLoading, updateSpace, deleteSpace, toggleArchive } = useSpace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setCurrentWorkspaceId } = useChatContext();
  
  const activeTab = searchParams.get('tab') || 'overview';
  const chatIdFromUrl = searchParams.get('chatId');
  const currentSpace = spaces?.find(s => s.id === id);
  const isOwner = currentSpace?.owner_id === user?.id;
  const isDefaultWorkspace = currentSpace?.is_default === true;

  // Set workspace context when entering workspace
  useEffect(() => {
    if (id) {
      setCurrentWorkspaceId(id);
    }
    return () => setCurrentWorkspaceId(null);
  }, [id, setCurrentWorkspaceId]);

  const handleChatCreated = (newChatId: string) => {
    setSearchParams({ tab: 'chats', chatId: newChatId });
  };

  if (spaceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentSpace) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold font-roboto-slab mb-2">Space Not Found</h2>
          <p className="text-muted-foreground">The space you're looking for doesn't exist or you don't have access to it.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={val => setSearchParams({ tab: val })}>
          <div className="mb-6 border-b border-[#ACACAC]">
            <TabsList variant="underline">
              <TabsTrigger value="overview">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListTodo className="h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="files">
                <FolderOpen className="h-4 w-4" />
                Files
              </TabsTrigger>
              <TabsTrigger value="knowledge">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
              {!isDefaultWorkspace && (
                <TabsTrigger value="members">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
              )}
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <SpaceOverviewTab spaceId={currentSpace.id} fileQuotaMb={currentSpace.file_quota_mb} />
          </TabsContent>

          <TabsContent value="chats" className="h-[calc(100vh-200px)]">
            <UnifiedChatInterface 
              context={{ type: 'workspace', workspaceId: currentSpace.id }}
              chatId={chatIdFromUrl || undefined}
              config={{
                aiInstructions: currentSpace.ai_instructions,
                complianceRule: currentSpace.compliance_rule,
              }}
              onChatCreated={handleChatCreated}
            />
          </TabsContent>

          <TabsContent value="knowledge">
            <SpaceKnowledgeBaseTab spaceId={currentSpace.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <SpaceTasksTab spaceId={currentSpace.id} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="files">
            <SpaceFilesTab spaceId={currentSpace.id} fileQuotaMb={currentSpace.file_quota_mb} />
          </TabsContent>

          {!isDefaultWorkspace && (
            <TabsContent value="members">
              <MembersTab spaceId={currentSpace.id} />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <SpaceSettingsTab 
              space={currentSpace} 
              isOwner={isOwner}
              isDefaultWorkspace={isDefaultWorkspace}
              onUpdate={updates => updateSpace({ id: currentSpace.id, ...updates })} 
              onDelete={async () => {
                await deleteSpace(currentSpace.id);
                navigate('/workspace');
              }} 
              onArchive={() => toggleArchive({
                spaceId: currentSpace.id,
                isArchived: currentSpace.is_archived || false
              })} 
            />
          </TabsContent>
        </Tabs>
    </div>
  );
}
