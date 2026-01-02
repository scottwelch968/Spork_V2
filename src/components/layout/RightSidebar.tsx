import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Bot, Edit2, Trash2, ChevronLeft, MessageSquare, Boxes, History, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RightSidebarChatHistory } from './RightSidebarChatHistory';
import { usePrompts } from '@/hooks/usePrompts';
import { useSpacePrompts } from '@/hooks/useSpacePrompts';
import { usePersonalPersonas } from '@/hooks/usePersonalPersonas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PersonaDialog } from '@/components/settings/PersonaDialog';
import { SpacePersonaDialog } from '@/components/space/ai-config/SpacePersonaDialog';
import { PromptDialog } from '@/components/prompts/PromptDialog';
import { SpacePromptDialog } from '@/components/space/ai-config/SpacePromptDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/contexts/ChatContext';
import { useSpacePersonas } from '@/hooks/useSpacePersonas';
import { useSpace } from '@/hooks/useSpace';

interface Persona {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  icon: string | null;
  is_default: boolean;
}

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_default?: boolean;
  last_used_at?: string | null;
}

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isEnabled?: boolean;
}

export function RightSidebar({ isOpen, onClose, onToggle, isEnabled = true }: RightSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setPendingPrompt, selectedPersona, setSelectedPersona, currentWorkspaceId } = useChatContext();
  
  // Unified library view toggle state (above tabs)
  const [libraryView, setLibraryView] = useState<'personal' | 'workspace'>('personal');
  
  // Active tab state for conditional action button
  const [activeTab, setActiveTab] = useState<'history' | 'prompts' | 'personas'>('history');
  
  // Auto-select library view based on route context
  useEffect(() => {
    const isWorkspaceRoute = location.pathname.startsWith('/workspace/');
    
    if (isWorkspaceRoute && currentWorkspaceId) {
      setLibraryView('workspace');
    } else {
      setLibraryView('personal');
    }
  }, [location.pathname, currentWorkspaceId]);
  
  // Personal prompts
  const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt, trackUsage: trackPromptUsage } = usePrompts();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [recentlyUsedExpanded, setRecentlyUsedExpanded] = useState(true);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [promptDeleteDialogOpen, setPromptDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);
  
  // Workspace prompts via React Query hook
  const { 
    prompts: workspacePrompts, 
    isLoading: isLoadingWorkspacePrompts,
    createPrompt: createWorkspacePrompt,
    updatePrompt: updateWorkspacePrompt,
    deletePrompt: deleteWorkspacePrompt,
    trackUsage: trackSpacePromptUsage
  } = useSpacePrompts(currentWorkspaceId || '');
  
  // Workspace prompt dialog state
  const [workspacePromptDialogOpen, setWorkspacePromptDialogOpen] = useState(false);
  const [editingWorkspacePrompt, setEditingWorkspacePrompt] = useState<Prompt | null>(null);
  
  // Personal personas via React Query hook
  const { 
    personas, 
    isLoading: isLoadingPersonas, 
    deletePersona: deletePersonalPersona 
  } = usePersonalPersonas();
  
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);
  
  // Workspace personas via React Query hook
  const { 
    personas: workspacePersonas, 
    isLoading: isLoadingWorkspacePersonas,
    createPersona: createWorkspacePersona,
    updatePersona: updateWorkspacePersona,
    deletePersona: deleteWorkspacePersona 
  } = useSpacePersonas(currentWorkspaceId || '');
  
  // Workspace persona dialog state
  const [workspacePersonaDialogOpen, setWorkspacePersonaDialogOpen] = useState(false);
  const [editingWorkspacePersona, setEditingWorkspacePersona] = useState<Persona | null>(null);

  // Confirmation dialog state for adding personal items to workspace
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<'prompt' | 'persona'>('prompt');
  const [confirmDialogMode, setConfirmDialogMode] = useState<'add' | 'replace'>('add');
  const [pendingItem, setPendingItem] = useState<Prompt | Persona | null>(null);
  const [existingWorkspaceItemId, setExistingWorkspaceItemId] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Group prompts by category, separating uncategorized for flat display
  const { uncategorizedPrompts, categorizedGroups } = useMemo(() => {
    const sourcePrompts = libraryView === 'personal' ? prompts : workspacePrompts;
    
    const uncategorized: Prompt[] = [];
    const groups: Record<string, Prompt[]> = {};
    
    sourcePrompts.forEach(prompt => {
      if (!prompt.category) {
        uncategorized.push(prompt);
      } else {
        if (!groups[prompt.category]) groups[prompt.category] = [];
        groups[prompt.category].push(prompt);
      }
    });
    
    return {
      uncategorizedPrompts: uncategorized,
      categorizedGroups: Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    };
  }, [prompts, workspacePrompts, libraryView]);

  // Compute recently used prompts (top 5, sorted by last_used_at descending)
  const recentlyUsedPrompts = useMemo(() => {
    const sourcePrompts = libraryView === 'personal' ? prompts : workspacePrompts;
    return sourcePrompts
      .filter(p => p.last_used_at)
      .sort((a, b) => new Date(b.last_used_at!).getTime() - new Date(a.last_used_at!).getTime())
      .slice(0, 5);
  }, [prompts, workspacePrompts, libraryView]);

  // Get personas based on library view (no search filtering)
  const displayedPersonas = useMemo(() => {
    return libraryView === 'personal' ? personas : workspacePersonas;
  }, [personas, workspacePersonas, libraryView]);

  const handleCreatePersona = () => {
    if (libraryView === 'workspace' && currentWorkspaceId) {
      setEditingWorkspacePersona(null);
      setWorkspacePersonaDialogOpen(true);
    } else {
      setEditingPersona(null);
      setPersonaDialogOpen(true);
    }
  };

  const handleEditPersona = (persona: Persona) => {
    if (libraryView === 'workspace' && currentWorkspaceId) {
      setEditingWorkspacePersona(persona);
      setWorkspacePersonaDialogOpen(true);
    } else {
      setEditingPersona(persona);
      setPersonaDialogOpen(true);
    }
  };

  const handleDeleteClick = (personaId: string) => {
    setPersonaToDelete(personaId);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePersona = async () => {
    if (!personaToDelete) return;

    try {
      if (libraryView === 'workspace' && currentWorkspaceId) {
        deleteWorkspacePersona(personaToDelete);
      } else {
        deletePersonalPersona(personaToDelete);
      }

      toast({
        title: 'Success',
        description: 'Persona deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete persona',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPersonaToDelete(null);
    }
  };

  // Handler for saving workspace persona
  const handleSaveWorkspacePersona = (data: { name: string; description: string; system_prompt: string }) => {
    if (editingWorkspacePersona) {
      updateWorkspacePersona({ personaId: editingWorkspacePersona.id, updates: data });
    } else {
      createWorkspacePersona({ ...data, icon: null, is_default: false });
    }
    setWorkspacePersonaDialogOpen(false);
    setEditingWorkspacePersona(null);
  };

  // Context-aware prompt handlers
  const handleCreatePrompt = () => {
    if (libraryView === 'workspace' && currentWorkspaceId) {
      setEditingWorkspacePrompt(null);
      setWorkspacePromptDialogOpen(true);
    } else {
      setEditingPrompt(null);
      setIsPromptDialogOpen(true);
    }
  };

  const handleEditPrompt = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    if (libraryView === 'workspace' && currentWorkspaceId) {
      setEditingWorkspacePrompt(prompt);
      setWorkspacePromptDialogOpen(true);
    } else {
      setEditingPrompt(prompt);
      setIsPromptDialogOpen(true);
    }
  };

  const handlePromptDeleteClick = (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    setPromptToDelete(promptId);
    setPromptDeleteDialogOpen(true);
  };

  const confirmDeletePrompt = async () => {
    if (!promptToDelete) return;
    
    if (libraryView === 'workspace' && currentWorkspaceId) {
      deleteWorkspacePrompt(promptToDelete);
    } else {
      deletePrompt(promptToDelete);
    }
    
    setPromptDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  // Handler for saving workspace prompt
  const handleSaveWorkspacePrompt = (data: { title: string; content: string; category: string | null }) => {
    if (editingWorkspacePrompt) {
      updateWorkspacePrompt({ promptId: editingWorkspacePrompt.id, updates: data });
    } else {
      createWorkspacePrompt(data);
    }
    setWorkspacePromptDialogOpen(false);
    setEditingWorkspacePrompt(null);
  };

  // Context-aware new chat navigation
  const handleNewChat = () => {
    if (currentWorkspaceId) {
      navigate(`/workspace/${currentWorkspaceId}?tab=chats`);
    } else {
      navigate('/chat');
    }
  };

  // Navigate to appropriate chat
  const navigateToChat = () => {
    if (currentWorkspaceId && location.pathname.includes('/workspace/')) {
      const params = new URLSearchParams(location.search);
      params.set('tab', 'chats');
      navigate(`${location.pathname}?${params.toString()}`);
    } else if (location.pathname !== '/chat') {
      navigate('/chat');
    }
  };

  // Handle prompt click with confirmation for workspaces
  const handlePromptClick = async (prompt: Prompt) => {
    // Track usage in database for Recently Used feature
    if (libraryView === 'personal') {
      trackPromptUsage(prompt.id);
    } else if (currentWorkspaceId) {
      trackSpacePromptUsage(prompt.id);
    }
    
    // Always insert prompt into chat input
    setPendingPrompt(prompt.content);
    
    // If in workspace context and using personal prompt, show confirmation
    if (currentWorkspaceId && libraryView === 'personal') {
      try {
        const { data: existing } = await supabase
          .from('space_prompts')
          .select('id')
          .eq('space_id', currentWorkspaceId)
          .eq('title', prompt.title)
          .maybeSingle();
        
        setPendingItem(prompt);
        setConfirmDialogType('prompt');
        
        if (existing) {
          setExistingWorkspaceItemId(existing.id);
          setConfirmDialogMode('replace');
        } else {
          setExistingWorkspaceItemId(null);
          setConfirmDialogMode('add');
        }
        
        setConfirmDialogOpen(true);
        return;
      } catch (error) {
        console.error('Error checking prompt in workspace:', error);
      }
    }
    
    navigateToChat();
  };

  // Handle persona click with confirmation for workspaces
  const { updateSelectedPersona } = useSpace();
  
  const handlePersonaClick = async (persona: Persona) => {
    // Apply persona to current chat context
    setSelectedPersona(persona.id);
    
    // For workspace context with workspace persona, persist selection
    if (currentWorkspaceId && libraryView === 'workspace') {
      try {
        await updateSelectedPersona({ workspaceId: currentWorkspaceId, personaId: persona.id });
      } catch (error) {
        console.error('Failed to persist workspace persona selection:', error);
      }
      navigateToChat();
      return;
    }
    
    // If in workspace context and using personal persona, show confirmation
    if (currentWorkspaceId && libraryView === 'personal') {
      try {
        const { data: existing } = await supabase
          .from('space_personas')
          .select('id')
          .eq('space_id', currentWorkspaceId)
          .eq('name', persona.name)
          .maybeSingle();
        
        setPendingItem(persona);
        setConfirmDialogType('persona');
        
        if (existing) {
          setExistingWorkspaceItemId(existing.id);
          setConfirmDialogMode('replace');
        } else {
          setExistingWorkspaceItemId(null);
          setConfirmDialogMode('add');
        }
        
        setConfirmDialogOpen(true);
        return;
      } catch (error) {
        console.error('Error checking persona in workspace:', error);
      }
    }
    
    navigateToChat();
  };

  // Confirmation handlers for adding personal items to workspace
  const confirmAddToWorkspace = async () => {
    if (!pendingItem || !currentWorkspaceId) return;
    
    try {
      if (confirmDialogType === 'prompt') {
        const prompt = pendingItem as Prompt;
        await supabase.from('space_prompts').insert({
          space_id: currentWorkspaceId,
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
          created_by: user?.id,
        });
        toast({ 
          title: 'Prompt added to workspace',
          description: `"${prompt.title}" is now available to all team members`
        });
      } else {
        const persona = pendingItem as Persona;
        const { data: newPersona } = await supabase.from('space_personas').insert({
          space_id: currentWorkspaceId,
          name: persona.name,
          description: persona.description,
          system_prompt: persona.system_prompt,
          icon: persona.icon,
          is_default: false,
          created_by: user?.id,
        }).select('id').single();
        
        toast({ 
          title: 'Persona added to workspace',
          description: `"${persona.name}" is now available to all team members`
        });
        
        if (newPersona) {
          await updateSelectedPersona({ workspaceId: currentWorkspaceId, personaId: newPersona.id });
          localStorage.setItem('spork_pending_persona_name', persona.name);
        }
      }
    } catch (error) {
      console.error('Error adding to workspace:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add to workspace' });
    } finally {
      setConfirmDialogOpen(false);
      setPendingItem(null);
      navigateToChat();
    }
  };

  const confirmReplaceInWorkspace = async () => {
    if (!pendingItem || !currentWorkspaceId || !existingWorkspaceItemId) return;
    
    try {
      if (confirmDialogType === 'prompt') {
        const prompt = pendingItem as Prompt;
        await supabase.from('space_prompts')
          .update({ content: prompt.content, category: prompt.category })
          .eq('id', existingWorkspaceItemId);
        toast({ title: 'Prompt replaced', description: `"${prompt.title}" has been updated` });
      } else {
        const persona = pendingItem as Persona;
        await supabase.from('space_personas')
          .update({ description: persona.description, system_prompt: persona.system_prompt, icon: persona.icon })
          .eq('id', existingWorkspaceItemId);
        
        await updateSelectedPersona({ workspaceId: currentWorkspaceId, personaId: existingWorkspaceItemId });
        localStorage.setItem('spork_pending_persona_name', persona.name);
        toast({ title: 'Persona replaced', description: `"${persona.name}" has been updated` });
      }
    } catch (error) {
      console.error('Error replacing in workspace:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to replace in workspace' });
    } finally {
      setConfirmDialogOpen(false);
      setPendingItem(null);
      setExistingWorkspaceItemId(null);
      navigateToChat();
    }
  };

  const skipWorkspaceAdd = () => {
    setConfirmDialogOpen(false);
    setPendingItem(null);
    setExistingWorkspaceItemId(null);
    navigateToChat();
  };

  const currentPromptsLoading = libraryView === 'personal' ? isLoading : isLoadingWorkspacePrompts;
  const currentPersonasLoading = libraryView === 'personal' ? isLoadingPersonas : isLoadingWorkspacePersonas;

  // Don't render anything if sidebar is disabled and closed
  if (!isEnabled && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Tab Handle - Only visible when enabled */}
      {isEnabled && (
        <button
          onClick={onToggle}
          className={cn(
            "fixed z-50 top-[88px] flex items-center justify-center",
            "w-8 h-16 bg-muted border border-border border-r-0 rounded-l-md shadow-[-2px_0_8px_-2px_rgba(0,0,0,0.15)]",
            "hover:bg-accent transition-all duration-300 ease-in-out cursor-pointer",
            "lg:z-auto",
            isOpen ? "right-[350px]" : "right-0"
          )}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-[47px] h-[calc(100vh-47px)] bg-background z-50 transition-all duration-300 ease-in-out overflow-hidden border-l border-border",
          "lg:relative lg:z-auto",
          isOpen ? "translate-x-0 w-[350px]" : "translate-x-full lg:translate-x-0 lg:w-0 lg:border-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'prompts' | 'personas')} className="flex-1 flex flex-col">
            <div className="flex flex-col border-t">
              {/* Library Toggle - above tabs, only when in workspace */}
              {currentWorkspaceId && (
                <div className="px-3 pt-3">
                  <div className="relative flex flex-wrap p-1 list-none rounded-lg bg-slate-100">
                    <button
                      className={`z-30 flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-all ease-in-out rounded-md cursor-pointer ${
                        libraryView === 'personal' 
                          ? 'bg-white text-slate-700 shadow-sm' 
                          : 'text-slate-600 bg-transparent hover:text-slate-700'
                      }`}
                      onClick={() => setLibraryView('personal')}
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5 text-slate-500 -scale-x-100" />
                      My Library
                    </button>
                    <button
                      className={`z-30 flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-all ease-in-out rounded-md cursor-pointer ${
                        libraryView === 'workspace' 
                          ? 'bg-white text-slate-700 shadow-sm' 
                          : 'text-slate-600 bg-transparent hover:text-slate-700'
                      }`}
                      onClick={() => setLibraryView('workspace')}
                    >
                      <Boxes className="w-4 h-4 mr-1.5 text-slate-500" />
                      Workspace
                    </button>
                  </div>
                </div>
              )}
              
              {/* Tab List */}
              <div className="px-3 mt-3">
                <div className="relative flex flex-wrap p-1 list-none rounded-lg bg-slate-100">
                  <button
                    className={`z-30 flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-all ease-in-out rounded-md cursor-pointer ${
                      activeTab === 'history' 
                        ? 'bg-white text-slate-700 shadow-sm' 
                        : 'text-slate-600 bg-transparent hover:text-slate-700'
                    }`}
                    onClick={() => setActiveTab('history')}
                  >
                    <History className="w-4 h-4 mr-1.5 text-slate-500" />
                    History
                  </button>
                  <button
                    className={`z-30 flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-all ease-in-out rounded-md cursor-pointer ${
                      activeTab === 'prompts' 
                        ? 'bg-white text-slate-700 shadow-sm' 
                        : 'text-slate-600 bg-transparent hover:text-slate-700'
                    }`}
                    onClick={() => setActiveTab('prompts')}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5 text-slate-500" />
                    Prompts
                  </button>
                  <button
                    className={`z-30 flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium transition-all ease-in-out rounded-md cursor-pointer ${
                      activeTab === 'personas' 
                        ? 'bg-white text-slate-700 shadow-sm' 
                        : 'text-slate-600 bg-transparent hover:text-slate-700'
                    }`}
                    onClick={() => setActiveTab('personas')}
                  >
                    <Bot className="w-4 h-4 mr-1.5 text-slate-500" />
                    Personas
                  </button>
                </div>
              </div>
              
              {/* Divider */}
              <div className="px-3 my-3">
                <div className="border-t border-slate-200" />
              </div>
            </div>

            {/* Saved Prompts Panel */}
            <TabsContent value="prompts" className="flex-1 mt-0 relative">
              <div className="absolute inset-0 bottom-[56px] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                  {currentPromptsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading prompts...</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Recently Used prompts - collapsible section */}
                      {recentlyUsedPrompts.length > 0 && (
                        <div className="space-y-1 mb-3">
                          <Button
                            variant="ghost"
                            className="w-full justify-between hover:bg-accent px-2 py-1.5 h-auto"
                            onClick={() => setRecentlyUsedExpanded(!recentlyUsedExpanded)}
                          >
                            <span className="text-sm font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Recently Used ({recentlyUsedPrompts.length})
                            </span>
                            {recentlyUsedExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          {recentlyUsedExpanded && (
                            <div className="space-y-1 pl-2">
                              {recentlyUsedPrompts.map((prompt) => (
                                <div
                                  key={`recent-${prompt.id}`}
                                  className="group p-3 rounded-md hover:bg-accent cursor-pointer"
                                  onClick={() => handlePromptClick(prompt)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{prompt.title}</span>
                                        {prompt.is_default && (
                                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
                                        {prompt.content}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => handleEditPrompt(e, prompt)}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      {!prompt.is_default && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                          onClick={(e) => handlePromptDeleteClick(e, prompt.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Uncategorized prompts shown flat - no header */}
                      {uncategorizedPrompts.map((prompt) => (
                        <div
                          key={prompt.id}
                          className="group p-3 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => handlePromptClick(prompt)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{prompt.title}</span>
                                {prompt.is_default && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
                                {prompt.content}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => handleEditPrompt(e, prompt)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {!prompt.is_default && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => handlePromptDeleteClick(e, prompt.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Categorized prompts with collapsible headers */}
                      {categorizedGroups.map(([category, categoryPrompts]) => (
                        <div key={category} className="space-y-1">
                          <Button
                            variant="ghost"
                            className="w-full justify-between hover:bg-accent"
                            onClick={() => toggleCategory(category)}
                          >
                            <span className="text-sm font-medium">
                              {category} ({categoryPrompts.length})
                            </span>
                            {expandedCategories.includes(category) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {expandedCategories.includes(category) && (
                            <div className="ml-4 space-y-1">
                              {categoryPrompts.map((prompt) => (
                                <div
                                  key={prompt.id}
                                  className="group p-3 rounded-md hover:bg-accent cursor-pointer"
                                  onClick={() => handlePromptClick(prompt)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{prompt.title}</span>
                                        {prompt.is_default && (
                                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                            Default
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
                                        {prompt.content}
                                      </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => handleEditPrompt(e, prompt)}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      {!prompt.is_default && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                          onClick={(e) => handlePromptDeleteClick(e, prompt.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </ScrollArea>
              </div>
              {/* Button fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-background border-t border-slate-200">
                <Button size="sm" className="w-full" onClick={handleCreatePrompt}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Prompt
                </Button>
              </div>
            </TabsContent>

            {/* Chat History Panel */}
            <TabsContent value="history" className="flex-1 mt-0 relative">
              <div className="absolute inset-0 bottom-[56px] overflow-hidden">
                <RightSidebarChatHistory />
              </div>
              {/* Button fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-background border-t border-slate-200">
                <Button size="sm" className="w-full" onClick={handleNewChat}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Chat
                </Button>
              </div>
            </TabsContent>

            {/* Personas Panel */}
            <TabsContent value="personas" className="flex-1 mt-0 relative">
              <div className="absolute inset-0 bottom-[56px] overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4">
                  {currentPersonasLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading personas...</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayedPersonas.map((persona) => (
                        <div
                          key={persona.id}
                          className={cn(
                            "p-3 rounded-md hover:bg-accent/50 group transition-colors cursor-pointer",
                            selectedPersona === persona.id && "bg-accent"
                          )}
                          onClick={() => handlePersonaClick(persona)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Bot className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{persona.name}</span>
                                {persona.is_default && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              {persona.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {persona.description}
                                </p>
                              )}
                            </div>
                            {/* Show edit/delete buttons in both views - handlers are context-aware */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPersona(persona);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              {!persona.is_default && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(persona.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </ScrollArea>
              </div>
              {/* Button fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-background border-t border-slate-200">
                <Button size="sm" className="w-full" onClick={handleCreatePersona}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Persona
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Persona Dialog */}
      <PersonaDialog
        open={personaDialogOpen}
        onOpenChange={setPersonaDialogOpen}
        persona={editingPersona}
        onSuccess={() => {
          // React Query will auto-invalidate on mutations
          setPersonaDialogOpen(false);
        }}
      />

      {/* Workspace Persona Dialog */}
      {currentWorkspaceId && (
        <SpacePersonaDialog
          open={workspacePersonaDialogOpen}
          persona={editingWorkspacePersona}
          onClose={() => {
            setWorkspacePersonaDialogOpen(false);
            setEditingWorkspacePersona(null);
          }}
          onSave={handleSaveWorkspacePersona}
        />
      )}

      {/* Delete Persona Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this persona? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePersona}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Prompt Dialog (Personal) */}
      <PromptDialog
        open={isPromptDialogOpen}
        onOpenChange={(open) => {
          setIsPromptDialogOpen(open);
          if (!open) setEditingPrompt(null);
        }}
        prompt={editingPrompt}
        onSave={async (title, content, category) => {
          if (editingPrompt) {
            await updatePrompt(editingPrompt.id, title, content, category);
          } else {
            await createPrompt(title, content, category);
          }
          setIsPromptDialogOpen(false);
          setEditingPrompt(null);
        }}
      />

      {/* Workspace Prompt Dialog */}
      {currentWorkspaceId && (
        <SpacePromptDialog
          open={workspacePromptDialogOpen}
          prompt={editingWorkspacePrompt}
          onClose={() => {
            setWorkspacePromptDialogOpen(false);
            setEditingWorkspacePrompt(null);
          }}
          onSave={handleSaveWorkspacePrompt}
        />
      )}

      {/* Delete Prompt Dialog */}
      <AlertDialog open={promptDeleteDialogOpen} onOpenChange={setPromptDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePrompt}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add to Workspace Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialogMode === 'add' 
                ? `Add ${confirmDialogType} to workspace?`
                : `${confirmDialogType === 'prompt' ? 'Prompt' : 'Persona'} already exists`
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogMode === 'add' ? (
                <>
                  Do you want to add "{(pendingItem as Prompt)?.title || (pendingItem as Persona)?.name}" to this workspace? 
                  It will be available to all team members.
                </>
              ) : (
                <>
                  A {confirmDialogType} named "{(pendingItem as Prompt)?.title || (pendingItem as Persona)?.name}" already exists in this workspace.
                  Would you like to replace it or add a new copy?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={skipWorkspaceAdd}>
              {confirmDialogMode === 'add' ? 'Just use it' : 'Cancel'}
            </AlertDialogCancel>
            {confirmDialogMode === 'replace' && (
              <Button variant="outline" onClick={confirmAddToWorkspace}>
                Add as New
              </Button>
            )}
            <AlertDialogAction onClick={confirmDialogMode === 'add' ? confirmAddToWorkspace : confirmReplaceInWorkspace}>
              {confirmDialogMode === 'add' ? 'Add to Workspace' : 'Replace Existing'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
