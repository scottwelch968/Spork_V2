import { useSpaceChats } from '@/hooks/useSpaceChats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface RecentChatsCardProps {
  spaceId: string;
}

export function RecentChatsCard({ spaceId }: RecentChatsCardProps) {
  const { chats, isLoading } = useSpaceChats(spaceId);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  
  const recentChats = chats.slice(0, 5);

  const handleChatClick = (chatId: string) => {
    setSearchParams({ tab: 'chats', chat: chatId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Chats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Chats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentChats.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chats yet</p>
        ) : (
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{chat.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
        
        {chats.length > 5 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setSearchParams({ tab: 'chats' })}
          >
            View All Chats
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
