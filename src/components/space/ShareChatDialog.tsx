import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSpaceManagement } from '@/hooks/useSpaceManagement';
import { useSpaceCollaboration } from '@/hooks/useSpaceCollaboration';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface ShareChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  spaceId: string;
  currentSharedWith?: string[];
  onSuccess?: () => void;
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  spaceId,
  currentSharedWith = [],
  onSuccess,
}: ShareChatDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(currentSharedWith);
  const { fetchMembers } = useSpaceManagement(spaceId);
  const { shareChat, unshareChat } = useSpaceCollaboration(spaceId);
  const [loading, setLoading] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ['space-members', spaceId],
    queryFn: fetchMembers,
    enabled: open,
  });

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    if (open) {
      fetchUser();
    }
  }, [open]);

  const availableMembers = members.filter(m => m.user_id !== currentUser?.id);

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      if (selectedMembers.length === 0) {
        await unshareChat(chatId);
      } else {
        await shareChat(chatId, selectedMembers);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Chat</DialogTitle>
          <DialogDescription>
            Select team members to share this chat with
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {availableMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other members in space
            </p>
          ) : (
            availableMembers.map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                <Checkbox
                  id={member.id}
                  checked={selectedMembers.includes(member.user_id)}
                  onCheckedChange={() => handleToggleMember(member.user_id)}
                />
                <Label
                  htmlFor={member.id}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <Avatar>
                    <AvatarImage src={member.profiles?.avatar_url} />
                    <AvatarFallback>
                      {member.profiles?.first_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {[member.profiles?.first_name, member.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown'}
                    </p>
                  </div>
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading}>
            {loading ? 'Sharing...' : selectedMembers.length === 0 ? 'Unshare' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
