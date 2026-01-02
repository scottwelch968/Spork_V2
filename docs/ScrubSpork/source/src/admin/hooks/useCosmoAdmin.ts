import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSystemAuth } from '@/contexts/SystemAuthContext';
import type { Json } from '@/integrations/supabase/types';

const SESSION_KEY = 'system_session_token';

// Types for COSMO Intents
export interface CosmoIntent {
  id: string;
  intent_key: string;
  display_name: string;
  description: string | null;
  category: string;
  keywords: string[] | null;
  priority: number | null;
  required_functions: string[] | null;
  preferred_models: string[] | null;
  context_needs: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CosmoIntentInput {
  intent_key: string;
  display_name: string;
  description?: string | null;
  category?: string;
  keywords?: string[];
  priority?: number;
  required_functions?: string[];
  preferred_models?: string[];
  context_needs?: string[];
  is_active?: boolean;
}

// Types for Action Mappings
export interface CosmoActionMapping {
  id: string;
  intent_key: string;
  action_key: string;
  action_type: string;
  action_config: Json | null;
  parameter_patterns: Json | null;
  required_context: string[] | null;
  conditions: Json | null;
  priority: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CosmoActionMappingInput {
  intent_key: string;
  action_key: string;
  action_type: string;
  action_config?: Json;
  parameter_patterns?: Json;
  required_context?: string[];
  conditions?: Json;
  priority?: number;
  is_active?: boolean;
}

// Types for Function Chains
export interface CosmoFunctionChain {
  id: string;
  chain_key: string;
  display_name: string;
  description: string | null;
  trigger_intents: string[] | null;
  function_sequence: Json;
  fallback_chain_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CosmoFunctionChainInput {
  chain_key: string;
  display_name: string;
  description?: string | null;
  trigger_intents?: string[];
  function_sequence?: Json;
  fallback_chain_id?: string | null;
  is_active?: boolean;
}

// Types for Chat Functions (read-only reference)
export interface ChatFunction {
  id: string;
  function_key: string;
  name: string;
  description: string | null;
  category: string;
  is_enabled: boolean | null;
  is_core: boolean | null;
  tags: string[] | null;
}

// Stats types
export interface CosmoStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  topCategories: { category: string; count: number }[];
  recentDecisions: {
    id: string;
    created_at: string;
    detected_intent: string | null;
    selected_model: string | null;
    success: boolean | null;
    response_time_ms: number | null;
  }[];
}

// Helper to get session token
function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

// Helper to call admin-data edge function
async function callAdminData(sessionToken: string, action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('admin-data', {
    body: { action, session_token: sessionToken, ...params }
  });
  
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useCosmoAdmin() {
  const queryClient = useQueryClient();
  const { user } = useSystemAuth();

  // ===== INTENTS CRUD (via admin-data edge function) =====
  const { data: intents = [], isLoading: intentsLoading } = useQuery({
    queryKey: ['cosmo-intents'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return [];
      const result = await callAdminData(sessionToken, 'cosmo_get_intents');
      return (result.data || []) as CosmoIntent[];
    },
    enabled: !!user,
  });

  const createIntentMutation = useMutation({
    mutationFn: async (input: CosmoIntentInput) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_create_intent', { intent_data: input });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-intents'] });
      toast.success('Intent created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create intent', { description: error.message });
    },
  });

  const updateIntentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: CosmoIntentInput & { id: string }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_update_intent', { id, updates });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-intents'] });
      toast.success('Intent updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update intent', { description: error.message });
    },
  });

  const deleteIntentMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_delete_intent', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-intents'] });
      toast.success('Intent deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete intent', { description: error.message });
    },
  });

  const toggleIntentMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_toggle_intent', { id, is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-intents'] });
    },
  });

  // ===== FUNCTION CHAINS CRUD (via admin-data edge function) =====
  const { data: functionChains = [], isLoading: chainsLoading } = useQuery({
    queryKey: ['cosmo-function-chains'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return [];
      const result = await callAdminData(sessionToken, 'cosmo_get_chains');
      return (result.data || []) as CosmoFunctionChain[];
    },
    enabled: !!user,
  });

  const createChainMutation = useMutation({
    mutationFn: async (input: CosmoFunctionChainInput) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_create_chain', { chain_data: input });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-function-chains'] });
      toast.success('Function chain created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create function chain', { description: error.message });
    },
  });

  const updateChainMutation = useMutation({
    mutationFn: async ({ id, ...updates }: CosmoFunctionChainInput & { id: string }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_update_chain', { id, updates });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-function-chains'] });
      toast.success('Function chain updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update function chain', { description: error.message });
    },
  });

  const deleteChainMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_delete_chain', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-function-chains'] });
      toast.success('Function chain deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete function chain', { description: error.message });
    },
  });

  const toggleChainMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_toggle_chain', { id, is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-function-chains'] });
    },
  });

  // ===== ACTION MAPPINGS CRUD (via admin-data edge function) =====
  const { data: actionMappings = [], isLoading: actionMappingsLoading } = useQuery({
    queryKey: ['cosmo-action-mappings'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return [];
      const result = await callAdminData(sessionToken, 'cosmo_get_action_mappings');
      return (result.data || []) as CosmoActionMapping[];
    },
    enabled: !!user,
  });

  const createActionMappingMutation = useMutation({
    mutationFn: async (input: CosmoActionMappingInput) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_create_action_mapping', { mapping_data: input });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-action-mappings'] });
      toast.success('Action mapping created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create action mapping', { description: error.message });
    },
  });

  const updateActionMappingMutation = useMutation({
    mutationFn: async ({ id, ...updates }: CosmoActionMappingInput & { id: string }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      const result = await callAdminData(sessionToken, 'cosmo_update_action_mapping', { id, updates });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-action-mappings'] });
      toast.success('Action mapping updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update action mapping', { description: error.message });
    },
  });

  const deleteActionMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_delete_action_mapping', { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-action-mappings'] });
      toast.success('Action mapping deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete action mapping', { description: error.message });
    },
  });

  const toggleActionMappingMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const sessionToken = getSessionToken();
      if (!sessionToken) throw new Error('Admin session required');
      await callAdminData(sessionToken, 'cosmo_toggle_action_mapping', { id, is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-action-mappings'] });
    },
  });

  // ===== CHAT FUNCTIONS (read-only via admin-data) =====
  const { data: chatFunctions = [], isLoading: functionsLoading } = useQuery({
    queryKey: ['chat-functions-reference'],
    queryFn: async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return [];
      const result = await callAdminData(sessionToken, 'cosmo_get_chat_functions');
      return (result.data || []) as ChatFunction[];
    },
    enabled: !!user,
  });

  // ===== STATS (via admin-data) =====
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['cosmo-stats'],
    queryFn: async (): Promise<CosmoStats> => {
      const sessionToken = getSessionToken();
      if (!sessionToken) {
        return {
          totalRequests: 0,
          successRate: 0,
          avgResponseTime: 0,
          topCategories: [],
          recentDecisions: [],
        };
      }

      const result = await callAdminData(sessionToken, 'cosmo_get_debug_logs', { limit: 100, since_hours: 24 });
      const logs = result.data || [];

      const totalRequests = logs.length;
      const successCount = logs.filter((l: any) => l.success).length;
      const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
      
      const responseTimes = logs.filter((l: any) => l.response_time_ms).map((l: any) => l.response_time_ms);
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
        : 0;

      // Category distribution
      const categoryMap = new Map<string, number>();
      logs.forEach((log: any) => {
        const cat = log.detected_intent || 'unknown';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const topCategories = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalRequests,
        successRate,
        avgResponseTime,
        topCategories,
        recentDecisions: logs.slice(0, 10),
      };
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s
  });

  return {
    // Intents
    intents,
    intentsLoading,
    createIntent: createIntentMutation.mutate,
    updateIntent: updateIntentMutation.mutate,
    deleteIntent: deleteIntentMutation.mutate,
    toggleIntent: toggleIntentMutation.mutate,
    isCreatingIntent: createIntentMutation.isPending,
    isUpdatingIntent: updateIntentMutation.isPending,
    isDeletingIntent: deleteIntentMutation.isPending,

    // Function Chains
    functionChains,
    chainsLoading,
    createChain: createChainMutation.mutate,
    updateChain: updateChainMutation.mutate,
    deleteChain: deleteChainMutation.mutate,
    toggleChain: toggleChainMutation.mutate,
    isCreatingChain: createChainMutation.isPending,
    isUpdatingChain: updateChainMutation.isPending,
    isDeletingChain: deleteChainMutation.isPending,

    // Action Mappings
    actionMappings,
    actionMappingsLoading,
    createActionMapping: createActionMappingMutation.mutate,
    updateActionMapping: updateActionMappingMutation.mutate,
    deleteActionMapping: deleteActionMappingMutation.mutate,
    toggleActionMapping: toggleActionMappingMutation.mutate,
    isCreatingActionMapping: createActionMappingMutation.isPending,
    isUpdatingActionMapping: updateActionMappingMutation.isPending,
    isDeletingActionMapping: deleteActionMappingMutation.isPending,

    // Chat Functions
    chatFunctions,
    functionsLoading,

    // Stats
    stats,
    statsLoading,
    refetchStats,
  };
}
