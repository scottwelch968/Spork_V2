import { useState, useEffect } from 'react';
import { Settings, Github, Database, Save, Loader2, Eye, EyeOff, RefreshCw, Trash2, History, Shield, Box, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SporkProject, UpdateProjectData } from '@/types/sporkProject';
import { useGitHubSync } from '@/hooks/useGitHubSync';
import { useModels } from '@/hooks/useModels';
import { GitHistoryPanel } from './GitHistoryPanel';
import { BranchSelector } from './BranchSelector';

import { toast } from 'sonner';

interface EditorSettingsPanelProps {
  project: SporkProject | null;
  onUpdateProject: (data: UpdateProjectData) => void;
  onDeleteProject: (projectId: string) => void;
  isUpdating?: boolean;
}

export function EditorSettingsPanel({ 
  project, 
  onUpdateProject, 
  onDeleteProject,
  isUpdating 
}: EditorSettingsPanelProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ai_instructions: '',
    github_repo_url: '',
    github_branch: 'main',
    github_token: '',
    supabase_url: '',
    supabase_anon_key: '',
    supabase_service_role_key: '',
    codesandbox_api_key: '',
    default_model: '',
  });
  
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showServiceKey, setShowServiceKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testingGitHub, setTestingGitHub] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [showCodesandboxKey, setShowCodesandboxKey] = useState(false);

  // GitHub sync hook
  const {
    isConnected: isGitHubConnected,
    history,
    isLoadingHistory,
    branches,
    isLoadingBranches,
    pullLatest,
    createBranch,
    currentBranch,
    validateToken
  } = useGitHubSync(project);

  // Models hook
  const { models } = useModels();

  // Token validation state
  const [tokenStatus, setTokenStatus] = useState<{
    valid: boolean;
    tokenType: string;
    remaining: number;
    limit: number;
    user: string | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        ai_instructions: project.ai_instructions || '',
        github_repo_url: project.github_repo_url || '',
        github_branch: project.github_branch || 'main',
        github_token: project.github_token || '',
        supabase_url: project.supabase_url || '',
        supabase_anon_key: project.supabase_anon_key || '',
        supabase_service_role_key: project.supabase_service_role_key || '',
        codesandbox_api_key: (project as any).codesandbox_api_key || '',
        default_model: project.default_model || '',
      });
      setHasChanges(false);
    }
  }, [project]);

  // Filter models for coding/analysis
  const codingModels = models?.filter(m => 
    m.is_active && (m.best_for === 'coding' || m.best_for === 'analysis' || m.best_for === 'conversation')
  ) || [];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!project) return;
    
    onUpdateProject({
      id: project.id,
      name: formData.name,
      description: formData.description || undefined,
      ai_instructions: formData.ai_instructions || undefined,
      github_repo_url: formData.github_repo_url || undefined,
      github_branch: formData.github_branch || undefined,
      github_token: formData.github_token || undefined,
      supabase_url: formData.supabase_url || undefined,
      supabase_anon_key: formData.supabase_anon_key || undefined,
      supabase_service_role_key: formData.supabase_service_role_key || undefined,
      codesandbox_api_key: formData.codesandbox_api_key || undefined,
    } as any);
    setHasChanges(false);
  };

  const handleBranchChange = (branch: string) => {
    if (project) {
      onUpdateProject({ id: project.id, github_branch: branch });
    }
  };

  const handleCreateBranch = async (branchName: string, fromBranch: string) => {
    await createBranch.mutateAsync({ branchName, fromBranch });
  };

  const handleTestGitHub = async () => {
    const token = formData.github_token;
    
    if (!token) {
      toast.error('Please enter a Personal Access Token');
      return;
    }
    
    setTestingGitHub(true);
    setTokenStatus(null);
    
    try {
      const result = await validateToken.mutateAsync();
      
      setTokenStatus({
        valid: result.valid,
        tokenType: result.tokenType,
        remaining: result.rateLimit?.remaining ?? 0,
        limit: result.rateLimit?.limit ?? 0,
        user: result.user,
        error: result.error
      });
      
      if (result.valid) {
        toast.success(`✓ Token valid for @${result.user} (${result.rateLimit?.remaining}/${result.rateLimit?.limit} requests remaining)`);
      } else {
        toast.error(result.error || 'Token validation failed');
      }
    } catch (error: any) {
      toast.error('Failed to validate token: ' + error.message);
    } finally {
      setTestingGitHub(false);
    }
  };

  const handleTestSupabase = async () => {
    const url = formData.supabase_url;
    const anonKey = formData.supabase_anon_key;
    
    if (!url || !anonKey) {
      toast.error('Please enter both Project URL and Anon Key');
      return;
    }
    
    setTestingSupabase(true);
    try {
      // Test connection by hitting the health endpoint
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });
      
      if (response.ok || response.status === 200) {
        toast.success('✓ Connected to Supabase successfully');
      } else if (response.status === 401) {
        toast.error('Invalid Supabase anon key');
      } else {
        toast.error(`Supabase connection failed: ${response.status}`);
      }
    } catch (error) {
      toast.error('Failed to connect to Supabase - check URL');
    } finally {
      setTestingSupabase(false);
    }
  };

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select or create a project to configure settings</p>
        </div>
      </div>
    );
  }

  const isSupabaseConnected = !!project.supabase_url && !!project.supabase_anon_key;
  const isSandbox = project.is_system_sandbox;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSandbox && <Shield className="h-5 w-5 text-emerald-500" />}
            <div>
              <h2 className="text-xl font-semibold font-roboto-slab">Project Settings</h2>
              <p className="text-muted-foreground">Configure your project and integrations</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="history" disabled={!isGitHubConnected}>
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Basic project information and AI configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="My Awesome Project"
                    disabled={isSandbox}
                  />
                  {isSandbox && (
                    <p className="text-xs text-muted-foreground">
                      The Dev Sandbox name cannot be changed.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="A brief description of your project..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai_instructions">AI Instructions</Label>
                  <Textarea
                    id="ai_instructions"
                    value={formData.ai_instructions}
                    onChange={(e) => handleChange('ai_instructions', e.target.value)}
                    placeholder="Custom instructions for the AI when working on this project..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    These instructions will be included in every AI request for this project.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_model">Default AI Model</Label>
                  <Select
                    value={formData.default_model || 'auto'}
                    onValueChange={(value) => handleChange('default_model', value === 'auto' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <span>Cosmo AI (Auto)</span>
                        </div>
                      </SelectItem>
                      {codingModels.map((model) => (
                        <SelectItem key={model.id} value={model.model_id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The default model used for AI assistant in this project.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone - Hidden for sandbox */}
            {!isSandbox && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions for this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{project.name}" and all its settings. 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteProject(project.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6 mt-6">
            {/* GitHub Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">GitHub Integration</CardTitle>
                      <CardDescription>Connect to a GitHub repository for version control</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isGitHubConnected ? "default" : "secondary"}>
                    {isGitHubConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github_repo_url">Repository URL</Label>
                  <Input
                    id="github_repo_url"
                    value={formData.github_repo_url}
                    onChange={(e) => handleChange('github_repo_url', e.target.value)}
                    placeholder="https://github.com/username/repository"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="github_branch">Branch</Label>
                  {isGitHubConnected ? (
                    <div className="flex items-center gap-2">
                      <BranchSelector
                        branches={branches}
                        currentBranch={currentBranch}
                        isLoading={isLoadingBranches}
                        onBranchChange={handleBranchChange}
                        onCreateBranch={handleCreateBranch}
                      />
                    </div>
                  ) : (
                    <Input
                      id="github_branch"
                      value={formData.github_branch}
                      onChange={(e) => handleChange('github_branch', e.target.value)}
                      placeholder="main"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="github_token">Personal Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="github_token"
                      type={showGithubToken ? "text" : "password"}
                      value={formData.github_token}
                      onChange={(e) => handleChange('github_token', e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setShowGithubToken(!showGithubToken)}
                    >
                      {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create a token at GitHub → Settings → Developer settings → Personal access tokens (with repo scope)
                  </p>
                  
                  {/* Token Status Display */}
                  {tokenStatus && (
                    <div className={`mt-3 p-3 rounded-md text-sm ${
                      tokenStatus.valid 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className={`h-4 w-4 ${tokenStatus.valid ? 'text-green-500' : 'text-destructive'}`} />
                        <span className="font-medium">
                          {tokenStatus.valid ? 'Token Valid' : 'Token Issue Detected'}
                        </span>
                      </div>
                      {tokenStatus.valid ? (
                        <div className="space-y-1 text-muted-foreground">
                          <p>User: <span className="font-mono">@{tokenStatus.user}</span></p>
                          <p>Type: <span className="capitalize">{tokenStatus.tokenType}</span></p>
                          <p>Rate Limit: <span className="font-mono">{tokenStatus.remaining}/{tokenStatus.limit}</span> requests remaining</p>
                        </div>
                      ) : (
                        <div className="text-destructive/80">
                          <p>{tokenStatus.error}</p>
                          {tokenStatus.tokenType === 'unauthenticated' && (
                            <p className="mt-2 text-xs">
                              Your token is being treated as unauthenticated (60 req/hr limit). 
                              Make sure it has the <code className="bg-muted px-1 rounded">repo</code> scope for private repositories.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestGitHub}
                    disabled={testingGitHub || !formData.github_token}
                  >
                    {testingGitHub ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4 mr-2" />
                    )}
                    Validate Token
                  </Button>
                  {isGitHubConnected && (
                    <Button variant="outline" size="sm" onClick={pullLatest}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Pull Latest
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supabase Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">Supabase Configuration</CardTitle>
                      <CardDescription>Connect to your own Supabase project</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isSupabaseConnected ? "default" : "secondary"}>
                    {isSupabaseConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supabase_url">Project URL</Label>
                  <Input
                    id="supabase_url"
                    value={formData.supabase_url}
                    onChange={(e) => handleChange('supabase_url', e.target.value)}
                    placeholder="https://xxxxx.supabase.co"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supabase_anon_key">Anon Key (Public)</Label>
                  <Input
                    id="supabase_anon_key"
                    value={formData.supabase_anon_key}
                    onChange={(e) => handleChange('supabase_anon_key', e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="supabase_service_role_key">Service Role Key (Secret)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="supabase_service_role_key"
                      type={showServiceKey ? "text" : "password"}
                      value={formData.supabase_service_role_key}
                      onChange={(e) => handleChange('supabase_service_role_key', e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setShowServiceKey(!showServiceKey)}
                    >
                      {showServiceKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Find these in your Supabase dashboard → Settings → API
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleTestSupabase}
                    disabled={testingSupabase || !formData.supabase_url || !formData.supabase_anon_key}
                  >
                    {testingSupabase ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>


            {/* CodeSandbox Integration (Optional) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">CodeSandbox Preview (Optional)</CardTitle>
                      <CardDescription>Add an API key for higher rate limits</CardDescription>
                    </div>
                  </div>
                  <Badge variant={formData.codesandbox_api_key ? "default" : "outline"}>
                    {formData.codesandbox_api_key ? "API Key Set" : "Using Free Tier"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The preview works without an API key, but you may experience rate limits with heavy usage. 
                  Add an API key for better performance.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="codesandbox_api_key">API Key (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="codesandbox_api_key"
                      type={showCodesandboxKey ? "text" : "password"}
                      value={formData.codesandbox_api_key}
                      onChange={(e) => handleChange('codesandbox_api_key', e.target.value)}
                      placeholder="csb_xxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => setShowCodesandboxKey(!showCodesandboxKey)}
                    >
                      {showCodesandboxKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create an API key at codesandbox.io → Settings → API
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            {isGitHubConnected ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <History className="h-5 w-5" />
                      <div>
                        <CardTitle className="text-lg">Commit History</CardTitle>
                        <CardDescription>View and restore previous versions</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {currentBranch}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <GitHistoryPanel
                    history={history}
                    isLoading={isLoadingHistory}
                    onRestore={(commit) => {
                      toast.info(`Restore to commit ${commit.sha.substring(0, 7)} - Feature coming soon`);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Connect GitHub to view history</h3>
                <p className="text-muted-foreground text-sm">
                  Add a GitHub repository in the Integrations tab to enable version history.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
