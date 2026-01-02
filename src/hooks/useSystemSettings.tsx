import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { cosmo2 } from '@/cosmo2/client';
import type {
  ResponseFormattingRules,
  PreMessageConfig,
  CosmoRoutingConfig
} from '@/cosmo/contracts';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Stub data for legacy settings not yet in V2
const MOCK_SETTINGS: SystemSetting[] = [
  { id: '1', setting_key: 'app_store_enabled', setting_value: true, description: null, created_at: '', updated_at: '' },
  { id: '2', setting_key: 'ai_instructions', setting_value: { enabled: true, instructions: '' }, description: null, created_at: '', updated_at: '' },
  { id: '3', setting_key: 'pre_message_config', setting_value: { enabled: false }, description: null, created_at: '', updated_at: '' },
  { id: '4', setting_key: 'response_formatting_rules', setting_value: { enabled: false, rules: '' }, description: null, created_at: '', updated_at: '' },
  { id: '5', setting_key: 'cosmo_config', setting_value: { enabled: true }, description: null, created_at: '', updated_at: '' },
];

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch settings from V2 (where applicable) and merge with mocks
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch Routing Config from V2
      const routingConfig = await cosmo2.getRoutingConfig();

      // Adapt V2 routing config to legacy setting structure
      const routingSetting: SystemSetting = {
        id: 'v2-routing',
        setting_key: 'cosmo_routing_config',
        setting_value: routingConfig,
        description: 'Managed by COSMO V2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSettings([...MOCK_SETTINGS, routingSetting]);
    } catch (error: any) {
      console.warn('Failed to fetch settings from V2, employing fallback mode', error);
      setSettings(MOCK_SETTINGS); // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSetting = useCallback((key: string): SystemSetting | undefined => {
    // Return latest local state or mock
    return settings.find(s => s.setting_key === key);
  }, [settings]);

  // Accessors
  const getDefaultModel = () => null; // Deprecated/Moved to Routing
  const getFallbackModel = () => null; // Deprecated
  const getAIInstructions = () => getSetting('ai_instructions')?.setting_value;
  const getPreMessageConfig = () => getSetting('pre_message_config')?.setting_value;
  const getAppStoreEnabled = () => getSetting('app_store_enabled')?.setting_value ?? true;
  const getCosmoRoutingConfig = () => getSetting('cosmo_routing_config')?.setting_value;
  const getResponseFormattingRules = () => getSetting('response_formatting_rules')?.setting_value;

  const updateSetting = async (key: string, value: any) => {
    try {
      if (key === 'cosmo_routing_config') {
        await cosmo2.updateRoutingConfig(value);
        toast.success('Routing configuration updated (V2)');
      } else {
        // Update local state for non-V2 settings (mock persistence)
        setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
        toast.info('Setting saved to session (V2 persistence pending)');
      }
      await fetchSettings();
    } catch (error: any) {
      toast.error('Failed to update setting', { description: error.message });
    }
  };

  return {
    settings,
    isLoading,
    fetchSettings,
    getSetting,
    getDefaultModel,
    getFallbackModel,
    getAIInstructions,
    getPreMessageConfig,
    getAppStoreEnabled,
    getCosmoRoutingConfig,
    getResponseFormattingRules,
    updateSetting,
  };
};
