import { useUserSettings } from '@/hooks/useUserSettings';
import { AccountInfoSection } from './AccountInfoSection';
import { ChatPreferencesSection } from './ChatPreferencesSection';
export function GeneralSettings() {
  const {
    profile,
    settings,
    loading,
    updateProfile,
    updateSettings
  } = useUserSettings();
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>;
  }
  if (!profile || !settings) {
    return <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load settings</p>
      </div>;
  }
  return <div className="space-y-8">
      <div>
        
        
      </div>

      <AccountInfoSection profile={profile} onUpdateProfile={updateProfile} />

      <div>
        <h2 className="text-xl font-semibold font-roboto-slab mb-2">Chat Preferences</h2>
        <p className="text-muted-foreground">
          Customize how your chat interactions work
        </p>
      </div>

      <ChatPreferencesSection settings={settings} onUpdateSettings={updateSettings} />
    </div>;
}