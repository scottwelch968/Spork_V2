import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Loader2,
  RefreshCw,
  Trash2,
  Download,
  CalendarIcon,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  User,
  Building2,
  MessageSquare,
  Brain,
  Layers,
  Settings2,
  Code2,
  GitBranch,
  BarChart3,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { useCosmoDebug } from '@/hooks/useCosmoDebug';
import type { DebugEntry } from '@/presentation/types';

export function CosmoDebugTab() {
  const {
    logs,
    totalLogs,
    isLoggingEnabled,
    toggleLogging,
    isTogglingLogging,
    clearLogs,
    isClearingLogs,
    exportToText,
    getLogsCountInRange,
    refetch,
    isLoading,
    filters,
    updateFilter,
    clearFilters,
  } = useCosmoDebug();

  const [selectedLog, setSelectedLog] = useState<DebugEntry | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    session: true,
    message: true,
    decision: true,
    context: true,
    params: false,
    apiRequest: false,
    fallback: true,
    metrics: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExport = () => {
    const startDate = exportStartDate ? new Date(exportStartDate) : null;
    const endDate = exportEndDate ? new Date(exportEndDate) : null;
    exportToText(startDate, endDate);
    setExportDialogOpen(false);
  };

  const exportLogsCount = getLogsCountInRange(
    exportStartDate ? new Date(exportStartDate) : null,
    exportEndDate ? new Date(exportEndDate) : null
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Debug Logging</CardTitle>
              <CardDescription>
                Capture detailed COSMO decision-making data
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isLoggingEnabled}
                  onCheckedChange={toggleLogging}
                  disabled={isTogglingLogging}
                />
                <Label>{isLoggingEnabled ? 'Enabled' : 'Disabled'}</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, model, workspace..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {filters.startDate ? format(filters.startDate, 'PP') : 'Start Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate || undefined}
                  onSelect={(date) => updateFilter('startDate', date || null)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {filters.endDate ? format(filters.endDate, 'PP') : 'End Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate || undefined}
                  onSelect={(date) => updateFilter('endDate', date || null)}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {/* Session Type */}
            <Select 
              value={filters.sessionType} 
              onValueChange={(value: 'all' | 'personal' | 'workspace') => updateFilter('sessionType', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Session Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
              </SelectContent>
            </Select>

            {/* Operation Type */}
            <Select 
              value={filters.operationType} 
              onValueChange={(value: 'all' | 'chat' | 'enhance_prompt') => updateFilter('operationType', value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="enhance_prompt">Enhancement</SelectItem>
              </SelectContent>
            </Select>

            {/* Actions */}
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={clearLogs} disabled={isClearingLogs}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Log List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Logs ({totalLogs})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No debug logs found
                  </p>
                ) : (
                  logs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors",
                        selectedLog?.id === log.id 
                          ? "bg-primary/10 border border-primary/20" 
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {log.success ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {log.detected_intent || 'unknown'}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.original_message.slice(0, 50)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        {log.response_time_ms && (
                          <Badge variant="outline" className="text-xs py-0">
                            {log.response_time_ms}ms
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Log Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Request Details</CardTitle>
            <CardDescription>
              {selectedLog 
                ? `Log ID: ${selectedLog.id.slice(0, 8)}...` 
                : 'Select a log to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <ScrollArea className="h-[550px]">
                <div className="space-y-3 pr-4">
                  {/* Session Info */}
                  <Collapsible open={expandedSections.session} onOpenChange={() => toggleSection('session')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Session Info</span>
                        </div>
                        {expandedSections.session ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-3">
                        <div className="flex items-center gap-4">
                          <Badge variant={selectedLog.success ? 'default' : 'destructive'}>
                            {selectedLog.success ? 'Success' : 'Failed'}
                          </Badge>
                          <Badge variant="outline" className="capitalize flex items-center gap-1">
                            {selectedLog.operation_type === 'enhance_prompt' ? (
                              <><Sparkles className="h-3 w-3" /> Enhance Prompt</>
                            ) : (
                              <><MessageSquare className="h-3 w-3" /> Chat</>
                            )}
                          </Badge>
                          {selectedLog.is_workspace_chat && (
                            <Badge variant="secondary">Workspace</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{selectedLog.user_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{selectedLog.user_email}</p>
                            </div>
                          </div>
                          {selectedLog.workspace_name && (
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{selectedLog.workspace_name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{selectedLog.workspace_id?.slice(0, 8)}...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Original Message */}
                  <Collapsible open={expandedSections.message} onOpenChange={() => toggleSection('message')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium">Original Message</span>
                        </div>
                        {expandedSections.message ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background">
                        <p className="whitespace-pre-wrap text-sm">{selectedLog.original_message}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* COSMO Decision */}
                  <Collapsible open={expandedSections.decision} onOpenChange={() => toggleSection('decision')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          <span className="font-medium">Cosmo Decision</span>
                        </div>
                        {expandedSections.decision ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Detected Category:</span>
                            <p className="font-medium capitalize">{selectedLog.detected_intent || 'None'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Auto-Select:</span>
                            <p className="font-medium">{selectedLog.auto_select_enabled ? 'Enabled' : 'Disabled'}</p>
                          </div>
                        </div>
                        
                        {selectedLog.auto_select_enabled && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">Cost Tier:</span>
                                <p className="font-medium">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                                    selectedLog.cost_tier === 'low' && 'bg-green-100 text-green-700',
                                    selectedLog.cost_tier === 'balanced' && 'bg-blue-100 text-blue-700',
                                    selectedLog.cost_tier === 'premium' && 'bg-purple-100 text-purple-700',
                                    !selectedLog.cost_tier && 'bg-muted text-muted-foreground'
                                  )}>
                                    <Zap className="h-3 w-3" />
                                    {selectedLog.cost_tier || 'N/A'}
                                  </span>
                                </p>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Models Considered:</span>
                                <p className="font-medium">{selectedLog.models_considered?.length || 'N/A'}</p>
                              </div>
                            </div>
                            {selectedLog.cosmo_routing_model && (
                              <div>
                                <span className="text-sm text-muted-foreground">Routed By:</span>
                                <p className="font-medium flex items-center gap-2">
                                  <Brain className="h-4 w-4 text-purple-500" />
                                  <code className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                    {selectedLog.cosmo_routing_model}
                                  </code>
                                </p>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">Requested:</span>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {selectedLog.requested_model === 'auto' ? 'Cosmo Ai' : (selectedLog.requested_model || 'N/A')}
                            </code>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-sm text-muted-foreground">Selected:</span>
                            <code className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                              {selectedLog.selected_model || 'N/A'}
                            </code>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Context Sources */}
                  <Collapsible open={expandedSections.context} onOpenChange={() => toggleSection('context')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="font-medium">Context Sources</span>
                        </div>
                        {expandedSections.context ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { key: 'ai_instructions', label: 'AI Instructions' },
                            { key: 'space_ai_instructions', label: 'Space AI Instructions' },
                            { key: 'compliance_rule', label: 'Compliance Rule' },
                            { key: 'persona', label: 'Persona' },
                            { key: 'personal_context', label: 'Personal Context' },
                            { key: 'knowledge_base', label: 'Knowledge Base' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              {selectedLog.context_sources?.[key as keyof typeof selectedLog.context_sources] ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm">{label}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            {selectedLog.context_sources?.history ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                              History {selectedLog.context_sources?.history && selectedLog.context_sources?.history_count 
                                ? `(${selectedLog.context_sources.history_count})` 
                                : ''}
                            </span>
                          </div>
                        </div>
                        
                        {selectedLog.full_system_prompt && (
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:underline">
                              <ChevronRight className="h-4 w-4" />
                              View Full System Prompt
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                                {selectedLog.full_system_prompt}
                              </pre>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Model Parameters */}
                  <Collapsible open={expandedSections.params} onOpenChange={() => toggleSection('params')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4" />
                          <span className="font-medium">Model Parameters</span>
                        </div>
                        {expandedSections.params ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Provider:</span>
                            <p className="font-medium">{selectedLog.model_provider || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Model:</span>
                            <p className="font-medium font-mono text-sm">{selectedLog.selected_model || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t">
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Temperature</span>
                            <span className="font-mono">{selectedLog.model_config?.temperature ?? 'N/A'}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Top-P</span>
                            <span className="font-mono">{selectedLog.model_config?.top_p ?? 'N/A'}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Max Tokens</span>
                            <span className="font-mono">{selectedLog.model_config?.max_tokens ?? 'N/A'}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Freq Penalty</span>
                            <span className="font-mono">{selectedLog.model_config?.frequency_penalty ?? 'N/A'}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Pres Penalty</span>
                            <span className="font-mono">{selectedLog.model_config?.presence_penalty ?? 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* API Request/Response */}
                  <Collapsible open={expandedSections.apiRequest} onOpenChange={() => toggleSection('apiRequest')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-4 w-4" />
                          <span className="font-medium">API Request/Response</span>
                          {selectedLog.openrouter_request_id && (
                            <span className="text-xs text-muted-foreground">(OpenRouter ID available)</span>
                          )}
                        </div>
                        {expandedSections.apiRequest ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-4">
                        {selectedLog.openrouter_request_id && (
                          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                            <div>
                              <span className="text-sm text-muted-foreground block">OpenRouter Request ID</span>
                              <code className="text-sm font-mono">{selectedLog.openrouter_request_id}</code>
                            </div>
                            <a 
                              href={`https://openrouter.ai/activity?id=${selectedLog.openrouter_request_id}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              View in OpenRouter
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                        
                        {selectedLog.api_request_body ? (
                          <div>
                            <span className="text-sm font-medium block mb-2">Request Body</span>
                            <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                              {JSON.stringify(selectedLog.api_request_body, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No API request body captured
                          </div>
                        )}
                        
                        {selectedLog.api_response_headers && Object.keys(selectedLog.api_response_headers).length > 0 && (
                          <div>
                            <span className="text-sm font-medium block mb-2">Response Headers</span>
                            <div className="p-3 bg-muted rounded-lg space-y-1 max-h-48 overflow-y-auto">
                              {Object.entries(selectedLog.api_response_headers).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 text-xs">
                                  <span className="font-mono text-muted-foreground min-w-[200px]">{key}:</span>
                                  <span className="font-mono break-all">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Fallback Chain */}
                  <Collapsible open={expandedSections.fallback} onOpenChange={() => toggleSection('fallback')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">Fallback Chain</span>
                          {selectedLog.fallback_used && (
                            <span className="ml-2 text-sm text-destructive font-medium">(Fallback Used)</span>
                          )}
                        </div>
                        {expandedSections.fallback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-2">
                        {selectedLog.tiers_attempted && selectedLog.tiers_attempted.length > 0 ? (
                          selectedLog.tiers_attempted.map((tier, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/30">
                              {tier.success ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-destructive" />
                              )}
                              <span className="font-medium min-w-[60px]">TIER {tier.tier}</span>
                              <span className="text-sm text-muted-foreground">({tier.tier_name})</span>
                              <code className="text-sm bg-muted px-2 py-0.5 rounded flex-1">{tier.model}</code>
                              <span className="text-sm text-muted-foreground">{tier.provider}</span>
                              <span className={cn("text-sm font-medium", tier.success ? 'text-green-600' : 'text-destructive')}>
                                {tier.success ? 'Success' : `Failed${tier.error ? ` (${tier.error})` : ''}`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No tier attempt data available
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Response Metrics */}
                  <Collapsible open={expandedSections.metrics} onOpenChange={() => toggleSection('metrics')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-medium">Response Metrics</span>
                        </div>
                        {expandedSections.metrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background">
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <span className="text-xs text-muted-foreground block mb-1">Response Time</span>
                            <span className="text-lg font-bold">
                              {selectedLog.response_time_ms ? `${selectedLog.response_time_ms}ms` : 'N/A'}
                            </span>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <span className="text-xs text-muted-foreground block mb-1">Prompt Tokens</span>
                            <span className="text-lg font-bold">{selectedLog.prompt_tokens ?? 'N/A'}</span>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <span className="text-xs text-muted-foreground block mb-1">Completion Tokens</span>
                            <span className="text-lg font-bold">{selectedLog.completion_tokens ?? 'N/A'}</span>
                          </div>
                          <div className="text-center p-3 bg-muted/30 rounded">
                            <span className="text-xs text-muted-foreground block mb-1">Est. Cost</span>
                            <span className="text-lg font-bold">
                              {selectedLog.cost ? `$${Number(selectedLog.cost).toFixed(6)}` : 'N/A'}
                            </span>
                          </div>
                        </div>
                        {selectedLog.error_message && (
                          <div className="mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">Error:</span>
                            <p className="text-sm text-destructive mt-1 p-3 bg-destructive/10 rounded-md">
                              {selectedLog.error_message}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[550px] text-muted-foreground">
                <Eye className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a log entry to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Debug Logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date Range (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {exportLogsCount} logs will be exported
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exportLogsCount === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
