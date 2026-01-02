import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Label } from '@/admin/ui/label';
import { Switch } from '@/admin/ui/switch';
import { Separator } from '@/admin/ui/separator';
import { toast } from 'sonner';
import { Save, Shield, Loader2 } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function SecurityConfigTab() {
  const { settings, isLoading: settingsLoading, updateSetting, getSetting } = useSystemSettings();
  const [config, setConfig] = useState({
    requireEmailVerification: false,
    enableAnalytics: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settingsLoading && settings.length > 0) {
      const emailVerificationSetting = getSetting('require_email_verification');
      const analyticsSetting = getSetting('enable_analytics');
      
      setConfig({
        requireEmailVerification: emailVerificationSetting?.setting_value === true,
        enableAnalytics: analyticsSetting?.setting_value !== false,
      });
    }
  }, [settingsLoading, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSetting('require_email_verification', config.requireEmailVerification),
        updateSetting('enable_analytics', config.enableAnalytics),
      ]);
      toast.success('Security settings saved');
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>Configure security and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-admin-text-muted">
                Users must verify their email before using the platform
              </p>
            </div>
            <Switch
              checked={config.requireEmailVerification}
              onCheckedChange={(checked) =>
                setConfig({ ...config, requireEmailVerification: checked })
              }
              disabled={settingsLoading}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Analytics</Label>
              <p className="text-sm text-admin-text-muted">
                Track usage statistics and system analytics
              </p>
            </div>
            <Switch
              checked={config.enableAnalytics}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enableAnalytics: checked })
              }
              disabled={settingsLoading}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || settingsLoading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
