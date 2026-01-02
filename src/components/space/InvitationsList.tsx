import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSpaceManagement } from '@/hooks/useSpaceManagement';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InvitationsListProps {
  spaceId: string;
}

export function InvitationsList({ spaceId }: InvitationsListProps) {
  const { fetchInvitations, cancelInvitation } = useSpaceManagement(spaceId);
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['space-invitations', spaceId],
    queryFn: fetchInvitations,
  });

  const handleCancel = async (invitationId: string) => {
    await cancelInvitation(invitationId);
    queryClient.invalidateQueries({ queryKey: ['space-invitations', spaceId] });
  };

  if (isLoading) {
    return <div>Loading invitations...</div>;
  }

  if (invitations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No pending invitations</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold font-roboto-slab">Pending Invitations</h2>
        <p className="text-muted-foreground">{invitations.length} pending</p>
      </div>

      <div className="grid gap-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{invitation.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invitation.role}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCancel(invitation.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
