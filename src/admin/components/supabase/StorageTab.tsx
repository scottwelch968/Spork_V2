import React, { useEffect, useState, useRef } from 'react';
import { SupabaseCredentials, StorageBucket, StorageFile } from './types';
import { storageClient } from './services/storageClient';
import { supabaseService } from './services/supabaseService';
import { aiService } from './services/aiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/admin/ui/card';
import { Button } from '@/admin/ui/button';
import { Input } from '@/admin/ui/input';
import { Label } from '@/admin/ui/label';
import { Textarea } from '@/admin/ui/textarea';
import { Switch } from '@/admin/ui/switch';
import { Badge } from '@/admin/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/admin/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/admin/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/admin/ui/alert-dialog';
import { Loader2, Folder, Upload, Trash2, Lock, Unlock, Settings, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePublicModels } from '@/hooks/usePublicModels';

interface Props {
  creds: SupabaseCredentials;
}

const QUICK_PROMPTS = [
  "Public Read Access (Anyone can download)",
  "Authenticated Uploads (Logged in users can upload)",
  "Owner Access Only (Users manage their own files)",
  "Restrict to Images (Only allow image/* mime types)"
];

export const SupabaseStorageTab: React.FC<Props> = ({ creds }) => {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  
  // Loading States
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'files' | 'settings' | 'policies'>('files');
  const [error, setError] = useState<string | null>(null);

  // Create Bucket
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketPublic, setNewBucketPublic] = useState(false);
  const [deleteBucketId, setDeleteBucketId] = useState<string | null>(null);

  // Policy / AI
  const [aiPolicyPrompt, setAiPolicyPrompt] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [generatingSql, setGeneratingSql] = useState(false);
  const [executingSql, setExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const [existingPolicies, setExistingPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get models - use defaults to prevent crashes
  let activeModels: any[] = [];
  let modelsLoading = false;
  try {
    const modelsResult = usePublicModels();
    activeModels = Array.isArray(modelsResult?.activeModels) ? modelsResult.activeModels : [];
    modelsLoading = modelsResult?.isLoading ?? false;
  } catch (err) {
    console.warn('Could not load models:', err);
    activeModels = [];
    modelsLoading = false;
  }

  useEffect(() => {
    storageClient.init(creds);
    loadBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  useEffect(() => {
    if (selectedBucket) {
      listFiles(selectedBucket.name);
      setGeneratedSql('');
      setSqlResult(null);
      setExistingPolicies([]);
    } else {
      setFiles([]);
    }
  }, [selectedBucket]);

  useEffect(() => {
    if (activeTab === 'policies' && selectedBucket) {
      fetchPolicies();
    }
  }, [activeTab, selectedBucket]);

  const loadBuckets = async () => {
    if (!creds.serviceRoleKey) {
      setError("Service Role Key is required to manage Storage. Please add it in Settings.");
      return;
    }
    setLoadingBuckets(true);
    try {
      const data = await storageClient.listBuckets();
      setBuckets(data);
      if (data.length > 0 && !selectedBucket) {
        setSelectedBucket(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to load buckets: ${err.message}`);
    } finally {
      setLoadingBuckets(false);
    }
  };

  const listFiles = async (bucketName: string) => {
    setLoadingFiles(true);
    try {
      const data = await storageClient.listFiles(bucketName);
      setFiles(data);
    } catch (err: any) {
      toast.error(`Failed to load files: ${err.message}`);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchPolicies = async () => {
    if (!creds.serviceRoleKey) {
      toast.error('Service Role Key required to fetch policies');
      return;
    }
    setLoadingPolicies(true);
    try {
      const sql = `
        SELECT policyname, cmd, roles, qual, with_check 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects';
      `;
      const res = await supabaseService.executeSql(creds, sql);
      setExistingPolicies(Array.isArray(res) ? res : []);
    } catch (err: any) {
      console.error("Failed to fetch policies", err);
      toast.error(`Failed to fetch policies: ${err.message}`);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storageClient.createBucket(newBucketName, newBucketPublic);
      setNewBucketName('');
      setNewBucketPublic(false);
      setIsCreateModalOpen(false);
      toast.success('Bucket created successfully');
      loadBuckets();
    } catch (err: any) {
      toast.error(`Failed to create bucket: ${err.message}`);
    }
  };

  const handleDeleteBucket = async () => {
    if (!deleteBucketId) return;
    try {
      await storageClient.deleteBucket(deleteBucketId);
      if (selectedBucket?.id === deleteBucketId) {
        setSelectedBucket(null);
      }
      toast.success('Bucket deleted successfully');
      setDeleteBucketId(null);
      loadBuckets();
    } catch (err: any) {
      toast.error(`Failed to delete bucket: ${err.message}`);
    }
  };

  const handleTogglePublic = async () => {
    if (!selectedBucket) return;
    try {
      await storageClient.updateBucket(selectedBucket.id, !selectedBucket.public);
      setSelectedBucket({...selectedBucket, public: !selectedBucket.public});
      toast.success(`Bucket is now ${!selectedBucket.public ? 'public' : 'private'}`);
      loadBuckets();
    } catch (err: any) {
      toast.error(`Failed to update bucket: ${err.message}`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBucket || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      await storageClient.uploadFile(selectedBucket.name, file.name, file);
      toast.success('File uploaded successfully');
      listFiles(selectedBucket.name);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!selectedBucket) return;
    try {
      await storageClient.deleteFile(selectedBucket.name, fileName);
      setFiles(files.filter(f => f.name !== fileName));
      toast.success('File deleted successfully');
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleGeneratePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBucket || !aiPolicyPrompt.trim() || !selectedModel) {
      toast.error('Please enter a prompt and select a model');
      return;
    }
    setGeneratingSql(true);
    setSqlResult(null);
    
    try {
      const existingNames = existingPolicies.map(p => p.policyname).join(', ');

      const prompt = `Create a Postgres RLS (Row Level Security) policy SQL for Supabase Storage.
Target Bucket: "${selectedBucket.name}"
User Requirement: ${aiPolicyPrompt}

Context:
- Target Table: 'storage.objects'
- Existing Policies: ${existingNames || 'None'}
- Columns available: bucket_id, name, owner, auth.uid(), metadata
- Helper functions: storage.foldername(name) returns text[], storage.extension(name) returns text

Instructions:
- Return ONLY the raw SQL code.
- Use unique policy names that describe the rule.
- FOR SELECT (Read): Use 'USING (...)'.
- FOR INSERT (Upload): Use 'WITH CHECK (...)'.
- FOR UPDATE/DELETE: Use 'USING (...)'.
- MANDATORY: Always include "bucket_id = '${selectedBucket.name}'" in the check.

Examples:
1. Public Read: CREATE POLICY "Public Read ${selectedBucket.name}" ON storage.objects FOR SELECT TO public USING (bucket_id = '${selectedBucket.name}');
2. Auth Upload: CREATE POLICY "Auth Upload ${selectedBucket.name}" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${selectedBucket.name}' AND auth.uid() = owner);
`;

      const sql = await aiService.askAssistant(prompt, creds, selectedModel);
      // Clean up the response
      let cleanedSql = sql.trim();
      cleanedSql = cleanedSql.replace(/^```sql\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
      setGeneratedSql(cleanedSql);
    } catch (err: any) {
      toast.error(`AI Generation failed: ${err.message}`);
    } finally {
      setGeneratingSql(false);
    }
  };

  const handleExecutePolicy = async () => {
    if (!generatedSql) return;
    setExecutingSql(true);
    try {
      await supabaseService.executeSql(creds, generatedSql);
      setSqlResult("Policy applied successfully.");
      setGeneratedSql('');
      fetchPolicies();
      toast.success('Policy applied successfully');
    } catch (err: any) {
      setSqlResult(`Error: ${err.message}`);
      toast.error(`Failed to execute policy: ${err.message}`);
    } finally {
      setExecutingSql(false);
    }
  };

  const handleDeletePolicy = async (policyName: string) => {
    try {
      await supabaseService.executeSql(creds, `DROP POLICY "${policyName}" ON storage.objects;`);
      toast.success('Policy deleted successfully');
      fetchPolicies();
    } catch (err: any) {
      toast.error(`Failed to delete policy: ${err.message}`);
    }
  };

  // Filter policies relevant to current bucket
  const relevantPolicies = existingPolicies.filter(p => {
    if (!selectedBucket) return false;
    const term = selectedBucket.name;
    return p.policyname?.includes(term) || 
           (p.qual && p.qual.includes(term)) || 
           (p.with_check && p.with_check.includes(term));
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-roboto-slab font-bold text-admin-text">File Storage</h2>
        <p className="text-sm text-admin-text-muted mt-1">Manage buckets, files, and access permissions</p>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Buckets */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">Buckets</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {loadingBuckets ? (
                <div className="p-4 text-center text-admin-text-muted text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : buckets.length === 0 ? (
                <div className="p-4 text-center text-admin-text-muted text-sm italic">
                  No buckets found.
                </div>
              ) : (
                buckets.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBucket(b)}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${
                      selectedBucket?.id === b.id
                        ? 'bg-admin-accent-muted text-admin-text font-semibold'
                        : 'text-admin-text-muted hover:bg-admin-bg-muted hover:text-admin-text'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {b.public ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      <span className="font-mono text-xs">{b.name}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedBucket ? (
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="policies">Access Policies (RLS)</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  {/* FILES TAB */}
                  <TabsContent value="files" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-admin-text">Files</h3>
                        <p className="text-xs text-admin-text-muted font-mono">Bucket: {selectedBucket.name}</p>
                      </div>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Button
                          onClick={handleUploadClick}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload File
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {loadingFiles ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-admin-text-muted" />
                      </div>
                    ) : files.length === 0 ? (
                      <div className="border-2 border-dashed border-admin-border rounded-lg p-12 text-center">
                        <Folder className="h-12 w-12 text-admin-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-admin-text-muted">This bucket is empty.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map(f => (
                          <Card key={f.id || f.name} className="group hover:border-admin-accent transition-colors">
                            <CardContent className="p-3">
                              <div className="aspect-square bg-admin-bg-muted rounded mb-2 overflow-hidden flex items-center justify-center relative">
                                {f.metadata?.mimetype?.startsWith('image/') ? (
                                  <img
                                    src={storageClient.getPublicUrl(selectedBucket.name, f.name)}
                                    alt={f.name}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  />
                                ) : (
                                  <FileText className="h-8 w-8 text-admin-text-muted" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a
                                    href={storageClient.getPublicUrl(selectedBucket.name, f.name)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-admin-bg-elevated rounded-full hover:bg-admin-accent transition-colors"
                                    title="Open"
                                  >
                                    ↗
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteFile(f.name)}
                                    className="p-2 h-auto"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-admin-text truncate font-mono" title={f.name}>
                                {f.name}
                              </div>
                              <div className="text-[10px] text-admin-text-muted mt-1 flex justify-between">
                                <span>{(f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) : '0')} KB</span>
                                <span>{new Date(f.created_at).toLocaleDateString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* SETTINGS TAB */}
                  <TabsContent value="settings" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-admin-text mb-4">Bucket Visibility</h3>
                      <p className="text-sm text-admin-text-muted mb-6">
                        Public buckets allow unauthenticated download access to files via their public URL. Private buckets require signed URLs or authenticated RLS access.
                      </p>
                      <div className="flex items-center justify-between bg-admin-bg-muted p-4 rounded-lg border border-admin-border">
                        <span className="font-mono text-sm text-admin-text">
                          {selectedBucket.public ? 'Public Bucket' : 'Private Bucket'}
                        </span>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={selectedBucket.public}
                            onCheckedChange={handleTogglePublic}
                          />
                          <span className="text-sm text-admin-text-muted">
                            {selectedBucket.public ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Card className="bg-red-500/10 border-red-500/50">
                      <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                        <p className="text-sm text-red-500/80">
                          Deleting a bucket is permanent and cannot be undone. The bucket must be empty before deletion.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          onClick={() => setDeleteBucketId(selectedBucket.id)}
                        >
                          Delete Bucket '{selectedBucket.name}'
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* POLICIES TAB */}
                  <TabsContent value="policies" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-admin-text mb-4">Active Policies (storage.objects)</h3>
                      {loadingPolicies ? (
                        <div className="text-sm text-admin-text-muted">Loading policies...</div>
                      ) : relevantPolicies.length === 0 ? (
                        <div className="text-sm text-admin-text-muted italic">No active RLS policies found for this bucket.</div>
                      ) : (
                        <div className="space-y-2">
                          {relevantPolicies.map((p, i) => (
                            <Card key={i}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-admin-text">{p.policyname}</span>
                                    <Badge variant="outline" className="text-xs">{p.cmd}</Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePolicy(p.policyname)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                                {p.qual && (
                                  <div className="text-xs font-mono text-admin-text-muted mt-2 truncate" title={p.qual}>
                                    <span className="text-admin-text-muted">USING:</span> {p.qual}
                                  </div>
                                )}
                                {p.with_check && (
                                  <div className="text-xs font-mono text-admin-text-muted mt-1 truncate" title={p.with_check}>
                                    <span className="text-admin-text-muted">CHECK:</span> {p.with_check}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>AI Access Policy Generator</CardTitle>
                        <p className="text-sm text-admin-text-muted">
                          Describe who should access this bucket. The AI will generate the Row Level Security (RLS) SQL to enforce these rules.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <form onSubmit={handleGeneratePolicy} className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={aiPolicyPrompt}
                              onChange={(e) => setAiPolicyPrompt(e.target.value)}
                              placeholder="e.g. Allow authenticated users to upload files to their own folder"
                              className="flex-1"
                            />
                            <select
                              value={selectedModel}
                              onChange={(e) => setSelectedModel(e.target.value)}
                              className="px-3 py-2 bg-admin-bg-muted border border-admin-border rounded text-sm"
                              disabled={modelsLoading}
                            >
                              <option value="">Select model</option>
                              {activeModels.map((model) => (
                                <option key={model.model_id} value={model.model_id}>
                                  {model.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              type="submit"
                              disabled={generatingSql || !aiPolicyPrompt.trim() || !selectedModel}
                            >
                              {generatingSql ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                'Generate'
                              )}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map(p => (
                              <Button
                                key={p}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setAiPolicyPrompt(p)}
                              >
                                {p}
                              </Button>
                            ))}
                          </div>
                        </form>

                        {generatedSql && (
                          <div className="space-y-4">
                            <div>
                              <Label>Generated SQL (Editable)</Label>
                              <Textarea
                                value={generatedSql}
                                onChange={(e) => setGeneratedSql(e.target.value)}
                                className="font-mono text-sm min-h-[120px] mt-1"
                                spellCheck={false}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setGeneratedSql('')}
                              >
                                Discard
                              </Button>
                              <Button
                                onClick={handleExecutePolicy}
                                disabled={executingSql}
                              >
                                {executingSql ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Executing...
                                  </>
                                ) : (
                                  'Run SQL Policy'
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {sqlResult && (
                          <div className={`p-4 rounded-lg text-sm font-mono ${
                            sqlResult.startsWith('Error')
                              ? 'bg-red-500/10 text-red-600 border border-red-500/50'
                              : 'bg-green-500/10 text-green-600 border border-green-500/50'
                          }`}>
                            {sqlResult}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-admin-text-muted">
                  <Folder className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a bucket to manage files and permissions.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Bucket Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Bucket</DialogTitle>
            <DialogDescription>Create a new storage bucket</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBucket} className="space-y-4">
            <div>
              <Label htmlFor="bucket-name">Bucket Name</Label>
              <Input
                id="bucket-name"
                type="text"
                required
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
                placeholder="avatars"
                className="font-mono mt-1"
              />
            </div>
            <div className="flex items-center gap-3 bg-admin-bg-muted p-3 rounded-lg border border-admin-border">
              <Switch
                id="isPublic"
                checked={newBucketPublic}
                onCheckedChange={setNewBucketPublic}
              />
              <div>
                <Label htmlFor="isPublic" className="cursor-pointer">Public Bucket</Label>
                <p className="text-xs text-admin-text-muted">Files can be accessed without auth.</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Bucket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Bucket Confirmation */}
      <AlertDialog open={!!deleteBucketId} onOpenChange={(open) => !open && setDeleteBucketId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bucket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bucket? This action cannot be undone. The bucket must be empty first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBucket} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
