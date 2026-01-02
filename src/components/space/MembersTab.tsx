import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSpaceManagement } from '@/hooks/useSpaceManagement';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useToast } from '@/hooks/use-toast';

interface MembersTabProps {
  spaceId: string;
}

export const MembersTab: React.FC<MembersTabProps> = ({ spaceId }) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; email?: string } | null>(null);
  const [invitationToCancel, setInvitationToCancel] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { fetchMembers, fetchInvitations, removeMember, cancelInvitation, loading } = useSpaceManagement(spaceId);

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['space-members', spaceId],
    queryFn: fetchMembers,
    enabled: !!spaceId,
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['space-invitations', spaceId],
    queryFn: fetchInvitations,
    enabled: !!spaceId,
  });

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember(memberToRemove.id, memberToRemove.email);
      queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
      toast({ title: 'Member removed successfully' });
    } catch (error) {
      toast({ title: 'Failed to remove member', variant: 'destructive' });
    }
    setMemberToRemove(null);
  };

  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;
    try {
      await cancelInvitation(invitationToCancel);
      queryClient.invalidateQueries({ queryKey: ['space-invitations', spaceId] });
      toast({ title: 'Invitation cancelled' });
    } catch (error) {
      toast({ title: 'Failed to cancel invitation', variant: 'destructive' });
    }
    setInvitationToCancel(null);
  };

  const getInitials = (name?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return '?';
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="members">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="bg-transparent p-0 h-auto rounded-none gap-2">
            <TabsTrigger
              value="members"
              className="rounded-md border border-border bg-transparent data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:shadow-none px-4 py-2"
            >
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger
              value="invitations"
              className="rounded-md border border-border bg-transparent data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:shadow-none px-4 py-2"
            >
              Invitations ({invitations.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setInviteDialogOpen(true)} size="sm" className="rounded-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <TabsContent value="members" className="mt-0">
          {membersLoading ? (
            <div className="text-muted-foreground text-sm py-8 text-center">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-muted-foreground text-sm py-8 text-center">No members found</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials([member.profiles?.first_name, member.profiles?.last_name].filter(Boolean).join(' '))}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {[member.profiles?.first_name, member.profiles?.last_name].filter(Boolean).join(' ') || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role === 'owner' ? 'Owner' : 'Team Member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setMemberToRemove({ id: member.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="mt-0">
          {invitationsLoading ? (
            <div className="text-muted-foreground text-sm py-8 text-center">Loading invitations...</div>
          ) : invitations.length === 0 ? (
            <div className="text-muted-foreground text-sm py-8 text-center">No pending invitations</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Team Member</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setInvitationToCancel(invitation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        spaceId={spaceId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['space-invitations', spaceId] });
        }}
      />

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from the workspace. They will lose access to all workspace content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!invitationToCancel} onOpenChange={() => setInvitationToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the pending invitation. The invited user will no longer be able to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
