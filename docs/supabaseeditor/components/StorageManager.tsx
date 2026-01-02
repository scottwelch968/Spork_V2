import React, { useEffect, useState, useRef } from 'react';
import { SupabaseCredentials, StorageBucket, StorageFile } from '../types';
import { storageClient } from '../services/storageClient';
import { supabaseService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';

interface Props {
  creds: SupabaseCredentials;
}

const QUICK_PROMPTS = [
  "Public Read Access (Anyone can download)",
  "Authenticated Uploads (Logged in users can upload)",
  "Owner Access Only (Users manage their own files)",
  "Restrict to Images (Only allow image/* mime types)"
];

export const StorageManager: React.FC<Props> = ({ creds }) => {
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

  // Policy / AI
  const [aiPolicyPrompt, setAiPolicyPrompt] = useState('');
  const [generatedSql, setGeneratedSql] = useState('');
  const [generatingSql, setGeneratingSql] = useState(false);
  const [executingSql, setExecutingSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const [existingPolicies, setExistingPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storageClient.init(creds);
    loadBuckets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  useEffect(() => {
      if (selectedBucket) {
          listFiles(selectedBucket.name);
          // Clear previous SQL context when changing buckets
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
        setError("Service Role Key is required to manage Storage. Please reconnect with the key.");
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
          console.error(err);
      } finally {
          setLoadingFiles(false);
      }
  };

  const fetchPolicies = async () => {
      setLoadingPolicies(true);
      try {
          // Fetch policies specifically for storage.objects and this bucket (though RLS is table-wide, we filter visually)
          const sql = `
            SELECT policyname, cmd, roles, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'storage' AND tablename = 'objects';
          `;
          const res = await supabaseService.executeSql(creds, sql);
          setExistingPolicies(res);
      } catch (err) {
          console.error("Failed to fetch policies", err);
      } finally {
          setLoadingPolicies(false);
      }
  };

  const handleCreateBucket = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await storageClient.createBucket(newBucketName, newBucketPublic);
          setNewBucketName('');
          setIsCreateModalOpen(false);
          loadBuckets();
      } catch (err: any) {
          alert("Failed to create bucket: " + err.message);
      }
  };

  const handleDeleteBucket = async () => {
      if (!selectedBucket) return;
      const confirmMsg = `Are you sure you want to delete bucket '${selectedBucket.name}'? It must be empty first.`;
      if (!confirm(confirmMsg)) return;

      try {
          await storageClient.deleteBucket(selectedBucket.id);
          setSelectedBucket(null);
          loadBuckets();
      } catch (err: any) {
          alert("Failed to delete bucket: " + err.message);
      }
  };

  const handleTogglePublic = async () => {
      if (!selectedBucket) return;
      try {
          await storageClient.updateBucket(selectedBucket.id, !selectedBucket.public);
          loadBuckets(); // Refresh to update state
          // Optimistically update local state
          setSelectedBucket({...selectedBucket, public: !selectedBucket.public});
      } catch (err: any) {
          alert("Failed to update bucket: " + err.message);
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
          listFiles(selectedBucket.name);
      } catch (err: any) {
          alert("Upload failed: " + err.message);
      } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleDeleteFile = async (fileName: string) => {
      if (!selectedBucket || !confirm(`Delete ${fileName}?`)) return;
      try {
          await storageClient.deleteFile(selectedBucket.name, fileName);
          setFiles(files.filter(f => f.name !== fileName));
      } catch (err: any) {
          alert("Delete failed: " + err.message);
      }
  };

  // --- AI Policies Logic ---

  const handleGeneratePolicy = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBucket || !aiPolicyPrompt.trim()) return;
      setGeneratingSql(true);
      setSqlResult(null);
      
      try {
          const existingNames = existingPolicies.map(p => p.policyname).join(', ');

          // Construct a specific prompt for storage policies
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
          
          const sql = await geminiService.generateSql(prompt);
          setGeneratedSql(sql);
      } catch (err) {
          alert("AI Generation failed");
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
          setGeneratedSql(''); // Clear draft on success
          fetchPolicies(); // Refresh list
      } catch (err: any) {
          setSqlResult(`Error: ${err.message}`);
      } finally {
          setExecutingSql(false);
      }
  };

  const handleDeletePolicy = async (policyName: string) => {
      if (!confirm(`Are you sure you want to delete policy '${policyName}'? This may affect access immediately.`)) return;
      try {
          await supabaseService.executeSql(creds, `DROP POLICY "${policyName}" ON storage.objects;`);
          fetchPolicies();
      } catch (err: any) {
          alert("Failed to delete policy: " + err.message);
      }
  };

  // Filter policies to only show those relevant to the current bucket
  // Heuristic: Check if policy name or definitions contain the bucket name
  const relevantPolicies = existingPolicies.filter(p => {
      if (!selectedBucket) return false;
      const term = selectedBucket.name;
      return p.policyname.includes(term) || 
             (p.qual && p.qual.includes(term)) || 
             (p.with_check && p.with_check.includes(term));
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-3xl font-bold text-white tracking-tight">File Storage</h2>
                 <p className="text-supa-400 mt-1">Manage buckets, files, and access permissions.</p>
             </div>
        </div>

        {error ? (
            <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-red-200 text-center">
                <p className="text-xl font-bold mb-2">Access Error</p>
                <p>{error}</p>
            </div>
        ) : (
            <div className="flex flex-1 gap-6 min-h-0">
                {/* Sidebar: Buckets */}
                <div className="w-64 bg-supa-950 border border-supa-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-supa-800 bg-supa-900 flex justify-between items-center">
                        <h3 className="font-bold text-supa-200 text-sm uppercase tracking-wider">Buckets</h3>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-supa-800 hover:bg-supa-700 text-supa-200 hover:text-white p-1 px-2 rounded text-xs transition-colors"
                        >
                            + New
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingBuckets ? (
                            <div className="p-4 text-xs text-supa-500 text-center">Loading...</div>
                        ) : buckets.map(b => (
                            <button 
                                key={b.id}
                                onClick={() => setSelectedBucket(b)}
                                className={`w-full text-left px-3 py-2.5 rounded text-sm flex items-center justify-between group transition-colors ${
                                    selectedBucket?.id === b.id 
                                    ? 'bg-supa-800 text-white shadow-sm' 
                                    : 'text-supa-400 hover:bg-supa-900 hover:text-supa-200'
                                }`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <span>{b.public ? '🔓' : '🔒'}</span>
                                    <span className="font-mono">{b.name}</span>
                                </span>
                            </button>
                        ))}
                        {buckets.length === 0 && !loadingBuckets && (
                            <div className="p-4 text-xs text-supa-600 italic text-center">No buckets found.</div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-supa-950 border border-supa-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
                    {selectedBucket ? (
                        <>
                            {/* Bucket Header / Tabs */}
                            <div className="border-b border-supa-800 bg-supa-900 p-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setActiveTab('files')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'files' ? 'bg-supa-800 text-white' : 'text-supa-400 hover:text-white'}`}
                                    >
                                        Files
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('policies')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'policies' ? 'bg-supa-800 text-white' : 'text-supa-400 hover:text-white'}`}
                                    >
                                        Access Policies (RLS)
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('settings')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-supa-800 text-white' : 'text-supa-400 hover:text-white'}`}
                                    >
                                        Settings
                                    </button>
                                </div>
                                <div className="px-4 text-xs font-mono text-supa-500">
                                    Bucket: <span className="text-supa-200">{selectedBucket.name}</span>
                                </div>
                            </div>

                            {/* Content based on Tab */}
                            <div className="flex-1 overflow-auto bg-supa-950 p-6 relative">
                                {/* Upload Progress Bar */}
                                {uploading && (
                                    <div className="absolute top-0 left-0 w-full z-10">
                                        <div className="h-1 w-full bg-supa-800 overflow-hidden">
                                            <div className="h-full bg-supa-accent animate-progress-indeterminate"></div>
                                        </div>
                                        <div className="bg-supa-900/90 text-center py-1 text-xs text-supa-200 border-b border-supa-800 backdrop-blur-sm">
                                            Uploading file...
                                        </div>
                                    </div>
                                )}

                                {/* FILES TAB */}
                                {activeTab === 'files' && (
                                    <>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Files</h3>
                                            <div>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                                <button 
                                                    onClick={handleUploadClick}
                                                    disabled={uploading}
                                                    className="bg-supa-accent text-supa-950 font-bold px-4 py-2 rounded hover:bg-supa-accentDark disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                                                >
                                                    {uploading ? 'Uploading...' : '☁️ Upload File'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {files.length === 0 ? (
                                            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-supa-800 rounded-xl text-supa-500">
                                                <span className="text-4xl mb-2">📂</span>
                                                <p>This bucket is empty.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {files.map(f => (
                                                    <div key={f.id} className="group relative bg-supa-900 border border-supa-800 rounded-lg p-3 hover:border-supa-600 transition-all">
                                                        <div className="aspect-square bg-supa-950 rounded mb-2 overflow-hidden flex items-center justify-center relative">
                                                            {f.metadata?.mimetype?.startsWith('image/') ? (
                                                                <img 
                                                                    src={storageClient.getPublicUrl(selectedBucket.name, f.name)} 
                                                                    alt={f.name} 
                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                />
                                                            ) : (
                                                                <span className="text-4xl text-supa-700">📄</span>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                <a 
                                                                    href={storageClient.getPublicUrl(selectedBucket.name, f.name)}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-2 bg-supa-700 rounded-full hover:bg-white hover:text-black transition-colors"
                                                                    title="Open"
                                                                >
                                                                    ↗
                                                                </a>
                                                                <button 
                                                                    onClick={() => handleDeleteFile(f.name)}
                                                                    className="p-2 bg-red-900/80 text-red-200 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-supa-300 truncate font-mono" title={f.name}>{f.name}</div>
                                                        <div className="text-[10px] text-supa-600 mt-1 flex flex-col gap-0.5">
                                                            <div className="flex justify-between">
                                                                <span>{(f.metadata?.size / 1024).toFixed(1)} KB</span>
                                                                <span>{new Date(f.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="truncate text-supa-500 opacity-75 font-mono text-[9px]" title={f.metadata?.mimetype}>
                                                                {f.metadata?.mimetype || 'unknown'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* SETTINGS TAB */}
                                {activeTab === 'settings' && (
                                    <div className="max-w-xl mx-auto space-y-8 pt-8">
                                        <div className="bg-supa-900 border border-supa-800 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-white mb-4">Bucket Visibility</h3>
                                            <p className="text-sm text-supa-400 mb-6">
                                                Public buckets allow unauthenticated download access to files via their public URL. Private buckets require signed URLs or authenticated RLS access.
                                            </p>
                                            <div className="flex items-center justify-between bg-supa-950 p-4 rounded-lg border border-supa-800">
                                                <span className="font-mono text-sm text-supa-200">
                                                    {selectedBucket.public ? 'Public Bucket' : 'Private Bucket'}
                                                </span>
                                                <button 
                                                    onClick={handleTogglePublic}
                                                    className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                                                        selectedBucket.public 
                                                        ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-800 hover:bg-yellow-900/50' 
                                                        : 'bg-supa-700 text-supa-300 hover:bg-supa-600'
                                                    }`}
                                                >
                                                    {selectedBucket.public ? 'Make Private' : 'Make Public'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                                            <p className="text-sm text-red-200/60 mb-6">
                                                Deleting a bucket is permanent and cannot be undone. The bucket must be empty before deletion.
                                            </p>
                                            <button 
                                                onClick={handleDeleteBucket}
                                                className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-4 py-2 rounded text-sm font-bold transition-all w-full"
                                            >
                                                Delete Bucket '{selectedBucket.name}'
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* POLICIES TAB */}
                                {activeTab === 'policies' && (
                                    <div className="max-w-2xl mx-auto space-y-6">
                                        {/* Existing Policies List */}
                                        <div className="bg-supa-900 border border-supa-800 rounded-xl p-4">
                                            <h3 className="text-sm font-bold text-supa-300 uppercase tracking-wider mb-3">Active Policies (storage.objects)</h3>
                                            {loadingPolicies ? (
                                                <div className="text-xs text-supa-500 italic">Loading policies...</div>
                                            ) : relevantPolicies.length === 0 ? (
                                                <div className="text-xs text-supa-500 italic">No active RLS policies found for this bucket.</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {relevantPolicies.map((p, i) => (
                                                        <div key={i} className="bg-supa-950 p-2 rounded border border-supa-800 flex flex-col gap-1">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-white">{p.policyname}</span>
                                                                    <span className="text-[10px] bg-supa-800 px-1.5 rounded text-supa-400">{p.cmd}</span>
                                                                </div>
                                                                <button 
                                                                    onClick={() => handleDeletePolicy(p.policyname)}
                                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
                                                                    title="Delete Policy"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                            <div className="text-[10px] font-mono text-supa-500 truncate" title={p.qual}>
                                                                <span className="text-supa-600">USING:</span> {p.qual}
                                                            </div>
                                                            {p.with_check && (
                                                                <div className="text-[10px] font-mono text-supa-500 truncate" title={p.with_check}>
                                                                    <span className="text-supa-600">CHECK:</span> {p.with_check}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gradient-to-r from-supa-900 to-supa-800 border border-supa-700 rounded-xl p-6 shadow-lg">
                                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                                <span>🤖</span> AI Access Policy Generator
                                            </h3>
                                            <p className="text-sm text-supa-400 mb-4">
                                                Describe who should access this bucket. The AI will generate the Row Level Security (RLS) SQL to strictly enforce these rules.
                                            </p>
                                            
                                            <form onSubmit={handleGeneratePolicy} className="mb-4">
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={aiPolicyPrompt}
                                                        onChange={(e) => setAiPolicyPrompt(e.target.value)}
                                                        placeholder="e.g. Allow authenticated users to upload files to their own folder"
                                                        className="flex-1 bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent"
                                                    />
                                                    <button 
                                                        type="submit"
                                                        disabled={generatingSql || !aiPolicyPrompt.trim()}
                                                        className="bg-supa-accent text-supa-950 font-bold px-6 py-2 rounded-lg hover:bg-supa-accentDark disabled:opacity-50 transition-colors"
                                                    >
                                                        {generatingSql ? 'Generating...' : 'Generate'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {QUICK_PROMPTS.map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setAiPolicyPrompt(p)}
                                                            className="text-[10px] bg-supa-800 hover:bg-supa-700 text-supa-300 px-2 py-1 rounded-full transition-colors border border-supa-700"
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </form>

                                            {generatedSql && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                    <div className="bg-black/50 rounded-lg border border-supa-700 relative group overflow-hidden">
                                                        <div className="bg-supa-900 px-4 py-2 border-b border-supa-800 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-supa-400 uppercase tracking-wider">Generated SQL (Editable)</span>
                                                        </div>
                                                        <textarea 
                                                            value={generatedSql}
                                                            onChange={(e) => setGeneratedSql(e.target.value)}
                                                            className="w-full bg-transparent p-4 text-xs font-mono text-green-300 whitespace-pre-wrap focus:outline-none min-h-[120px] resize-y"
                                                            spellCheck={false}
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex justify-end gap-3">
                                                         <button 
                                                            onClick={() => setGeneratedSql('')}
                                                            className="text-xs text-supa-500 hover:text-supa-300 py-2"
                                                        >
                                                            Discard
                                                        </button>
                                                        <button 
                                                            onClick={handleExecutePolicy}
                                                            disabled={executingSql}
                                                            className="bg-supa-800 hover:bg-supa-700 text-white font-bold px-4 py-2 rounded text-sm transition-colors border border-supa-600"
                                                        >
                                                            {executingSql ? 'Executing...' : 'Run SQL Policy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {sqlResult && (
                                                <div className={`mt-4 p-4 rounded-lg text-sm font-mono ${sqlResult.startsWith('Error') ? 'bg-red-900/20 text-red-300 border border-red-900/50' : 'bg-green-900/20 text-green-300 border border-green-900/50'}`}>
                                                    {sqlResult}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-supa-500">
                            <span className="text-6xl mb-4 opacity-20">🪣</span>
                            <p>Select a bucket to manage files and permissions.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Create Bucket Modal */}
        {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-supa-900 border border-supa-700 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-supa-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">New Bucket</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-supa-400 hover:text-white">✕</button>
                    </div>
                    <form onSubmit={handleCreateBucket} className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-supa-400 uppercase tracking-wider mb-2">Bucket Name</label>
                            <input 
                                type="text" 
                                required
                                value={newBucketName}
                                onChange={(e) => setNewBucketName(e.target.value)}
                                placeholder="avatars"
                                className="w-full bg-supa-950 border border-supa-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-supa-accent"
                            />
                        </div>
                        <div className="flex items-center gap-3 bg-supa-950 p-3 rounded-lg border border-supa-800">
                            <input 
                                type="checkbox" 
                                id="isPublic"
                                checked={newBucketPublic}
                                onChange={(e) => setNewBucketPublic(e.target.checked)}
                                className="w-4 h-4 rounded border-supa-600 text-supa-accent focus:ring-supa-accent bg-supa-900"
                            />
                            <div>
                                <label htmlFor="isPublic" className="block text-sm font-bold text-white">Public Bucket</label>
                                <p className="text-xs text-supa-500">Files can be accessed without auth.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                             <button 
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-supa-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="bg-supa-accent text-supa-950 font-bold px-6 py-2 rounded-lg hover:bg-supa-accentDark"
                            >
                                Create Bucket
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};