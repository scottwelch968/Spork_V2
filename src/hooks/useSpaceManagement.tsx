import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logActivity } from '@/utils/logActivity';

export type SpaceRole = 'owner' | 'member';

export interface SpaceMember {
  id: string;
  user_id: string;
  workspace_id: string;
  role: SpaceRole;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url?: string;
  };
}

export interface SpaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: SpaceRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface SpaceActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export function useSpaceManagement(spaceId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const inviteMember = async (email: string, role: SpaceRole = 'member') => {
    if (!spaceId || !user) throw new Error('No space selected');
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-workspace-invitation', {
        body: { email, role, workspace_id: spaceId },
      });

      if (error) throw error;

      await logActivity({
        appSection: 'workspace',
        actorId: user.id,
        action: 'invited',
        resourceType: 'member',
        resourceName: email,
        workspaceId: spaceId,
        details: { invited_email: email, role }
      });

      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${email}`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (): Promise<SpaceMember[]> => {
    if (!spaceId) return [];

    const { data, error } = await supabase.functions.invoke('space-management', {
      body: { action: 'get_members', spaceId },
    });

    if (error) throw error;
    return data.data as SpaceMember[];
  };

  const updateMemberRole = async (memberId: string, newRole: SpaceRole, memberEmail?: string) => {
    if (!spaceId || !user) throw new Error('No space selected');
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'update_member_role', memberId, role: newRole },
      });

      if (error) throw error;

      await logActivity({
        appSection: 'workspace',
        actorId: user.id,
        action: 'updated',
        resourceType: 'member',
        resourceName: memberEmail,
        workspaceId: spaceId,
        details: { member_id: memberId, new_role: newRole }
      });

      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string, memberEmail?: string) => {
    if (!spaceId || !user) throw new Error('No space selected');
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'remove_member', memberId },
      });

      if (error) throw error;

      await logActivity({
        appSection: 'workspace',
        actorId: user.id,
        action: 'removed',
        resourceType: 'member',
        resourceName: memberEmail,
        workspaceId: spaceId,
        details: { member_id: memberId }
      });

      toast({
        title: 'Member removed',
        description: 'Member has been removed from the space',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove member',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const leaveSpace = async () => {
    if (!spaceId || !user) throw new Error('Invalid operation');

    setLoading(true);
    try {
      await logActivity({
        appSection: 'workspace',
        actorId: user.id,
        action: 'left',
        resourceType: 'member',
        workspaceId: spaceId,
        details: { user_email: user.email }
      });

      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'leave_space', spaceId },
      });

      if (error) throw error;

      toast({
        title: 'Left space',
        description: 'You have left the space',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to leave space',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!spaceId) return [];

    const { data, error } = await supabase.functions.invoke('space-management', {
      body: { action: 'get_invitations', spaceId },
    });

    if (error) throw error;
    return data.data as SpaceInvitation[];
  };

  const cancelInvitation = async (invitationId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('space-management', {
        body: { action: 'cancel_invitation', invitationId },
      });

      if (error) throw error;

      toast({
        title: 'Invitation cancelled',
        description: 'The invitation has been cancelled',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to cancel invitation',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-workspace-invitation', {
        body: { invitation_token: token },
      });

      if (error) throw error;

      toast({
        title: 'Invitation accepted',
        description: 'You have joined the space',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Failed to accept invitation',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async (limit: number = 50) => {
    if (!spaceId) return [];

    const { data, error } = await supabase.functions.invoke('space-management', {
      body: { action: 'get_activity', spaceId, limit },
    });

    if (error) throw error;
    return data.data as SpaceActivity[];
  };

  return {
    loading,
    inviteMember,
    fetchMembers,
    updateMemberRole,
    removeMember,
    leaveSpace,
    fetchInvitations,
    cancelInvitation,
    acceptInvitation,
    fetchActivity,
  };
}
