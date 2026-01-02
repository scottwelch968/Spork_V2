// Workspace Activity Formatting Utilities
// Provides unified format: "Workspace: [Name] | [Tab Name]" for title
// and "Activity: [Action Label] • By: [User Name] • [Item Name]" for description

type ActivityAction = string;

interface ActivityDetails {
  name?: string;
  title?: string;
  chat_title?: string;
  task_title?: string;
  file_name?: string;
  folder_name?: string;
  persona_name?: string;
  prompt_title?: string;
  member_email?: string;
  member_name?: string;
  model_name?: string;
  new_status?: string;
  [key: string]: any;
}

// Map activity actions to their corresponding tab names
export const getTabNameFromAction = (action: ActivityAction): string => {
  const tabMapping: Record<string, string> = {
    // Overview
    created_space: 'Overview',
    settings_updated: 'Overview',
    space_archived: 'Overview',
    space_unarchived: 'Overview',
    
    // Chats
    started_chat: 'Chats',
    chat_updated: 'Chats',
    chat_deleted: 'Chats',
    
    // Files
    uploaded_file: 'Files',
    file_deleted: 'Files',
    file_moved: 'Files',
    file_renamed: 'Files',
    folder_created: 'Files',
    folder_deleted: 'Files',
    folder_renamed: 'Files',
    
    // Tasks
    task_created: 'Tasks',
    task_updated: 'Tasks',
    task_deleted: 'Tasks',
    task_status_changed: 'Tasks',
    task_assigned: 'Tasks',
    
    // Members
    member_invited: 'Members',
    member_joined: 'Members',
    member_removed: 'Members',
    member_left: 'Members',
    member_role_changed: 'Members',
    
    // Personas
    created_persona: 'Personas',
    persona_updated: 'Personas',
    persona_deleted: 'Personas',
    default_persona_changed: 'Personas',
    
    // Prompts
    created_prompt: 'Prompts',
    prompt_updated: 'Prompts',
    prompt_deleted: 'Prompts',
    
    // Settings / AI Config
    ai_model_changed: 'Settings',
    ai_instructions_updated: 'Settings',
    compliance_rule_updated: 'Settings',
  };
  
  return tabMapping[action] || 'Overview';
};

// Format action into a nice readable label
export const getActionLabel = (action: ActivityAction): string => {
  const actionLabels: Record<string, string> = {
    // Overview
    created_space: 'Created Space',
    settings_updated: 'Updated Settings',
    space_archived: 'Archived Space',
    space_unarchived: 'Unarchived Space',
    
    // Chats
    started_chat: 'Started Chat',
    chat_updated: 'Updated Chat',
    chat_deleted: 'Deleted Chat',
    
    // Files
    uploaded_file: 'Uploaded File',
    file_deleted: 'Deleted File',
    file_moved: 'Moved File',
    file_renamed: 'Renamed File',
    folder_created: 'Created Folder',
    folder_deleted: 'Deleted Folder',
    folder_renamed: 'Renamed Folder',
    
    // Tasks
    task_created: 'Created Task',
    task_updated: 'Updated Task',
    task_deleted: 'Deleted Task',
    task_status_changed: 'Changed Task Status',
    task_assigned: 'Assigned Task',
    
    // Members
    member_invited: 'Invited Member',
    member_joined: 'Member Joined',
    member_removed: 'Removed Member',
    member_left: 'Member Left',
    member_role_changed: 'Changed Member Role',
    
    // Personas
    created_persona: 'Created Persona',
    persona_updated: 'Updated Persona',
    persona_deleted: 'Deleted Persona',
    default_persona_changed: 'Changed Default Persona',
    
    // Prompts
    created_prompt: 'Created Prompt',
    prompt_updated: 'Updated Prompt',
    prompt_deleted: 'Deleted Prompt',
    
    // Settings / AI Config
    ai_model_changed: 'Changed AI Model',
    ai_instructions_updated: 'Updated AI Instructions',
    compliance_rule_updated: 'Updated Compliance Rule',
  };
  
  return actionLabels[action] || action.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase());
};

// Extract item name from activity details based on action type
export const getItemName = (action: ActivityAction, details: ActivityDetails): string => {
  // Task activities
  if (action.startsWith('task_')) {
    return details.task_title || details.title || details.name || 'Task';
  }
  
  // Chat activities
  if (action.includes('chat')) {
    return details.chat_title || details.title || details.name || 'Chat';
  }
  
  // File activities
  if (action.includes('file')) {
    return details.file_name || details.name || 'File';
  }
  
  // Folder activities
  if (action.includes('folder')) {
    return details.folder_name || details.name || 'Folder';
  }
  
  // Member activities
  if (action.includes('member')) {
    return details.member_email || details.member_name || details.email || 'Member';
  }
  
  // Persona activities
  if (action.includes('persona')) {
    return details.persona_name || details.name || 'Persona';
  }
  
  // Prompt activities
  if (action.includes('prompt')) {
    return details.prompt_title || details.title || details.name || 'Prompt';
  }
  
  // AI/Settings activities - transform "auto" to "Cosmo Ai"
  if (action.includes('ai_') || action.includes('model') || action.includes('instructions')) {
    const modelName = details.model_name || details.name || 'AI Config';
    return modelName === 'auto' ? 'Cosmo Ai' : modelName;
  }
  
  // Space activities
  if (action.includes('space') || action === 'created_space') {
    return details.space_name || details.name || 'Space';
  }
  
  // Default - also transform "auto" to "Cosmo Ai" for any model references
  const result = details.name || details.title || 'Item';
  return result === 'auto' ? 'Cosmo Ai' : result;
};

// Get additional status info (e.g., for task status changes)
export const getStatusInfo = (action: ActivityAction, details: ActivityDetails): string => {
  if (action === 'task_status_changed' && details.new_status) {
    return ` → ${details.new_status.replace(/_/g, ' ')}`;
  }
  return '';
};

// Format user name from profile data
export const formatUserName = (profiles: { first_name?: string; last_name?: string; email?: string } | null): string => {
  if (!profiles) return 'Unknown';
  const fullName = [profiles.first_name, profiles.last_name].filter(Boolean).join(' ');
  return fullName || profiles.email || 'Unknown';
};

// Main function to format workspace activity
export const formatWorkspaceActivity = (
  action: ActivityAction,
  workspaceName: string,
  userName: string,
  details: ActivityDetails = {}
): { title: string; description: string } => {
  const tabName = getTabNameFromAction(action);
  const actionLabel = getActionLabel(action);
  const itemName = getItemName(action, details);
  const statusInfo = getStatusInfo(action, details);
  
  const title = `Spaces: ${workspaceName} | ${tabName}`;
  const description = `Activity: ${actionLabel}${statusInfo} • By: ${userName} • ${itemName}`;
  
  return { title, description };
};
