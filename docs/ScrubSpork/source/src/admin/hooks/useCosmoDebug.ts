import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  DebugEntry, 
  DebugContextSources, 
  DebugModelConfig, 
  DebugTierAttempt, 
  DebugFilters 
} from '@/presentation/types';
import { toast } from 'sonner';

export function useCosmoDebug() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState<DebugFilters>({
    searchTerm: '',
    startDate: null,
    endDate: null,
    sessionType: 'all',
    operationType: 'all',
  });

  // Fetch debug logs from database with user and workspace names
  const { data: logs = [], isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['cosmo-debug-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cosmo_debug_logs')
        .select(`
          *,
          profiles!cosmo_debug_logs_user_id_fkey (
            first_name,
            last_name,
            email
          ),
          workspaces!fk_cosmo_debug_logs_workspace (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Transform database rows to typed entries with joined data
      return (data || []).map(row => {
        const profile = row.profiles as { first_name?: string; last_name?: string; email?: string } | null;
        const workspace = row.workspaces as { name?: string } | null;
        
        const userName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || null
          : null;
        
        return {
          ...row,
          operation_type: (row.operation_type as 'chat' | 'enhance_prompt') || 'chat',
          user_name: userName,
          user_email: profile?.email || null,
          workspace_name: workspace?.name || null,
          is_workspace_chat: !!row.workspace_id,
          context_sources: (row.context_sources as unknown as DebugContextSources) || {} as DebugContextSources,
          model_config: (row.model_config as unknown as DebugModelConfig) || {} as DebugModelConfig,
          tiers_attempted: (row.tiers_attempted as unknown as DebugTierAttempt[]) || [],
          api_request_body: row.api_request_body as DebugEntry['api_request_body'],
          api_response_headers: row.api_response_headers as DebugEntry['api_response_headers'],
          openrouter_request_id: row.openrouter_request_id,
          // Cosmo routing fields - extract from intent_patterns or set to null
          cosmo_routing_model: null,
          cost_tier: row.intent_patterns?.find((p: string) => p?.includes('cost_tier:'))?.split(':')[1] as 'low' | 'balanced' | 'premium' | null || null,
          cosmo_reasoning: null,
          models_considered: null,
        };
      }) as DebugEntry[];
    },
  });

  // Filter logs based on criteria
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesUser = 
          log.user_id?.toLowerCase().includes(term) ||
          log.user_name?.toLowerCase().includes(term) ||
          log.user_email?.toLowerCase().includes(term);
        const matchesWorkspace = 
          log.workspace_id?.toLowerCase().includes(term) ||
          log.workspace_name?.toLowerCase().includes(term);
        const matchesModel = 
          log.selected_model?.toLowerCase().includes(term) ||
          log.requested_model?.toLowerCase().includes(term);
        
        if (!matchesUser && !matchesWorkspace && !matchesModel) return false;
      }
      
      // Date range filter
      const logDate = new Date(log.created_at);
      if (filters.startDate) {
        const startOfDay = new Date(filters.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (logDate < startOfDay) return false;
      }
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
      
      // Session type filter
      if (filters.sessionType === 'personal' && log.is_workspace_chat) return false;
      if (filters.sessionType === 'workspace' && !log.is_workspace_chat) return false;
      
      // Operation type filter
      if (filters.operationType !== 'all' && log.operation_type !== filters.operationType) return false;
      
      return true;
    });
  }, [logs, filters]);

  // Fetch debug enabled setting
  const { data: isLoggingEnabled = false, isLoading: settingLoading } = useQuery({
    queryKey: ['cosmo-debug-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'cosmo_debug_enabled')
        .single();
      
      if (error) return false;
      const value = data?.setting_value as { enabled?: boolean } | null;
      return value?.enabled ?? false;
    },
  });

  // Helper to call admin-data edge function
  const callAdminData = async (action: string, params: Record<string, unknown> = {}) => {
    const sessionToken = localStorage.getItem('spork_admin_session');
    if (!sessionToken) {
      throw new Error('No admin session');
    }

    const { data, error } = await supabase.functions.invoke('admin-data', {
      body: { action, session_token: sessionToken, ...params }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // Toggle logging mutation - routes through admin-data
  const toggleLoggingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await callAdminData('cosmo_debug_toggle_logging', { enabled });
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-debug-enabled'] });
      toast.success(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
    },
    onError: () => {
      toast.error('Failed to toggle debug logging');
    },
  });

  // Clear logs mutation - routes through admin-data
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      await callAdminData('cosmo_debug_clear_logs');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosmo-debug-logs'] });
      setCurrentIndex(0);
      toast.success('Debug logs cleared');
    },
    onError: () => {
      toast.error('Failed to clear debug logs');
    },
  });

  // Export to text file with optional date range
  const exportToText = (exportStartDate?: Date | null, exportEndDate?: Date | null) => {
    // Filter logs by date range for export
    const logsToExport = logs.filter(log => {
      const logDate = new Date(log.created_at);
      if (exportStartDate) {
        const startOfDay = new Date(exportStartDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (logDate < startOfDay) return false;
      }
      if (exportEndDate) {
        const endOfDay = new Date(exportEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
      return true;
    });

    if (!logsToExport.length) {
      toast.error('No logs in selected date range');
      return;
    }

    const textContent = logsToExport.map((log, i) => `
${'='.repeat(80)}
COSMO DEBUG LOG #${i + 1}
${'='.repeat(80)}

--- SESSION INFO ---
Operation: ${log.operation_type === 'enhance_prompt' ? 'Enhance Prompt' : 'Chat'}
Session Type: ${log.is_workspace_chat ? 'Workspace Chat' : 'Personal Chat'}
Timestamp: ${new Date(log.created_at).toLocaleString()}
Log ID: ${log.id}

User: ${log.user_name || 'Unknown'}
User ID: ${log.user_id || 'N/A'}
Email: ${log.user_email || 'N/A'}
${log.is_workspace_chat ? `
Workspace: ${log.workspace_name || 'Unknown'}
Workspace ID: ${log.workspace_id}` : ''}
Chat ID: ${log.chat_id || 'N/A'}

--- ORIGINAL MESSAGE ---
${log.original_message}

--- COSMO DECISION ---
Detected Intent: ${log.detected_intent || 'None'}
Patterns Matched: ${log.intent_patterns?.join(', ') || 'None'}
Auto-Select Enabled: ${log.auto_select_enabled ? 'Yes' : 'No'}
Requested Model: ${log.requested_model || 'N/A'}
Selected Model: ${log.selected_model || 'N/A'}
Model Provider: ${log.model_provider || 'N/A'}

--- CONTEXT SOURCES ---
AI Instructions: ${log.context_sources?.ai_instructions ? 'Yes' : 'No'}
Space AI Instructions: ${log.context_sources?.space_ai_instructions ? 'Yes' : 'No'}
Compliance Rule: ${log.context_sources?.compliance_rule ? 'Yes' : 'No'}
Persona: ${log.context_sources?.persona ? 'Yes' : 'No'}
Personal Context: ${log.context_sources?.personal_context ? 'Yes' : 'No'}
Knowledge Base: ${log.context_sources?.knowledge_base ? 'Yes' : 'No'}
History: ${log.context_sources?.history ? `Yes (${log.context_sources?.history_count || 0} messages)` : 'No'}

--- MODEL PARAMETERS ---
Temperature: ${log.model_config?.temperature ?? 'N/A'}
Top-P: ${log.model_config?.top_p ?? 'N/A'}
Max Tokens: ${log.model_config?.max_tokens ?? 'N/A'}
Frequency Penalty: ${log.model_config?.frequency_penalty ?? 'N/A'}
Presence Penalty: ${log.model_config?.presence_penalty ?? 'N/A'}

--- FULL SYSTEM PROMPT ---
${log.full_system_prompt || 'N/A'}

--- API REQUEST/RESPONSE ---
OpenRouter Request ID: ${log.openrouter_request_id || 'N/A'}
${log.api_request_body ? `
Request Body:
${JSON.stringify(log.api_request_body, null, 2)}` : 'Request Body: N/A'}
${log.api_response_headers ? `
Response Headers:
${Object.entries(log.api_response_headers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}` : ''}

--- FALLBACK CHAIN ---
${log.tiers_attempted?.map(t => 
  `TIER ${t.tier} (${t.tier_name}): ${t.model} (${t.provider}) - ${t.success ? 'SUCCESS' : `FAILED (${t.error || t.status_code})`}`
).join('\n') || 'No tier data'}
Fallback Used: ${log.fallback_used ? 'Yes' : 'No'}

--- RESPONSE METRICS ---
Response Time: ${log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
Prompt Tokens: ${log.prompt_tokens ?? 'N/A'}
Completion Tokens: ${log.completion_tokens ?? 'N/A'}
Total Tokens: ${log.total_tokens ?? 'N/A'}
Estimated Cost: ${log.cost ? `$${Number(log.cost).toFixed(6)}` : 'N/A'}

--- STATUS ---
Success: ${log.success ? 'Yes' : 'No'}
Error: ${log.error_message || 'None'}

`).join('\n');

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmo-debug-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${logsToExport.length} logs to text file`);
  };

  // Get count of logs in date range for export preview
  const getLogsCountInRange = (startDate?: Date | null, endDate?: Date | null): number => {
    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (logDate < startOfDay) return false;
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }
      return true;
    }).length;
  };

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const goToNext = () => {
    setCurrentIndex(i => Math.min((filteredLogs?.length || 1) - 1, i + 1));
  };

  const goToIndex = (index: number) => {
    if (index >= 0 && index < (filteredLogs?.length || 0)) {
      setCurrentIndex(index);
    }
  };

  // Filter helpers
  const updateFilter = <K extends keyof DebugFilters>(key: K, value: DebugFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentIndex(0); // Reset to first item when filters change
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      startDate: null,
      endDate: null,
      sessionType: 'all',
      operationType: 'all',
    });
    setCurrentIndex(0);
  };

  return {
    logs: filteredLogs,
    allLogs: logs,
    currentLog: filteredLogs[currentIndex] || null,
    currentIndex,
    totalLogs: filteredLogs.length,
    totalAllLogs: logs.length,
    goToPrevious,
    goToNext,
    goToIndex,
    isLoggingEnabled,
    toggleLogging: (enabled: boolean) => toggleLoggingMutation.mutate(enabled),
    isTogglingLogging: toggleLoggingMutation.isPending,
    clearLogs: () => clearLogsMutation.mutate(),
    isClearingLogs: clearLogsMutation.isPending,
    exportToText,
    getLogsCountInRange,
    refetch,
    isLoading: logsLoading || settingLoading,
    filters,
    updateFilter,
    clearFilters,
  };
}
