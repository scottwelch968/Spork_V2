import { supabase } from '@/integrations/supabase/client';

// App sections - WHERE the activity occurred
export type AppSection = 
  | 'main_chat' 
  | 'workspace' 
  | 'ai_tools' 
  | 'files' 
  | 'personas' 
  | 'prompts' 
  | 'app_store' 
  | 'settings' 
  | 'admin';

// Actor types - WHO performed the action
export type ActorType = 'user' | 'ai_agent' | 'system';

// Actions (verbs) - WHAT was done
export type ActivityAction = 
  | 'created' | 'updated' | 'deleted' | 'archived' | 'unarchived'
  | 'sent' | 'generated' | 'installed' | 'uninstalled' | 'used'
  | 'invited' | 'joined' | 'removed' | 'left'
  | 'uploaded' | 'downloaded' | 'moved' | 'renamed';

// Resource types (nouns) - ON WHAT resource
export type ResourceType = 
  | 'chat' | 'message' | 'image' | 'video' 
  | 'file' | 'folder' | 'task' 
  | 'persona' | 'prompt' | 'tool'
  | 'member' | 'space' | 'settings';

interface LogActivityParams {
  appSection: AppSection;
  actorType?: ActorType;
  actorId?: string;
  action: ActivityAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  workspaceId?: string;
  details?: Record<string, any>;
}

/**
 * Activity-centric logging function.
 * Logs activities to the activity_log table with proper context.
 */
export const logActivity = async (params: LogActivityParams) => {
  try {
    await supabase.from('activity_log').insert({
      app_section: params.appSection,
      actor_type: params.actorType || 'user',
      actor_id: params.actorId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      resource_name: params.resourceName,
      workspace_id: params.workspaceId,
      details: params.details || {}
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// =============================================================================
// LEGACY FUNCTION - REMOVED in Phase 8 cleanup
// Migration complete: All code now uses logActivity() with activity_log table
// =============================================================================
