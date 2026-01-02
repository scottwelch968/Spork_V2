import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface UserSettings {
  id: string;
  user_id: string;
  auto_chat_title: boolean;
  slack_message_style: boolean;
  send_current_date: boolean;
  send_ai_model_name: boolean;
  send_user_name: boolean;
  remember_chat_settings: boolean;
  message_voice: string | null;
  personal_context: string | null;
}

export function useUserSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndSettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('settings-operations', {
        body: { action: 'get_profile_and_settings' },
      });

      if (error) throw error;

      setProfile(data.profile);
      setSettings(data.settings);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfileAndSettings();
    }
  }, [user, fetchProfileAndSettings]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('settings-operations', {
        body: { action: 'update_profile', updates },
      });

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;

    try {
      const { error } = await supabase.functions.invoke('settings-operations', {
        body: { action: 'update_settings', updates },
      });

      if (error) throw error;

      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success('Settings updated successfully');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) throw error;

      toast.success('Account deleted successfully');
      
      // Sign out
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      throw error;
    }
  };

  return {
    profile,
    settings,
    loading,
    updateProfile,
    updateSettings,
    updatePassword,
    deleteAccount,
    refetch: fetchProfileAndSettings,
  };
}
