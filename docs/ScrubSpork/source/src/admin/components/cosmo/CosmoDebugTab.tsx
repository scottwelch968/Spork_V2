import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Badge, Switch, Label, ScrollArea, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Popover, PopoverContent, PopoverTrigger, Calendar } from '@/admin/ui';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Search, Loader2, RefreshCw, Trash2, Download, CalendarIcon, CheckCircle2, XCircle, ChevronRight, ChevronDown, ChevronUp, User, Building2, MessageSquare, Brain, Sparkles, Zap } from 'lucide-react';
import { useCosmoDebug } from '@/hooks/useCosmoDebug';
import type { DebugEntry } from '@/presentation/types';

export function CosmoDebugTab() {
  const { logs, totalLogs, isLoggingEnabled, toggleLogging, isTogglingLogging, clearLogs, isClearingLogs, exportToText, getLogsCountInRange, refetch, isLoading, filters, updateFilter, clearFilters } = useCosmoDebug();

  const [selectedLog, setSelectedLog] = useState<DebugEntry | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>('');
  const [exportEndDate, setExportEndDate] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ session: true, message: true, decision: true, context: true, params: false, apiRequest: false, fallback: true, metrics: true });

  const toggleSection = (section: string) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };

  const handleExport = () => {
    const startDate = exportStartDate ? new Date(exportStartDate) : null;
    const endDate = exportEndDate ? new Date(exportEndDate) : null;
    exportToText(startDate, endDate);
    setExportDialogOpen(false);
  };

  const exportLogsCount = getLogsCountInRange(exportStartDate ? new Date(exportStartDate) : null, exportEndDate ? new Date(exportEndDate) : null);

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-base">Debug Logging</CardTitle><CardDescription>Capture detailed COSMO decision-making data</CardDescription></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={isLoggingEnabled} onCheckedChange={toggleLogging} disabled={isTogglingLogging} />
                <Label>{isLoggingEnabled ? 'Enabled' : 'Disabled'}</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by user, model, workspace..." value={filters.searchTerm} onChange={(e) => updateFilter('searchTerm', e.target.value)} className="pl-10" />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2"><CalendarIcon className="h-4 w-4" />{filters.startDate ? format(filters.startDate, 'PP') : 'Start Date'}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filters.startDate || undefined} onSelect={(date) => updateFilter('startDate', date || null)} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2"><CalendarIcon className="h-4 w-4" />{filters.endDate ? format(filters.endDate, 'PP') : 'End Date'}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filters.endDate || undefined} onSelect={(date) => updateFilter('endDate', date || null)} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            <Select value={filters.sessionType} onValueChange={(value: 'all' | 'personal' | 'workspace') => updateFilter('sessionType', value)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Session Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.operationType} onValueChange={(value: 'all' | 'chat' | 'enhance_prompt') => updateFilter('operationType', value)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Operation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operations</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="enhance_prompt">Enhancement</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setExportDialogOpen(true)}><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={clearLogs} disabled={isClearingLogs}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-base">Logs ({totalLogs})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-3">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No debug logs found</p>
                ) : (
                  logs.map((log) => (
                    <button key={log.id} onClick={() => setSelectedLog(log)} className={cn("w-full text-left p-3 rounded-lg transition-colors", selectedLog?.id === log.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted")}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {log.success ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                          <span className="text-sm font-medium capitalize">{log.detected_intent || 'unknown'}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{log.original_message.slice(0, 50)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                        {log.response_time_ms && <Badge variant="outline" className="text-xs py-0">{log.response_time_ms}ms</Badge>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Request Details</CardTitle><CardDescription>{selectedLog ? `Log ID: ${selectedLog.id.slice(0, 8)}...` : 'Select a log to view details'}</CardDescription></CardHeader>
          <CardContent>
            {selectedLog ? (
              <ScrollArea className="h-[550px]">
                <div className="space-y-3 pr-4">
                  <Collapsible open={expandedSections.session} onOpenChange={() => toggleSection('session')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2"><User className="h-4 w-4" /><span className="font-medium">Session Info</span></div>
                        {expandedSections.session ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-3">
                        <div className="flex items-center gap-4">
                          <Badge variant={selectedLog.success ? 'default' : 'destructive'}>{selectedLog.success ? 'Success' : 'Failed'}</Badge>
                          <Badge variant="outline" className="capitalize flex items-center gap-1">
                            {selectedLog.operation_type === 'enhance_prompt' ? <><Sparkles className="h-3 w-3" /> Enhance Prompt</> : <><MessageSquare className="h-3 w-3" /> Chat</>}
                          </Badge>
                          {selectedLog.is_workspace_chat && <Badge variant="secondary">Workspace</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div><p className="font-medium">{selectedLog.user_name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{selectedLog.user_email}</p></div>
                          </div>
                          {selectedLog.workspace_name && (
                            <div className="flex items-start gap-2">
                              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div><p className="font-medium">{selectedLog.workspace_name}</p><p className="text-xs text-muted-foreground font-mono">{selectedLog.workspace_id?.slice(0, 8)}...</p></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible open={expandedSections.message} onOpenChange={() => toggleSection('message')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /><span className="font-medium">Original Message</span></div>
                        {expandedSections.message ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background"><p className="whitespace-pre-wrap text-sm">{selectedLog.original_message}</p></div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible open={expandedSections.decision} onOpenChange={() => toggleSection('decision')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2"><Brain className="h-4 w-4" /><span className="font-medium">Cosmo Decision</span></div>
                        {expandedSections.decision ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-sm text-muted-foreground">Detected Category:</span><p className="font-medium capitalize">{selectedLog.detected_intent || 'None'}</p></div>
                          <div><span className="text-sm text-muted-foreground">Auto-Select:</span><p className="font-medium">{selectedLog.auto_select_enabled ? 'Enabled' : 'Disabled'}</p></div>
                        </div>
                        {selectedLog.auto_select_enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Cost Tier:</span>
                              <p className="font-medium">
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                                  selectedLog.cost_tier === 'low' && 'bg-green-100 text-green-700',
                                  selectedLog.cost_tier === 'balanced' && 'bg-blue-100 text-blue-700',
                                  selectedLog.cost_tier === 'premium' && 'bg-purple-100 text-purple-700',
                                  !selectedLog.cost_tier && 'bg-muted text-muted-foreground'
                                )}>
                                  <Zap className="h-3 w-3" />{selectedLog.cost_tier || 'N/A'}
                                </span>
                              </p>
                            </div>
                            <div><span className="text-sm text-muted-foreground">Selected Model:</span><p className="font-mono text-sm">{selectedLog.selected_model?.split('/').pop() || 'N/A'}</p></div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible open={expandedSections.metrics} onOpenChange={() => toggleSection('metrics')}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2"><Zap className="h-4 w-4" /><span className="font-medium">Metrics</span></div>
                        {expandedSections.metrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border rounded-lg mt-2 bg-background">
                        <div className="grid grid-cols-3 gap-4">
                          <div><span className="text-sm text-muted-foreground">Response Time</span><p className="font-bold">{selectedLog.response_time_ms || 0}ms</p></div>
                          <div><span className="text-sm text-muted-foreground">Prompt Tokens</span><p className="font-bold">{selectedLog.prompt_tokens || 0}</p></div>
                          <div><span className="text-sm text-muted-foreground">Completion Tokens</span><p className="font-bold">{selectedLog.completion_tokens || 0}</p></div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[550px] text-muted-foreground">Select a log from the list to view details</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Export Debug Logs</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Start Date (optional)</Label><Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>End Date (optional)</Label><Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} /></div>
            <p className="text-sm text-muted-foreground">{exportLogsCount} logs will be exported</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExport}><Download className="h-4 w-4 mr-2" />Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
