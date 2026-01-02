import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OnlineMember {
  user_id: string;
  online_at: string;
}

export function useSpaceCollaboration(spaceId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);

  useEffect(() => {
    if (!spaceId || !user) return;

    const channel = supabase.channel(`space:${spaceId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const members = Object.values(state).flat().map((p: any) => ({
          user_id: p.user_id,
          online_at: p.online_at,
        }));
        setOnlineMembers(members);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [spaceId, user]);

  const shareChat = async (chatId: string, memberIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'share_chat', chatId, memberIds },
      });

      if (error) throw error;

      toast({
        title: 'Chat shared',
        description: 'Chat has been shared with selected members',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to share chat',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const unshareChat = async (chatId: string) => {
    try {
      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'unshare_chat', chatId },
      });

      if (error) throw error;

      toast({
        title: 'Chat unshared',
        description: 'Chat is no longer shared',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to unshare chat',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getSharedChats = async () => {
    if (!user) return [];

    const { data, error } = await supabase.functions.invoke('space-management', {
      body: { action: 'get_shared_chats' },
    });

    if (error) throw error;
    return data.data;
  };

  return {
    onlineMembers,
    shareChat,
    unshareChat,
    getSharedChats,
  };
}
